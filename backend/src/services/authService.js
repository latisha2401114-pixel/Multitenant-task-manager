const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../db/prisma');

const registerUser = async (tenantName, email, password, firstName, lastName) => {
  // Check if tenant already exists, or create a new one
  // For this simple implementation, we assume a new tenant is created upon registration if tenantName is provided
  // In a real app, there might be separate endpoints for Tenant Registration vs User Invitation
  
  let tenant;
  if (tenantName) {
    tenant = await prisma.tenant.create({
      data: { name: tenantName },
    });
  } else {
    throw new Error('Tenant name is required for registration');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: { email, tenantId: tenant.id },
  });

  if (existingUser) {
    throw new Error('User already exists in this tenant');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create user (first user is ADMIN)
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'ADMIN', // First user created is the admin of the tenant
    },
  });

  // Generate token
  const token = generateToken(user);

  return { user: formatUserResponse(user), token, tenant };
};

const loginUser = async (email, password) => {
  // Note: If users can belong to multiple tenants with the same email, we'd need tenantId during login.
  // Assuming email is unique across the platform for simplicity, or they select a tenant first.
  // For this phase, we just find the first user with this email.
  const user = await prisma.user.findFirst({
    where: { email },
    include: { tenant: true }
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Validate password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  // Generate token
  const token = generateToken(user);

  return { user: formatUserResponse(user), token, tenant: user.tenant };
};

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Helper to remove password from response
const formatUserResponse = (user) => {
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

module.exports = {
  registerUser,
  loginUser,
};

const jwt = require('jsonwebtoken');

// Middleware to validate JWT
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden: Token is invalid or expired' });
  }
};

// Middleware to extract tenant_id and enforce isolation
const tenantIsolation = (req, res, next) => {
  if (!req.user || !req.user.tenantId) {
    return res.status(403).json({ error: 'Forbidden: Tenant context missing' });
  }
  
  // Attach tenantId to request object explicitly for route handlers
  req.tenantId = req.user.tenantId;
  next();
};

// Middleware to restrict access to Admins only
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
};

module.exports = {
  requireAuth,
  tenantIsolation,
  requireAdmin,
};

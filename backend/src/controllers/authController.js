const authService = require('../services/authService');

const register = async (req, res) => {
  try {
    const { tenantName, email, password, firstName, lastName } = req.body;
    
    if (!email || !password || !tenantName) {
      return res.status(400).json({ error: 'Tenant name, email, and password are required' });
    }

    const result = await authService.registerUser(tenantName, email, password, firstName, lastName);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.loginUser(email, password);
    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
};

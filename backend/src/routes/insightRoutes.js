const express = require('express');
const router = express.Router();
const insightController = require('../controllers/insightController');
const { requireAuth, tenantIsolation } = require('../middleware/auth');

// Protect routes
router.use(requireAuth);
router.use(tenantIsolation);

// GET /api/insights/workload
router.get('/workload', insightController.getWorkload);

module.exports = router;

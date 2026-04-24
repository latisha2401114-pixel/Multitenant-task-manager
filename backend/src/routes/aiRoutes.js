const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { requireAuth, tenantIsolation } = require('../middleware/auth');

// Protect all AI routes
router.use(requireAuth);
router.use(tenantIsolation);

// POST /ai/suggest-tasks
router.post('/suggest-tasks', aiController.suggestTasks);

module.exports = router;

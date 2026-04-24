const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');
const { requireAuth, tenantIsolation, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createWorkflowSchema } = require('../validators/workflowValidator');

// Protect all workflow routes with authentication and tenant isolation
router.use(requireAuth);
router.use(tenantIsolation);

// GET /workflows
router.get('/', workflowController.getWorkflows);

// POST /workflows (Admin only)
router.post('/', requireAdmin, validate(createWorkflowSchema), workflowController.createWorkflow);

module.exports = router;

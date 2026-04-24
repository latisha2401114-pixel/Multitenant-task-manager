const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { requireAuth, tenantIsolation } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema } = require('../validators/taskValidator');

// Protect all task routes with auth and tenant isolation
router.use(requireAuth);
router.use(tenantIsolation);

// GET /tasks
router.get('/', taskController.getTasks);

// GET /tasks/:id
router.get('/:id', taskController.getTaskById);

// POST /tasks
router.post('/', validate(createTaskSchema), taskController.createTask);

// PUT /tasks/:id
router.put('/:id', validate(updateTaskSchema), taskController.updateTask);

// DELETE /tasks/:id
router.delete('/:id', taskController.deleteTask);

module.exports = router;

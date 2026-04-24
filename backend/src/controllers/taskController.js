const taskService = require('../services/taskService');

const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.tenantId, req.body);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {
    // support filtering via query params
    const filters = {
      workflowStageId: req.query.workflowStageId,
      assignedToId: req.query.assignedToId,
    };
    const tasks = await taskService.getTasks(req.tenantId, filters);
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.tenantId, req.params.id);
    res.status(200).json(task);
  } catch (error) {
    if (error.message === 'Task not found') {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.tenantId, req.params.id, req.body);
    res.status(200).json(task);
  } catch (error) {
    if (error.message === 'Task not found') {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
};

const deleteTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(req.tenantId, req.params.id);
    res.status(204).end();
  } catch (error) {
    if (error.message === 'Task not found') {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};

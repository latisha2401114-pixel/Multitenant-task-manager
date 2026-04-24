const workflowService = require('../services/workflowService');

const createWorkflow = async (req, res, next) => {
  try {
    const { name, description, stages } = req.body;
    const workflow = await workflowService.createWorkflow(req.tenantId, name, description, stages);
    res.status(201).json(workflow);
  } catch (error) {
    next(error);
  }
};

const getWorkflows = async (req, res, next) => {
  try {
    const workflows = await workflowService.getWorkflows(req.tenantId);
    res.status(200).json(workflows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorkflow,
  getWorkflows,
};

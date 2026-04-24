const insightService = require('../services/insightService');

const getWorkload = async (req, res, next) => {
  try {
    const insights = await insightService.getWorkloadInsights(req.tenantId, req.user.userId);
    res.status(200).json(insights);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkload
};

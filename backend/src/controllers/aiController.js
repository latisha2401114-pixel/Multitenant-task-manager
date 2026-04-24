const aiService = require('../services/aiService');

const suggestTasks = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required for AI suggestion' });
    }
    
    const suggestion = await aiService.suggestTasks(title, description);
    res.status(200).json(suggestion);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  suggestTasks
};

const helpChatService = require('../services/helpChat.service');

async function getQuota(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const result = await helpChatService.getHelpChatQuota(userId);
    return res.json(result);
  } catch (err) {
    console.error('Help chat quota error:', err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Failed to load quota',
    });
  }
}

async function chat(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const result = await helpChatService.askHelpChat({
      userId,
      message: req.body?.message,
      history: req.body?.history,
    });
    return res.json(result);
  } catch (err) {
    console.error('Help chat error:', err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Help chat failed',
    });
  }
}

module.exports = {
  getQuota,
  chat,
};

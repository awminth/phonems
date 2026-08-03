const express = require('express');
const helpChatController = require('../controllers/helpChat.controller');

const router = express.Router();

router.get('/quota', helpChatController.getQuota);
router.post('/', helpChatController.chat);

module.exports = router;

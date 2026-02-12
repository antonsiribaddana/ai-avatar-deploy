const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

// AI endpoints
router.post('/feedback', authenticate, aiController.generateFeedback);
router.get('/initial-question', authenticate, aiController.getInitialQuestion);
router.get('/test', aiController.testConnection);

module.exports = router;

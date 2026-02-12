const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');
const { authenticate } = require('../middleware/auth');

// All score routes require authentication
router.post('/save', authenticate, scoreController.saveScore);
router.get('/history', authenticate, scoreController.getScoreHistory);
router.get('/stats', authenticate, scoreController.getScoreStats);

module.exports = router;

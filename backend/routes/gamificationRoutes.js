const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamificationController');
const { authenticate } = require('../middleware/auth');

// Gamification endpoints
router.post('/update', authenticate, gamificationController.updateAchievements);
router.get('/achievements', authenticate, gamificationController.getAchievements);

module.exports = router;

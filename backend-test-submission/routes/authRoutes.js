const express = require('express');
const { register, login, logout, getProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;

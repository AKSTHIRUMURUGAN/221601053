const express = require('express');
const {
  createShortURL,
  redirectShortURL,
  getStats
} = require('../controllers/urlController');
const loggingMiddleware = require('../middleware/loggerMiddleware');

const router = express.Router();

router.post('/shorturls', loggingMiddleware, createShortURL);
router.get('/shorturls/:shortcode', loggingMiddleware, getStats);
router.get('/:shortcode', loggingMiddleware, redirectShortURL);

module.exports = router;

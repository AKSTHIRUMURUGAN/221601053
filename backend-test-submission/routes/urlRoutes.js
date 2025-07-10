const express = require('express');
const {
  createShortURL,
  redirectShortURL,
  getStats,
  deleteShortURL,
  updateShortURL,
  checkURLSecurity,
  debugShortURL,
  debugShortURLById
} = require('../controllers/urlController');
const loggingMiddleware = require('../middleware/loggerMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public route - no authentication required for redirects
router.get('/:shortcode', loggingMiddleware, redirectShortURL);

// Protected routes - authentication required
router.post('/shorturls', authMiddleware, loggingMiddleware, createShortURL);
router.get('/shorturls/:shortcode', authMiddleware, loggingMiddleware, getStats);
router.put('/shorturls/id/:id', authMiddleware, loggingMiddleware, updateShortURL);
router.delete('/shorturls/id/:id', authMiddleware, loggingMiddleware, deleteShortURL);
router.post('/check-security', authMiddleware, loggingMiddleware, checkURLSecurity);
router.get('/debug/:shortcode', authMiddleware, loggingMiddleware, debugShortURL);
router.get('/debug/id/:id', authMiddleware, loggingMiddleware, debugShortURLById);

module.exports = router;

const ShortURL = require('../models/ShortURL');
const User = require('../models/User');
const generateShortcode = require('../utils/generateShortCode');
const axios = require('axios');

// Link checker function to validate URLs
const checkLinkSecurity = async (url) => {
  try {
    // Basic URL validation
    const urlObj = new URL(url);
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i,
      /mailto:/i,
      /tel:/i,
      /sms:/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        return { safe: false, reason: 'Potentially unsafe URL scheme detected' };
      }
    }
    
    // Check for common phishing indicators
    const phishingIndicators = [
      /paypal.*\.com.*\.com/i,
      /google.*\.com.*\.com/i,
      /facebook.*\.com.*\.com/i,
      /amazon.*\.com.*\.com/i,
      /bank.*\.com.*\.com/i
    ];
    
    for (const pattern of phishingIndicators) {
      if (pattern.test(url)) {
        return { safe: false, reason: 'Potential phishing URL detected' };
      }
    }
    
    // Optional: Make a HEAD request to check if URL is accessible
    try {
      const response = await axios.head(url, { 
        timeout: 5000,
        maxRedirects: 5,
        validateStatus: () => true // Accept any status code
      });
      
      if (response.status >= 400) {
        return { safe: false, reason: 'URL is not accessible' };
      }
    } catch (error) {
      // If HEAD request fails, URL might still be valid but not accessible
      console.log('URL accessibility check failed:', error.message);
    }
    
    return { safe: true, reason: 'URL appears safe' };
  } catch (error) {
    return { safe: false, reason: 'Invalid URL format' };
  }
};

exports.createShortURL = async (req, res) => {
  const { url, shortcode, validity = 30 } = req.body;
  const userId = req.user; // From auth middleware

  if (!url) return res.status(400).json({ message: 'URL is required' });

  // Check URL security
  const securityCheck = await checkLinkSecurity(url);
  if (!securityCheck.safe) {
    return res.status(400).json({ 
      message: 'URL blocked for security reasons', 
      reason: securityCheck.reason 
    });
  }

  let finalShortcode = shortcode;
  
  // If custom shortcode provided, check if it already exists
  if (shortcode) {
    const existing = await ShortURL.findOne({ shortcode: finalShortcode });
    if (existing) {
      return res.status(409).json({ message: 'Shortcode already in use' });
    }
  } else {
    // Generate unique shortcode
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      finalShortcode = generateShortcode();
      const existing = await ShortURL.findOne({ shortcode: finalShortcode });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      return res.status(500).json({ message: 'Unable to generate unique shortcode' });
    }
  }

  const expiryDate = new Date(Date.now() + validity * 60 * 1000);

  try {
    // Create the shortened URL
    const shortUrl = await ShortURL.create({
      originalURL: url,
      shortcode: finalShortcode,
      expiryDate,
      user: userId,
    });

    // Add to user's shortened URLs
    await User.findByIdAndUpdate(
      userId,
      { $push: { shortenedUrls: shortUrl._id } }
    );

    res.status(201).json({
      shortLink: `http://localhost:5000/${shortUrl.shortcode}`,
      expiry: shortUrl.expiryDate.toISOString(),
      shortcode: shortUrl.shortcode,
    });
  } catch (err) {
    console.error('Error creating short URL:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.redirectShortURL = async (req, res) => {
  const { shortcode } = req.params;
  try {
    const shortUrl = await ShortURL.findOne({ shortcode });
    if (!shortUrl) return res.status(404).json({ message: 'Shortcode not found' });

    if (shortUrl.expiryDate < new Date()) {
      return res.status(410).json({ message: 'Short link expired' });
    }

    // Track click
    shortUrl.clicks.push({
      timestamp: new Date(),
      referrer: req.get('Referrer') || 'direct',
      location: 'IN', 
    });
    await shortUrl.save();

    res.redirect(shortUrl.originalURL);
  } catch (err) {
    console.error('Error redirecting:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getStats = async (req, res) => {
  const { shortcode } = req.params;
  const userId = req.user; // From auth middleware

  try {
    const shortUrl = await ShortURL.findOne({ shortcode, user: userId });
    if (!shortUrl) return res.status(404).json({ message: 'Shortcode not found' });

    res.status(200).json({
      originalURL: shortUrl.originalURL,
      createdAt: shortUrl.createdAt,
      expiryDate: shortUrl.expiryDate,
      clickCount: shortUrl.clicks.length,
      clickLogs: shortUrl.clicks,
    });
  } catch (err) {
    console.error('Error getting stats:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// New function to update a shortened URL
exports.updateShortURL = async (req, res) => {
  const { id } = req.params;
  const { url, validity } = req.body;
  const userId = req.user; // From auth middleware

  console.log('Update request:', { id, userId, url, validity });

  try {
    const shortUrl = await ShortURL.findOne({ _id: id, user: userId });
    console.log('Found URL for update:', shortUrl ? 'Yes' : 'No');
    
    if (!shortUrl) {
      console.log('URL not found for update:', { id, userId });
      return res.status(404).json({ message: 'URL not found' });
    }

    // Check if URL is expired
    const isExpired = shortUrl.expiryDate < new Date();
    console.log('URL expired status:', isExpired);

    // If URL is being updated, check security
    if (url) {
      const securityCheck = await checkLinkSecurity(url);
      if (!securityCheck.safe) {
        return res.status(400).json({ 
          message: 'URL blocked for security reasons', 
          reason: securityCheck.reason 
        });
      }
      shortUrl.originalURL = url;
    }

    // Update expiry if provided (this can extend expired URLs)
    if (validity) {
      const newExpiryDate = new Date(Date.now() + validity * 60 * 1000);
      shortUrl.expiryDate = newExpiryDate;
      console.log('Updated expiry date:', newExpiryDate);
    }

    await shortUrl.save();

    console.log('URL updated successfully');
    res.status(200).json({
      message: 'Short URL updated successfully',
      shortLink: `http://localhost:5000/${shortUrl.shortcode}`,
      expiry: shortUrl.expiryDate.toISOString(),
      shortcode: shortUrl.shortcode,
      wasExpired: isExpired,
      isNowActive: shortUrl.expiryDate > new Date()
    });
  } catch (err) {
    console.error('Error updating short URL:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// New function to delete a shortened URL
exports.deleteShortURL = async (req, res) => {
  const { id } = req.params;
  const userId = req.user; // From auth middleware

  console.log('Delete request:', { id, userId });

  try {
    const shortUrl = await ShortURL.findOne({ _id: id, user: userId });
    console.log('Found URL:', shortUrl ? 'Yes' : 'No');
    
    if (!shortUrl) {
      console.log('URL not found for delete:', { id, userId });
      return res.status(404).json({ message: 'URL not found' });
    }

    // Check if URL is expired (for logging purposes)
    const isExpired = shortUrl.expiryDate < new Date();
    console.log('URL expired status:', isExpired);

    // Remove from user's shortened URLs
    await User.findByIdAndUpdate(
      userId,
      { $pull: { shortenedUrls: shortUrl._id } }
    );

    // Delete the shortened URL
    await ShortURL.findByIdAndDelete(shortUrl._id);

    console.log('URL deleted successfully');
    res.status(200).json({ 
      message: 'Short URL deleted successfully',
      wasExpired: isExpired
    });
  } catch (err) {
    console.error('Error deleting short URL:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// New function to check URL security
exports.checkURLSecurity = async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ message: 'URL is required' });
  }

  try {
    const securityCheck = await checkLinkSecurity(url);
    res.status(200).json({
      safe: securityCheck.safe,
      reason: securityCheck.reason
    });
  } catch (err) {
    console.error('Error checking URL security:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Debug endpoint to help identify issues
exports.debugShortURL = async (req, res) => {
  const { shortcode } = req.params;
  const userId = req.user;

  try {
    console.log('Debug request:', { shortcode, userId });
    
    // Find all URLs with this shortcode
    const allUrls = await ShortURL.find({ shortcode });
    console.log('All URLs with shortcode:', allUrls.length);
    
    // Find URL for this specific user
    const userUrl = await ShortURL.findOne({ shortcode, user: userId });
    console.log('User URL found:', userUrl ? 'Yes' : 'No');
    
    // Get user's shortened URLs
    const user = await User.findById(userId).populate('shortenedUrls');
    console.log('User shortened URLs count:', user?.shortenedUrls?.length || 0);
    
    res.status(200).json({
      shortcode,
      userId,
      allUrlsCount: allUrls.length,
      userUrlFound: !!userUrl,
      userUrlsCount: user?.shortenedUrls?.length || 0,
      allUrls: allUrls.map(url => ({ id: url._id, user: url.user, shortcode: url.shortcode })),
      userUrls: user?.shortenedUrls?.map(url => ({ id: url._id, shortcode: url.shortcode, originalURL: url.originalURL })) || []
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Debug endpoint for ID-based operations
exports.debugShortURLById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user;

  try {
    console.log('Debug ID request:', { id, userId });
    
    // Find URL by ID
    const url = await ShortURL.findById(id);
    console.log('URL found by ID:', url ? 'Yes' : 'No');
    
    // Check if URL belongs to user
    const userUrl = await ShortURL.findOne({ _id: id, user: userId });
    console.log('User URL found by ID:', userUrl ? 'Yes' : 'No');
    
    // Get user's shortened URLs
    const user = await User.findById(userId).populate('shortenedUrls');
    console.log('User shortened URLs count:', user?.shortenedUrls?.length || 0);
    
    res.status(200).json({
      id,
      userId,
      urlFound: !!url,
      userUrlFound: !!userUrl,
      userUrlsCount: user?.shortenedUrls?.length || 0,
      url: url ? { id: url._id, shortcode: url.shortcode, originalURL: url.originalURL, user: url.user } : null,
      userUrls: user?.shortenedUrls?.map(url => ({ id: url._id, shortcode: url.shortcode, originalURL: url.originalURL })) || []
    });
  } catch (err) {
    console.error('Debug ID error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const ShortURL = require('../models/ShortURL');
const generateShortcode = require('../utils/generateShortCode');

exports.createShortURL = async (req, res) => {
  const { url, shortcode, validity = 30 } = req.body;

  if (!url) return res.status(400).json({ message: 'URL is required' });

  const finalShortcode = shortcode || generateShortcode();
  const expiryDate = new Date(Date.now() + validity * 60 * 1000);

  try {
    const existing = await ShortURL.findOne({ shortcode: finalShortcode });
    if (existing) return res.status(409).json({ message: 'Shortcode already in use' });

    const shortUrl = await ShortURL.create({
      originalURL: url,
      shortcode: finalShortcode,
      expiryDate,
    });

    res.status(201).json({
      shortLink: `http://localhost:5000/${shortUrl.shortcode}`,
      expiry: shortUrl.expiryDate.toISOString(),
    });
  } catch (err) {
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

    
    shortUrl.clicks.push({
      timestamp: new Date(),
      referrer: req.get('Referrer') || 'direct',
      location: 'IN', 
    });
    await shortUrl.save();

    res.redirect(shortUrl.originalURL);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getStats = async (req, res) => {
  const { shortcode } = req.params;
  try {
    const shortUrl = await ShortURL.findOne({ shortcode });
    if (!shortUrl) return res.status(404).json({ message: 'Shortcode not found' });

    res.status(200).json({
      originalURL: shortUrl.originalURL,
      createdAt: shortUrl.createdAt,
      expiryDate: shortUrl.expiryDate,
      clickCount: shortUrl.clicks.length,
      clickLogs: shortUrl.clicks,
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

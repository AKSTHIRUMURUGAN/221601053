const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Only check for token in HTTP-only cookies
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
};

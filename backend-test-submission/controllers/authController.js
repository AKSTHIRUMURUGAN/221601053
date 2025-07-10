const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ message: 'User registered', user: { id: newUser._id, name: newUser.name } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Set token in HTTP-only cookie for cross-origin (frontend-backend on different domains)
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Must be true for SameSite: 'none' and HTTPS
      sameSite: 'none', // Required for cross-site cookie
      maxAge: 60*60*1000, // 1 hour
      domain: '.onrender.com', // Allow subdomains (optional, but can help)
      path: '/', // Root path
    });

    res.status(200).json({ 
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logout successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  const userId = req.user; // From auth middleware

  try {
    const user = await User.findById(userId).populate('shortenedUrls');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      shortenedUrls: user.shortenedUrls || [],
      totalUrls: user.shortenedUrls ? user.shortenedUrls.length : 0
    });
  } catch (err) {
    console.error('Error getting profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

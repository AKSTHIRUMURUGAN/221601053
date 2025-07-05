const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));

app.get('/protected', require('./middleware/authMiddleware'), (req, res) => {
  res.status(200).json({ message: `Hello User ${req.user}` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

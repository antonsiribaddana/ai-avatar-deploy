const jwt = require('jsonwebtoken');

// JWT auth middleware
exports.authenticate = (req, res, next) => {
  try {
    // Get token from header (format: "Bearer TOKEN")
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user info to request
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();

  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

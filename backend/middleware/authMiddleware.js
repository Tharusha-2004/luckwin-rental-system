const jwt = require('jsonwebtoken');

/**
 * authMiddleware
 * Protects routes by verifying the JWT sent in the Authorization header.
 *
 * Expected header format:
 *   Authorization: Bearer <token>
 *
 * On success  → attaches decoded payload to req.user and calls next()
 * On failure  → responds with 401 Unauthorized
 */
const authMiddleware = (req, res, next) => {
  // 1. Extract the Authorization header
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.',
    });
  }

  // 2. Isolate the token string after "Bearer "
  const token = authHeader.split(' ')[1];

  // 3. Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, role, iat, exp }
    next();
  } catch (err) {
    // Distinguish between expired and truly invalid tokens for clearer errors
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid token. Please log in again.',
    });
  }
};

module.exports = authMiddleware;

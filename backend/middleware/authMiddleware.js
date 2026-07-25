const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: protect
 * Protects routes by validating JSON Web Tokens (JWT) passed in HTTP Authorization headers.
 * Extracts the user ID from valid tokens, fetches user details from MongoDB,
 * and attaches the authenticated user object to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check if Authorization header exists and follows 'Bearer <token>' format
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Extract token from header ('Bearer <token>')
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify token signature using JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Fetch user from database using decoded ID (exclude password field)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user account no longer exists',
        });
      }

      // 5. Proceed to the next middleware/controller handler
      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token verification failed or expired',
      });
    }
  }

  // 6. Handle case where no token was provided in request headers
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no authentication token provided',
    });
  }
};

module.exports = {
  protect,
};

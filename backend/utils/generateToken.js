const jwt = require('jsonwebtoken');

/**
 * Generates a signed JSON Web Token (JWT) for user authentication
 * @param {string} id - The MongoDB ObjectId of the user
 * @returns {string} - The signed JWT string
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token valid for 30 days
  });
};

module.exports = generateToken;

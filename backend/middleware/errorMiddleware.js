/**
 * Middleware: notFound
 * Handles requests to endpoints that do not exist on the server (404 Not Found).
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Middleware: errorHandler
 * Global error handler middleware for Express.
 * Formats error responses into standardized JSON objects.
 */
const errorHandler = (err, req, res, next) => {
  // If status code is 200 OK, change it to 500 Server Error
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = {
  notFound,
  errorHandler,
};

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Create HTTP Server for shared Express and Socket.IO handling
const server = http.createServer(app);

// Initialize Socket.IO server
initSocket(server);

// Security Middleware: Helmet HTTP Headers Configuration
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows static images in uploads folder to render in cross-origin frontend
  })
);

// Security Middleware: MongoDB Operator Injection Sanitization
app.use(mongoSanitize());

// Security Middleware: Rate Limiting Configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 20, // Limit each IP to 20 auth login/register requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
  },
});

// Middleware: CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Middleware: Body Parsers for JSON and URL-encoded payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply Rate Limiters
app.use('/api/v1', apiLimiter);
app.use('/api/v1/auth', authLimiter);

// Serve static uploads folder publicly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Unify Backend API is running safely' });
});

// API Routes
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/conversations', require('./routes/conversationRoutes'));
app.use('/api/v1/messages', require('./routes/messageRoutes'));

// Error Middleware Pipelines
app.use(notFound);
app.use(errorHandler);

// Start Server (Express + Socket.IO on shared HTTP Port)
const PORT = process.env.PORT || 8090;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

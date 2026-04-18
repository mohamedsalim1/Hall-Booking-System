const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');
const { corsConfig } = require('./middleware/corsConfig');
const { errorHandler } = require('./middleware/errorHandler');
const securityMiddleware = require('./middleware/security');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4503;

// // Security middleware
// securityMiddleware(app);

// CORS configuration
app.use(cors(corsConfig));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api', apiRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Luxury wedding hall booking API is active.',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Error handling (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

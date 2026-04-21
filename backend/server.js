const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const apiRoutes = require('./routes/api');
const { corsConfig } = require('./middleware/corsConfig');
const { errorHandler } = require('./middleware/errorHandler');
const securityMiddleware = require('./middleware/security');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4503;
const HOST = process.env.HOST || '127.0.0.1';
const frontendBuildPath = path.resolve(__dirname, '../frontend/build');

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
app.get('/health', (req, res) => {
  res.json({
    message: 'Luxury wedding hall booking API is active.',
    version: '1.0.0',
    status: 'healthy'
  });
});

const hasFrontendBuild = fs.existsSync(path.join(frontendBuildPath, 'index.html'));

if (hasFrontendBuild) {
  app.use(express.static(frontendBuildPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }

    return res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      message: 'Luxury wedding hall booking API is active.',
      version: '1.0.0',
      status: 'healthy'
    });
  });
}

// Error handling (must be last)
app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`Backend running at http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

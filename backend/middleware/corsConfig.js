const parseAllowedOrigins = () => {
  const envOrigins = [
    process.env.CLIENT_URL,
    process.env.CLIENT_ORIGIN,
    process.env.FRONTEND_URL,
    process.env.ALLOWED_ORIGINS
  ]
    .filter(Boolean)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return new Set([
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://localhost:4503',
    'http://127.0.0.1:4503',
    'http://localhost:4505',
    'http://127.0.0.1:4505',
    ...envOrigins,
  ]);
};

const isAllowedDevelopmentOrigin = (origin) => {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  try {
    const { protocol, hostname } = new URL(origin);
    return (
      (protocol === 'http:' || protocol === 'https:') &&
      (hostname === 'localhost' || hostname === '127.0.0.1')
    );
  } catch {
    return false;
  }
};

const corsConfig = {
  origin: function (origin, callback) {
    // Allow requests with no origin (desktop apps, curl, file://)
    if (!origin || origin === 'null') return callback(null, true);

    const allowedOrigins = parseAllowedOrigins();

    if (allowedOrigins.has(origin) || isAllowedDevelopmentOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

module.exports = { corsConfig };

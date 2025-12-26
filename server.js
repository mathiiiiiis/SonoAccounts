import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT;
const API_TARGET = process.env.API_TARGET;

if (!PORT) {
  console.error('ERROR: PORT environment variable is required!');
  console.error('Please set PORT in your .env file or environment');
  process.exit(1);
}

if (!API_TARGET) {
  console.error('ERROR: API_TARGET environment variable is required!');
  console.error('Please set API_TARGET in your .env file or environment');
  process.exit(1);
}

//security headers
app.use((req, res, next) => {
  res.header('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' https://*.sono.wtf http://*.sono.wtf https://raw.githubusercontent.com https://avatars.githubusercontent.com https://user-images.githubusercontent.com https://github.com data: blob:; " +
    "media-src 'self' https://*.sono.wtf http://*.sono.wtf https://github.com blob:; " +
    "connect-src 'self' https://lrclib.net https://api.github.com https://*.sono.wtf; " + 
    "frame-src https://*.sono.wtf;"
  );
  next();
});

//cors headers
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://web.sono.wtf',
    'https://sono.wtf',
    'https://www.sono.wtf'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Password-Encrypted');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }
  next();
});

//internal health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

//proxy middleware for /api routes
app.use('/api', createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  secure: true,
  followRedirects: false,
  ws: true,
  onProxyReq: (proxyReq, req, res) => {
    // DEBUG LOG
    // DONT FORGET IT DUMBAHH MATHIS
    console.log(`Proxying ${req.method} ${req.url} -> ${API_TARGET}${req.url}`);
    
    const targetUrl = new URL(API_TARGET);
    proxyReq.setHeader('Host', targetUrl.host);
  },
  onError: (err, req, res) => {
    console.error('API Proxy Error:', err.message);
    res.status(500).json({ error: 'API proxy server error' });
  }
}));

//api health proxy
app.use('/api-health', createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: false,
  secure: true,
  followRedirects: false,
  pathRewrite: {
    '^/api-health': '/health'
  },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Host', req.headers.host);
  },
  onError: (err, req, res) => {
    console.error('API Health Proxy Error:', err.message);
    res.status(500).json({ error: 'API health check proxy error' });
  }
}));

//body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

//serve favicon from public folder
app.use('/favicon.png', express.static(path.join(__dirname, 'public/images/favicon.png')));

//catch-all to serve "index.html" for SPA routing (after all other routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

//start server
app.listen(PORT, () => {
  const HOST_PORT = process.env.HOST_PORT || PORT;
  console.log(`SonoWeb Server running on http://localhost:${PORT}`);
  console.log(`Serving Vue app from: ${path.join(__dirname, 'dist')}`);
  console.log(`Proxying /api/* to ${API_TARGET}/api/v1/*`);
  console.log(`Proxying /api-health to ${API_TARGET}/health`);
  console.log(`Container internal port: ${PORT}, External access port: ${HOST_PORT}`);
});

//shutdown handling
process.on('SIGTERM', () => {
  console.log('Server shutting down gracefully');
  process.exit(0);
});
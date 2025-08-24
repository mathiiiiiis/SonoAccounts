const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT;
const API_TARGET = process.env.API_TARGET;

if (!PORT) {
  console.error('❌ ERROR: PORT environment variable is required!');
  console.error('Please set PORT in your .env file or environment');
  process.exit(1);
}

if (!API_TARGET) {
  console.error('❌ ERROR: API_TARGET environment variable is required!');
  console.error('Please set API_TARGET in your .env file or environment');
  process.exit(1);
}

app.use(express.static(path.join(__dirname, 'public')));
app.use('/styles/partials', express.static(path.join(__dirname, 'styles', 'partials')));

//cors middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  //handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

//health check endpoint
app.use('/health', createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  secure: true,
  followRedirects: false,
  onError: (err, req, res) => {
    console.error('Health Proxy Error:', err.message);
    res.status(500).json({ error: 'Health check proxy error' });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Health Check: ${req.method} ${req.url} -> ${proxyReq.path}`);
  }
}));

//proxy /api requests to https://api.sono.wtf/api/v1
app.use('/api', createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  secure: true,
  followRedirects: false,
  pathRewrite: {
    '^/api': '/api/v1'
  },
  onError: (err, req, res) => {
    console.error('API Proxy Error:', err.message);
    res.status(500).json({ error: 'API proxy server error' });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`API Request: ${req.method} ${req.url} -> ${proxyReq.path}`);
  }
}));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  const HOST_PORT = process.env.HOST_PORT || PORT;
  console.log(`🚀 CORS Proxy Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
  console.log(`🔄 Proxying /api/* to ${API_TARGET}/api/v1/*`);
  console.log(`ℹ️  Container internal port: ${PORT}, External access port: ${HOST_PORT}`);
});

//shutdown
process.on('SIGTERM', () => {
  console.log('👋 Server shutting down gracefully');
  process.exit(0);
});
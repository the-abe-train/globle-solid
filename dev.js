const { createServer } = require('http');
const { readFileSync, existsSync } = require('fs');
const { join, extname, resolve } = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = join(__dirname, 'public');
const DIST_DIR = join(__dirname, 'dist');

// MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Handle favicon requests
  if (req.url === '/favicon.ico') {
    const faviconPath = join(PUBLIC_DIR, 'favicon.ico');
    if (existsSync(faviconPath)) {
      res.setHeader('Content-Type', 'image/x-icon');
      res.end(readFileSync(faviconPath));
      return;
    }
    res.statusCode = 404;
    res.end();
    return;
  }

  try {
    // Parse URL path
    let filePath = req.url === '/' ? '/index.html' : req.url;

    // Sanitize file path to prevent directory traversal
    filePath = filePath.replace(/\.\.\//g, '').replace(/\/\//g, '/');

    // Try to find the file in public or dist directory
    let fullPath = join(PUBLIC_DIR, filePath);

    if (!existsSync(fullPath)) {
      fullPath = join(DIST_DIR, filePath);
    }

    if (!existsSync(fullPath)) {
      // If file doesn't exist and it's not an API request, serve index.html (SPA routing)
      if (!filePath.startsWith('/api/')) {
        fullPath = join(PUBLIC_DIR, 'index.html');
        if (!existsSync(fullPath)) {
          fullPath = join(DIST_DIR, 'index.html');
        }
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }
    }

    // Get file extension and content type
    const ext = extname(fullPath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Read file and send response
    const data = readFileSync(fullPath);
    res.setHeader('Content-Type', contentType);
    res.end(data);
  } catch (err) {
    console.error(`Error serving request: ${err.message}`);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Development server running at http://localhost:${PORT}`);
  console.log(`Serving from ${PUBLIC_DIR} and ${DIST_DIR}`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

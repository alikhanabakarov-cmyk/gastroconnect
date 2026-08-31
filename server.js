const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const rootDir = __dirname;

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'GastroConnect', timestamp: new Date().toISOString() });
});

// Middleware for clean URL resolving and static file serving
app.use((req, res, next) => {
  // Normalize pathname
  let reqPath = decodeURIComponent(req.path);
  if (reqPath.startsWith('/')) {
    reqPath = reqPath.slice(1);
  }

  // Potential candidates
  const candidates = [
    path.join(rootDir, reqPath),
    path.join(rootDir, reqPath, 'index.html'),
    path.join(rootDir, reqPath + '.html'),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return res.sendFile(candidate);
      }
    } catch {
      // Continue to next candidate
    }
  }

  next();
});

// Static assets fallback
app.use(express.static(rootDir));

// SPA / Default fallback to index.html if not found
app.use((req, res) => {
  const notFoundPath = path.join(rootDir, '404.html');
  if (fs.existsSync(notFoundPath)) {
    res.status(404).sendFile(notFoundPath);
  } else {
    res.status(404).sendFile(path.join(rootDir, 'index.html'));
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`GastroConnect server running on http://0.0.0.0:${PORT}`);
});

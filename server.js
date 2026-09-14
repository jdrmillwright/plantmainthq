const express = require('express');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';
const DIST_DIR = path.join(__dirname, 'dist');

// Ensure static files are built if missing
if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.log('[PlantMaintHQ] dist not found, generating static files...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('[PlantMaintHQ] Error building static site:', error);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'plantmainthq' });
});

// Serve static assets from dist (with index.html serving and extension matching)
app.use(express.static(DIST_DIR, { extensions: ['html'] }));

// Fallback to index.html for any unmatched routes
app.use((req, res) => {
  const indexFile = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).send('PlantMaintHQ - Page not found');
  }
});

app.listen(PORT, HOST, () => {
  console.log(`PlantMaintHQ running on http://${HOST}:${PORT}`);
});

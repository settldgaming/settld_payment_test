const express = require('express');
const path = require('path');
const fs = require('fs');
const apiApp = require('./api');
const configHandler = require('./api/config');

if (!process.env.VERCEL) {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (match) {
        const key = match[1];
        if (process.env[key] === undefined) {
          let value = match[2];
          if (/^['\"].*['\"]$/.test(value)) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
  }
}

const app = express();

app.get(['/config', '/config.js'], configHandler);

app.use(express.static(path.join(__dirname, 'public')));

app.use(apiApp);

const preferredPort = parseInt(process.env.PORT, 10) || 3000;

function start(port) {
  const server = app.listen(port);

  server.on('listening', () => {
    const address = server.address();
    console.log(`Server listening on http://localhost:${address.port}`);
  });

  if (!process.env.PORT) {
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} in use, trying a different port...`);
        start(0); // 0 lets the system pick an open port
      } else {
        throw err;
      }
    });
  }
}

start(preferredPort);
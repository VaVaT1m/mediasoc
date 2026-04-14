'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const config = require('./config');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));

const uploadsPath = path.join(__dirname, config.uploads.localUploadDir || 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));
app.use(express.static(path.join(__dirname, '..', 'project')));

function loadModeratorsFromFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        let parts = [];
        if (line.includes(':')) parts = line.split(':');
        else if (line.includes(',')) parts = line.split(',');
        else parts = line.split(/\s+/);
        const login = (parts[0] || '').trim();
        const password = parts.slice(1).join(':').trim();
        return login && password ? { login, password, role: 'moderator' } : null;
      })
      .filter(Boolean);
  } catch (error) {
    console.error('load moderators error', error);
    return [];
  }
}

(async () => {
  try {
    await db.init();

    const initial = Array.isArray(config.initialModerators) ? config.initialModerators : [];
    const moderatorsFilePath = path.join(__dirname, config.moderatorsFile || 'moderators.txt');
    const fromFile = loadModeratorsFromFile(moderatorsFilePath);

    const all = new Map();
    [...initial, ...fromFile].forEach(mod => {
      if (mod?.login && mod?.password) {
        all.set(mod.login, { login: mod.login, password: mod.password, role: mod.role || 'moderator' });
      }
    });

    for (const mod of all.values()) {
      const exists = await db.query('SELECT id FROM users WHERE login=$1', [mod.login]);
      if (exists.rowCount === 0) {
        const hash = await bcrypt.hash(String(mod.password), 10);
        await db.query(
          'INSERT INTO users (login, password_hash, role) VALUES ($1,$2,$3)',
          [mod.login, hash, mod.role]
        );
      }
    }

    console.log('DB initialized');
  } catch (error) {
    console.error('DB init error', error);
  }
})();

const authRouter = require('./routes/auth');
const channelsRouter = require('./routes/channels');

app.use(config.apiBase || '/api', authRouter);
app.use(`${config.apiBase || '/api'}/channels`, channelsRouter);

app.get('/channel/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'project', 'channel.html'));
});

app.get('/moderation', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'project', 'moderation.html'));
});

app.get('/add-channel', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'project', 'add-channel.html'));
});

app.get('/404', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'project', '404.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'project', 'index.html'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'project', '404.html'));
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`API listening on ${PORT}`);
});

server.keepAliveTimeout = 120000;
server.headersTimeout = 121000;

'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');

const router = express.Router();

async function handleLogin(req, res) {
  const { login, password } = req.body || {};

  if (!login || !password) {
    return res.status(400).json({ error: 'login & password required' });
  }

  try {
    const result = await db.query(
      'SELECT id, login, password_hash, role FROM users WHERE login=$1',
      [String(login).trim()]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'auth failed' });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'auth failed' });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, login: user.login, moderator_id: user.id },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

    return res.json({ token });
  } catch (error) {
    console.error('auth/login error', error);
    return res.status(500).json({ error: 'server error' });
  }
}

router.post('/login', handleLogin);
router.post('/auth/login', handleLogin);

module.exports = router;

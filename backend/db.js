'use strict';

const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  connectionString: config.db.connectionString
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      login TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE,
      name TEXT NOT NULL,
      logo TEXT,
      short_description TEXT NOT NULL,
      full_description TEXT,
      views INTEGER DEFAULT 0,
      category TEXT NOT NULL,
      nomination TEXT,
      implementation TEXT,
      regions TEXT[] DEFAULT '{}',
      contest TEXT,
      links JSONB DEFAULT '{}'::jsonb,
      contact JSONB DEFAULT '{}'::jsonb,
      status TEXT DEFAULT 'pending',
      date_added TIMESTAMPTZ DEFAULT now(),
      moderator_id TEXT,
      date_moderated TIMESTAMPTZ,
      history JSONB DEFAULT '[]'::jsonb,
      meta JSONB DEFAULT '{}'::jsonb
    );
  `);

  await pool.query(`ALTER TABLE channels ADD COLUMN IF NOT EXISTS slug TEXT;`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS channels_slug_idx ON channels(slug);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS channels_status_idx ON channels(status);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS channels_date_added_idx ON channels(date_added DESC);`);
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  init,
  pool
};

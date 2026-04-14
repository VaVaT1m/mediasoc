CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  login TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

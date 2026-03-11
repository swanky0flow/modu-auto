-- Sites / tenant
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT UNIQUE NOT NULL,
  niche TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Content calendar
CREATE TABLE IF NOT EXISTS calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL REFERENCES sites(id),
  target_keyword TEXT NOT NULL,
  secondary_keywords TEXT,
  search_intent TEXT,
  word_count INTEGER,
  affiliate_slots TEXT,
  internal_links TEXT,
  publish_date DATETIME,
  status TEXT DEFAULT 'scheduled',
  meta_description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL REFERENCES sites(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  meta_description TEXT,
  schema_json TEXT,
  hero_image TEXT,
  published_at DATETIME,
  status TEXT DEFAULT 'draft'
);

-- Images stored in R2 but metadata tracked here
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL REFERENCES sites(id),
  post_id INTEGER REFERENCES posts(id),
  r2_key TEXT NOT NULL,
  alt TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Affiliate links & clicks
CREATE TABLE IF NOT EXISTS affiliate_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL REFERENCES sites(id),
  label TEXT,
  url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id INTEGER REFERENCES affiliate_links(id),
  user_agent TEXT,
  ip TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Email subscribers
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL REFERENCES sites(id),
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AB tests
CREATE TABLE IF NOT EXISTS ab_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL REFERENCES sites(id),
  name TEXT,
  variant_a TEXT,
  variant_b TEXT,
  conversions_a INTEGER DEFAULT 0,
  conversions_b INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics rollups (mirrors Analytics Engine streaming)
CREATE TABLE IF NOT EXISTS analytics_rollup (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER REFERENCES sites(id),
  date DATE,
  pageviews INTEGER,
  uniques INTEGER,
  top_slug TEXT,
  subscribers INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

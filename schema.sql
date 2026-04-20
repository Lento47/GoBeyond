-- Social news storage for Cloudflare D1.
-- `social_sources` keeps the admin-editable list of monitored pages/accounts.
-- `noticias` stores normalized posts received from the webhook.

CREATE TABLE IF NOT EXISTS social_sources (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  plataforma TEXT NOT NULL CHECK (plataforma IN ('facebook', 'linkedin', 'instagram')),
  page_url TEXT NOT NULL,
  page_identifier TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_sources_plataforma_activo
  ON social_sources(plataforma, activo);

CREATE TABLE IF NOT EXISTS noticias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  imagen_url TEXT,
  url_original TEXT NOT NULL,
  fuente TEXT NOT NULL CHECK (fuente IN ('facebook', 'linkedin', 'instagram')),
  publicado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES social_sources(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_noticias_publicado_en
  ON noticias(publicado_en DESC);

CREATE INDEX IF NOT EXISTS idx_noticias_fuente_publicado
  ON noticias(fuente, publicado_en DESC);

INSERT OR IGNORE INTO social_sources (id, nombre, plataforma, page_url, page_identifier, activo)
VALUES
  (
    'source-facebook-gobeyond',
    'Go Beyond Facebook',
    'facebook',
    'https://www.facebook.com/people/Go-Beyond/61588185384903/',
    '61588185384903',
    1
  ),
  (
    'source-linkedin-gobeyond',
    'Go Beyond LinkedIn',
    'linkedin',
    'https://www.linkedin.com/company/go-beyondcri/posts/?feedView=all',
    'go-beyondcri',
    1
  ),
  (
    'source-instagram-gobeyond',
    'Go Beyond Instagram',
    'instagram',
    'https://www.instagram.com/gobeyondcr/',
    'gobeyondcr',
    1
  );

-- Wrangler v3 / D1 commands
-- 1. Create the database:
--    npx wrangler d1 create gobeyond-noticias
-- 2. Add the returned `database_id` under `[[d1_databases]]` with binding `DB`.
-- 3. Apply the migration locally:
--    npx wrangler d1 execute gobeyond-noticias --local --file=./schema.sql
-- 4. Apply the migration remotely:
--    npx wrangler d1 execute gobeyond-noticias --remote --file=./schema.sql

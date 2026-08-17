CREATE TABLE IF NOT EXISTS restaurants (
  id INTEGER PRIMARY KEY,
  name TEXT,
  url TEXT,
  menu_type TEXT CHECK(menu_type IN ('daily', 'weekly'))
);

-- Reference schema. The migrations in migrations/ are the source of truth; keep this in
-- sync with them. valid_from/valid_until/fetched_at are nullable because migration 0001
-- adds them to existing rows (SQLite can't add a NOT NULL column without a default). Rows
-- with null validity are simply hidden by the date filter until their next refresh.
CREATE TABLE IF NOT EXISTS menus (
  restaurant_id INTEGER PRIMARY KEY,
  mon TEXT,
  tue TEXT,
  wed TEXT,
  thu TEXT,
  fri TEXT,
  valid_from TEXT,
  valid_until TEXT,
  fetched_at TEXT,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

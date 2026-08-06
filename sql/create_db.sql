CREATE TABLE IF NOT EXISTS restaurants (
  id INTEGER PRIMARY KEY,
  name TEXT,
  url TEXT,
  menu_type TEXT CHECK(menu_type IN ('daily', 'weekly'))
);

CREATE TABLE IF NOT EXISTS menus (
  restaurant_id INTEGER PRIMARY KEY,
  mon TEXT,
  tue TEXT,
  wed TEXT,
  thu TEXT,
  fri TEXT,
  valid_from TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

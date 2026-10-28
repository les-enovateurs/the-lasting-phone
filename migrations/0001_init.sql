-- Schéma D1 (SQLite) équivalent aux tables MariaDB de backend/database/init.sql.
CREATE TABLE event (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    slug       TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at   TEXT
);

CREATE TABLE customer (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id          INTEGER NOT NULL REFERENCES event(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    email             TEXT NOT NULL,
    accept_recontact  INTEGER NOT NULL DEFAULT 0,
    accept_newsletter INTEGER NOT NULL DEFAULT 0,
    user_agent        TEXT NOT NULL,
    smartphone_model  TEXT,
    date_fabrication  TEXT,
    os_version        TEXT,
    image_path        TEXT,
    rank              INTEGER,
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX customer_event_id ON customer(event_id);

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = process.env.DB_DIR || './data';
const DB_PATH = path.join(DB_DIR, 'birthday-reminder.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database connection
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables if not exist
export function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT,
      role TEXT NOT NULL CHECK(role IN ('admin', 'visitor')),
      created_at TEXT NOT NULL
    )
  `);

  // People table
  db.exec(`
    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      birth_time TEXT,
      is_lunar INTEGER NOT NULL DEFAULT 0,
      gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
      category TEXT NOT NULL CHECK(category IN ('family', 'friend')),
      visible_to TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Insert default users if none exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, role, created_at)
      VALUES (?, ?, ?, ?)
    `);
    insertUser.run(crypto.randomUUID(), 'visitor', 'visitor', new Date().toISOString());
  }
}

export default db;

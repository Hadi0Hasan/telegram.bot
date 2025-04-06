const Database = require('better-sqlite3');
const db = new Database('users.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    telegramId INTEGER UNIQUE,
    username TEXT,
    password TEXT,
    balance INTEGER DEFAULT 0
  );
  
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY,
    userId INTEGER,
    type TEXT,
    amount INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS bot_status (
    maintenance BOOLEAN DEFAULT FALSE
  );
`);

// Initialize bot status
db.prepare(`
  INSERT OR IGNORE INTO bot_status (maintenance) VALUES (FALSE)
`).run();

module.exports = db;
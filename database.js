const Database = require('better-sqlite3');
const db = new Database('users.db', { 
  verbose: console.log,
  fileMustExist: false 
});

// Initialize tables
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
  
  INSERT OR IGNORE INTO bot_status (maintenance) VALUES (0);
`);

module.exports = db;

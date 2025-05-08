const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../recipegram.db');
const db = new sqlite3.Database(dbPath);

// Function to initialize database with required tables
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Users table created or already exists');
        resolve();
      }
    });
  });
}

module.exports = { db, initializeDatabase };
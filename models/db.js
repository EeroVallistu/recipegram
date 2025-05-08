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
        return;
      }
      console.log('Users table created or already exists');
      
      // Create categories table
      db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('Categories table created or already exists');
        
        // Create recipes table
        db.run(`CREATE TABLE IF NOT EXISTS recipes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          category_id INTEGER NOT NULL,
          description TEXT,
          image_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (category_id) REFERENCES categories(id)
        )`, (err) => {
          if (err) {
            reject(err);
            return;
          }
          console.log('Recipes table created or already exists');
          
          // Create ingredients table with amount column
          db.run(`CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipe_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            amount TEXT,
            FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
          )`, (err) => {
            if (err) {
              reject(err);
              return;
            }
            console.log('Ingredients table created or already exists');
            
            // Create favorites table
            db.run(`CREATE TABLE IF NOT EXISTS favorites (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              recipe_id INTEGER NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
              UNIQUE(user_id, recipe_id)
            )`, (err) => {
              if (err) {
                reject(err);
                return;
              }
              console.log('Favorites table created or already exists');
              
              // Insert some default categories
              const defaultCategories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Vegetarian', 'Vegan', 'Snacks'];
              
              const insertCategory = (index) => {
                if (index >= defaultCategories.length) {
                  resolve();
                  return;
                }
                
                db.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [defaultCategories[index]], (err) => {
                  if (err) {
                    console.error(`Error inserting category ${defaultCategories[index]}:`, err);
                  }
                  insertCategory(index + 1);
                });
              };
              
              insertCategory(0);
            });
          });
        });
      });
    });
  });
}

module.exports = { db, initializeDatabase };
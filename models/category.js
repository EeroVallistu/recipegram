// filepath: d:\Projektid\recipegram\models\category.js
const { db } = require('./db');

class Category {
  // Get all categories
  static getAll() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM categories ORDER BY name';
      
      db.all(sql, [], (err, categories) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(categories);
      });
    });
  }

  // Create a new category
  static create(name) {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO categories (name) VALUES (?)';
      
      db.run(sql, [name], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.lastID);
      });
    });
  }

  // Get recipes by category ID
  static getRecipesByCategory(categoryId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT r.*, c.name as category_name, u.email as user_email
                   FROM recipes r
                   JOIN categories c ON r.category_id = c.id
                   JOIN users u ON r.user_id = u.id
                   WHERE r.category_id = ?
                   ORDER BY r.created_at DESC`;
      
      db.all(sql, [categoryId], (err, recipes) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(recipes);
      });
    });
  }
}

module.exports = Category;
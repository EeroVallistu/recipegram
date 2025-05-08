// filepath: d:\Projektid\recipegram\models\favorite.js
const { db } = require('./db');

class Favorite {
  // Add a recipe to user's favorites
  static addFavorite(userId, recipeId) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT OR IGNORE INTO favorites (user_id, recipe_id) 
                   VALUES (?, ?)`;
      
      db.run(sql, [userId, recipeId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes > 0); // Return true if a row was inserted
      });
    });
  }

  // Remove a recipe from user's favorites
  static removeFavorite(userId, recipeId) {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM favorites 
                   WHERE user_id = ? AND recipe_id = ?`;
      
      db.run(sql, [userId, recipeId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes > 0); // Return true if a row was deleted
      });
    });
  }

  // Check if a recipe is in user's favorites
  static isFavorite(userId, recipeId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT 1 FROM favorites 
                   WHERE user_id = ? AND recipe_id = ?`;
      
      db.get(sql, [userId, recipeId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(!!row); // Return true if a row was found
      });
    });
  }

  // Get all favorite recipes for a user
  static getUserFavorites(userId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT r.*, c.name as category_name, u.email as user_email
                   FROM favorites f
                   JOIN recipes r ON f.recipe_id = r.id
                   JOIN categories c ON r.category_id = c.id
                   JOIN users u ON r.user_id = u.id
                   WHERE f.user_id = ?
                   ORDER BY f.created_at DESC`;
      
      db.all(sql, [userId], (err, recipes) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(recipes);
      });
    });
  }
}

module.exports = Favorite;
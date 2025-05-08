// filepath: d:\Projektid\recipegram\models\recipe.js
const { db } = require('./db');

class Recipe {
  // Create a new recipe
  static create(userId, title, categoryId, description, imageUrl) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO recipes (user_id, title, category_id, description, image_url) 
                   VALUES (?, ?, ?, ?, ?)`;
      
      db.run(sql, [userId, title, categoryId, description, imageUrl], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.lastID); // Return the ID of the new recipe
      });
    });
  }

  // Add ingredients to a recipe
  static addIngredients(recipeId, ingredients) {
    return new Promise((resolve, reject) => {
      // Prepare statement for inserting ingredients
      const stmt = db.prepare('INSERT INTO ingredients (recipe_id, name) VALUES (?, ?)');
      
      // Start a transaction for batch insert
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        let hasError = false;
        ingredients.forEach(ingredient => {
          stmt.run(recipeId, ingredient, (err) => {
            if (err) {
              hasError = true;
              reject(err);
            }
          });
        });
        
        stmt.finalize();
        
        if (!hasError) {
          db.run('COMMIT', (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        } else {
          db.run('ROLLBACK');
        }
      });
    });
  }

  // Get all recipes with their categories
  static getAll() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT r.*, c.name as category_name, u.email as user_email
                   FROM recipes r
                   JOIN categories c ON r.category_id = c.id
                   JOIN users u ON r.user_id = u.id
                   ORDER BY r.created_at DESC`;
      
      db.all(sql, [], (err, recipes) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(recipes);
      });
    });
  }

  // Get a recipe by ID with its ingredients
  static getById(recipeId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT r.*, c.name as category_name, u.email as user_email
                   FROM recipes r
                   JOIN categories c ON r.category_id = c.id
                   JOIN users u ON r.user_id = u.id
                   WHERE r.id = ?`;
      
      db.get(sql, [recipeId], (err, recipe) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!recipe) {
          resolve(null);
          return;
        }
        
        // Get ingredients for this recipe
        db.all('SELECT * FROM ingredients WHERE recipe_id = ?', [recipeId], (err, ingredients) => {
          if (err) {
            reject(err);
            return;
          }
          
          recipe.ingredients = ingredients;
          resolve(recipe);
        });
      });
    });
  }
}

module.exports = Recipe;
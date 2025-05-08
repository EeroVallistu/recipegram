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
      // Prepare statement for inserting ingredients with amounts
      const stmt = db.prepare('INSERT INTO ingredients (recipe_id, name, amount) VALUES (?, ?, ?)');
      
      // Start a transaction for batch insert
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        let hasError = false;
        ingredients.forEach(ingredient => {
          stmt.run(recipeId, ingredient.name, ingredient.amount, (err) => {
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
  static getAll(userId = null) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT r.*, c.name as category_name, u.email as user_email`;
      
      // Include favorite status if userId is provided
      if (userId) {
        sql += `, (SELECT 1 FROM favorites f WHERE f.recipe_id = r.id AND f.user_id = ?) AS is_favorite`;
      }
      
      sql += ` FROM recipes r
               JOIN categories c ON r.category_id = c.id
               JOIN users u ON r.user_id = u.id
               ORDER BY r.created_at DESC`;
      
      const params = userId ? [userId] : [];
      
      db.all(sql, params, (err, recipes) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Convert is_favorite to boolean if userId was provided
        if (userId) {
          recipes.forEach(recipe => {
            recipe.is_favorite = !!recipe.is_favorite;
          });
        }
        
        resolve(recipes);
      });
    });
  }

  // Get a recipe by ID with its ingredients
  static getById(recipeId, userId = null) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT r.*, c.name as category_name, u.email as user_email`;
      
      // Include favorite status if userId is provided
      if (userId) {
        sql += `, (SELECT 1 FROM favorites f WHERE f.recipe_id = r.id AND f.user_id = ?) AS is_favorite`;
      }
      
      sql += ` FROM recipes r
               JOIN categories c ON r.category_id = c.id
               JOIN users u ON r.user_id = u.id
               WHERE r.id = ?`;
      
      const params = userId ? [userId, recipeId] : [recipeId];
      
      db.get(sql, params, (err, recipe) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!recipe) {
          resolve(null);
          return;
        }
        
        // Convert is_favorite to boolean if userId was provided
        if (userId && recipe) {
          recipe.is_favorite = !!recipe.is_favorite;
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
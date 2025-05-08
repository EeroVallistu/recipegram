// filepath: d:\Projektid\recipegram\models\category.js
const { db } = require('./db');
const Favorite = require('./favorite');

class Category {
  // Get all categories
  static getAll(userId = null) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM categories ORDER BY name';
      
      db.all(sql, [], async (err, categories) => {
        if (err) {
          reject(err);
          return;
        }
        // Add slug to each category
        categories.forEach(category => {
          category.slug = this.generateSlug(category.name);
        });

        // Add virtual "Favorites" category if userId is provided
        if (userId) {
          try {
            // Check if user has any favorites
            const favorites = await Favorite.getUserFavorites(userId);
            if (favorites && favorites.length > 0) {
              categories.unshift({
                id: 'favorites', // Special ID for the virtual category
                name: 'Favorites',
                slug: 'favorites',
                virtual: true // Mark as virtual category
              });
            }
          } catch (error) {
            console.error('Error checking for favorites:', error);
          }
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
  static getRecipesByCategory(categoryId, userId = null) {
    return new Promise(async (resolve, reject) => {
      // Handle the special case for Favorites virtual category
      if (categoryId === 'favorites') {
        if (!userId) {
          resolve([]);
          return;
        }

        try {
          const favorites = await Favorite.getUserFavorites(userId);
          // Mark all recipes in favorites view as favorites (this is what was missing)
          favorites.forEach(recipe => {
            recipe.is_favorite = true;
          });
          resolve(favorites);
        } catch (err) {
          reject(err);
        }
        return;
      }

      // Regular category
      const sql = `SELECT r.*, c.name as category_name, u.email as user_email
                   ${userId ? ', (SELECT 1 FROM favorites f WHERE f.recipe_id = r.id AND f.user_id = ?) AS is_favorite' : ''}
                   FROM recipes r
                   JOIN categories c ON r.category_id = c.id
                   JOIN users u ON r.user_id = u.id
                   WHERE r.category_id = ?
                   ORDER BY r.created_at DESC`;
      
      const params = userId ? [userId, categoryId] : [categoryId];
      
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

  // Get category by slug
  static getBySlug(slug) {
    return new Promise((resolve, reject) => {
      // Special case for favorites
      if (slug === 'favorites') {
        resolve({
          id: 'favorites',
          name: 'Favorites',
          slug: 'favorites',
          virtual: true
        });
        return;
      }

      const sql = 'SELECT * FROM categories WHERE name LIKE ?';
      
      // Find categories that could match this slug
      db.all(sql, ['%'], (err, categories) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Find the category with matching slug
        const category = categories.find(cat => this.generateSlug(cat.name) === slug);
        resolve(category || null);
      });
    });
  }

  // Get recipes by category slug
  static getRecipesByCategorySlug(slug, userId = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const category = await this.getBySlug(slug);
        if (!category) {
          resolve([]);
          return;
        }
        
        const recipes = await this.getRecipesByCategory(category.id, userId);
        resolve(recipes);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Generate a slug from a category name
  static generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Replace multiple hyphens with a single hyphen
      .trim();                  // Remove leading/trailing spaces
  }
}

module.exports = Category;
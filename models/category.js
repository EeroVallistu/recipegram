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
        // Add slug to each category
        categories.forEach(category => {
          category.slug = this.generateSlug(category.name);
        });
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

  // Get category by slug
  static getBySlug(slug) {
    return new Promise((resolve, reject) => {
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
  static getRecipesByCategorySlug(slug) {
    return new Promise(async (resolve, reject) => {
      try {
        const category = await this.getBySlug(slug);
        if (!category) {
          resolve([]);
          return;
        }
        
        const recipes = await this.getRecipesByCategory(category.id);
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
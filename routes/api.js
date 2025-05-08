// filepath: d:\Projektid\recipegram\routes\api.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Recipe = require('../models/recipe');
const Category = require('../models/category');
const Favorite = require('../models/favorite');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads');
    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Create a unique filename with current timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
  fileFilter: function(req, file, cb) {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Not authenticated' });
}

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    // Include userId if user is logged in
    const userId = req.session && req.session.user ? req.session.user.id : null;
    const categories = await Category.getAll(userId);
    res.json(categories);
  } catch (err) {
    console.error('Error getting categories:', err);
    res.status(500).json({ success: false, error: 'Failed to get categories' });
  }
});

// Create a new category
router.post('/categories', isAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }
    
    const categoryId = await Category.create(name.trim());
    res.json({ success: true, categoryId });
  } catch (err) {
    console.error('Error creating category:', err);
    
    // Check for SQLITE_CONSTRAINT error (unique constraint violated)
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, error: 'Category already exists' });
    }
    
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
});

// Create a new recipe
router.post('/recipes', isAuthenticated, upload.single('recipeImage'), async (req, res) => {
  try {
    const { title, categoryId, description } = req.body;
    let ingredients = [];
    
    try {
      ingredients = JSON.parse(req.body.ingredients || '[]');
    } catch (err) {
      return res.status(400).json({ success: false, error: 'Invalid ingredients format' });
    }
    
    if (!title || !categoryId || !description) {
      return res.status(400).json({ success: false, error: 'Title, category, and description are required' });
    }
    
    if (!ingredients.length) {
      return res.status(400).json({ success: false, error: 'At least one ingredient is required' });
    }
    
    // Validate ingredients format - ensure no empty ingredients after trimming
    if (!ingredients.every(ingredient => ingredient.name && ingredient.name.trim() !== '')) {
      return res.status(400).json({ success: false, error: 'All ingredients must have a non-empty name' });
    }
    
    // Clean ingredient data by trimming whitespace
    ingredients = ingredients.map(ingredient => ({
      name: ingredient.name.trim(),
      amount: ingredient.amount ? ingredient.amount.trim() : ''
    }));
    
    // Get image URL if an image was uploaded
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    
    // Create the recipe
    const recipeId = await Recipe.create(req.session.user.id, title, categoryId, description, imageUrl);
    
    // Add ingredients
    await Recipe.addIngredients(recipeId, ingredients);
    
    res.json({ success: true, recipeId });
  } catch (err) {
    console.error('Error creating recipe:', err);
    res.status(500).json({ success: false, error: 'Failed to create recipe' });
  }
});

// Get all recipes
router.get('/recipes', async (req, res) => {
  try {
    // If user is logged in, include favorite status
    const userId = req.session && req.session.user ? req.session.user.id : null;
    const recipes = await Recipe.getAll(userId);
    res.json(recipes);
  } catch (err) {
    console.error('Error getting recipes:', err);
    res.status(500).json({ success: false, error: 'Failed to get recipes' });
  }
});

// Get recipes by category ID (original route for backward compatibility)
router.get('/categories/:categoryId/recipes', async (req, res) => {
  try {
    const { categoryId } = req.params;
    // Include userId if user is logged in
    const userId = req.session && req.session.user ? req.session.user.id : null;
    const recipes = await Category.getRecipesByCategory(categoryId, userId);
    res.json(recipes);
  } catch (err) {
    console.error('Error getting recipes by category:', err);
    res.status(500).json({ success: false, error: 'Failed to get recipes' });
  }
});

// New route - Get recipes by category slug
router.get('/categories/slug/:slug/recipes', async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.getBySlug(slug);
    
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    
    // Include userId if user is logged in
    const userId = req.session && req.session.user ? req.session.user.id : null;
    
    // Special handling for favorites category
    if (category.id === 'favorites' && !userId) {
      return res.status(401).json({ success: false, error: 'Authentication required to view favorites' });
    }
    
    const recipes = await Category.getRecipesByCategory(category.id, userId);
    res.json(recipes);
  } catch (err) {
    console.error('Error getting recipes by category slug:', err);
    res.status(500).json({ success: false, error: 'Failed to get recipes' });
  }
});

// Get a single recipe with its ingredients
router.get('/recipes/:id', async (req, res) => {
  try {
    // If user is logged in, include favorite status
    const userId = req.session && req.session.user ? req.session.user.id : null;
    const recipe = await Recipe.getById(req.params.id, userId);
    
    if (!recipe) {
      return res.status(404).json({ success: false, error: 'Recipe not found' });
    }
    
    res.json(recipe);
  } catch (err) {
    console.error('Error getting recipe:', err);
    res.status(500).json({ success: false, error: 'Failed to get recipe' });
  }
});

// Add a recipe to favorites
router.post('/favorites/:recipeId', isAuthenticated, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = req.session.user.id;
    
    // Check if the recipe exists
    const recipe = await Recipe.getById(recipeId);
    if (!recipe) {
      return res.status(404).json({ success: false, error: 'Recipe not found' });
    }
    
    const added = await Favorite.addFavorite(userId, recipeId);
    res.json({ success: true, added });
  } catch (err) {
    console.error('Error adding favorite:', err);
    res.status(500).json({ success: false, error: 'Failed to add favorite' });
  }
});

// Remove a recipe from favorites
router.delete('/favorites/:recipeId', isAuthenticated, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = req.session.user.id;
    
    const removed = await Favorite.removeFavorite(userId, recipeId);
    res.json({ success: true, removed });
  } catch (err) {
    console.error('Error removing favorite:', err);
    res.status(500).json({ success: false, error: 'Failed to remove favorite' });
  }
});

// Get user's favorite recipes
router.get('/favorites', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const favorites = await Favorite.getUserFavorites(userId);
    res.json(favorites);
  } catch (err) {
    console.error('Error getting favorites:', err);
    res.status(500).json({ success: false, error: 'Failed to get favorites' });
  }
});

// Check if a recipe is favorited by the user
router.get('/favorites/:recipeId', isAuthenticated, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = req.session.user.id;
    
    const isFavorite = await Favorite.isFavorite(userId, recipeId);
    res.json({ success: true, isFavorite });
  } catch (err) {
    console.error('Error checking favorite status:', err);
    res.status(500).json({ success: false, error: 'Failed to check favorite status' });
  }
});

module.exports = router;
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const ejsLayouts = require('express-ejs-layouts');
const app = express();
const port = 3000;

// Database setup
const db = require('./models/db');

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Added JSON body parsing
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up EJS layouts
app.use(ejsLayouts);
app.set('layout', 'layout');

// Session setup
app.use(session({
  secret: 'recipegram_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Make user data available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api'); // New API routes
app.use(authRoutes);
app.use('/api', apiRoutes); // Add API routes under /api path

// Main route
app.get('/', async (req, res) => {
  try {
    const Recipe = require('./models/recipe');
    const recipes = await Recipe.getAll();
    res.render('index', { recipes });
  } catch (err) {
    console.error('Error getting recipes:', err);
    res.render('index', { recipes: [], error: 'Failed to load recipes' });
  }
});

// Category route with slug instead of ID
app.get('/category/:slug', async (req, res) => {
  try {
    const Category = require('./models/category');
    const categorySlug = req.params.slug;
    
    // First try to parse as ID for backward compatibility
    if (/^\d+$/.test(categorySlug)) {
      // If the slug is a number, treat it as an ID (for backward compatibility)
      const categoryId = parseInt(categorySlug);
      const recipes = await Category.getRecipesByCategory(categoryId);
      
      // Get the category to find its name
      const categories = await Category.getAll();
      const currentCategory = categories.find(c => c.id === categoryId);
      
      if (currentCategory) {
        // Redirect to the slug-based URL
        return res.redirect(`/category/${Category.generateSlug(currentCategory.name)}`);
      }
      
      res.render('category', { 
        recipes, 
        categoryId,
        categoryName: currentCategory ? currentCategory.name : 'Unknown Category'
      });
    } else {
      // Otherwise, treat it as a slug
      const category = await Category.getBySlug(categorySlug);
      
      if (!category) {
        return res.status(404).render('category', {
          recipes: [],
          categoryId: null,
          categoryName: 'Category Not Found',
          error: 'The requested category does not exist'
        });
      }
      
      const recipes = await Category.getRecipesByCategory(category.id);
      
      res.render('category', { 
        recipes, 
        categoryId: category.id,
        categoryName: category.name
      });
    }
  } catch (err) {
    console.error('Error getting recipes by category:', err);
    res.render('category', { 
      recipes: [], 
      categoryId: null,
      categoryName: 'Error',
      error: 'Failed to load recipes' 
    });
  }
});

// Recipe detail route
app.get('/recipe/:id', async (req, res) => {
  try {
    const Recipe = require('./models/recipe');
    const recipeId = req.params.id;

    // Get recipe by ID
    const recipe = await Recipe.getById(recipeId);

    if (!recipe) {
      return res.status(404).render('recipe', {
        recipe: null,
        error: 'Recipe not found'
      });
    }

    res.render('recipe', { recipe });
  } catch (err) {
    console.error('Error getting recipe details:', err);
    res.render('recipe', {
      recipe: null,
      error: 'Failed to load recipe details'
    });
  }
});

// Initialize database and start server
db.initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`RecipeGram app listening at http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Database initialization failed:', err);
});
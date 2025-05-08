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

// Routes
const authRoutes = require('./routes/auth');
app.use(authRoutes);

// Main route
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

// Initialize database and start server
db.initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`RecipeGram app listening at http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Database initialization failed:', err);
});
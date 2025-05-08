const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Get registration form
router.get('/register', (req, res) => {
  res.render('register');
});

// Handle user registration
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if email is valid and password is not empty
    if (!email || !password || password.length < 6) {
      return res.render('register', { error: 'Please provide a valid email and password (at least 6 characters)', email });
    }
    
    // Check if password contains spaces
    if (password.includes(' ')) {
      return res.render('register', { error: 'Password cannot contain spaces', email });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.render('register', { error: 'Email already registered', email });
    }

    // Create new user
    const user = await User.create(email, password);

    // Set session and redirect to home
    req.session.user = user;
    res.redirect('/');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', { error: 'Registration failed. Please try again.', email });
  }
});

// Get login form
router.get('/login', (req, res) => {
  res.render('login');
});

// Handle user login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if email and password are provided
    if (!email || !password) {
      return res.render('login', { error: 'Please provide both email and password', email });
    }
    
    // Check if password contains spaces
    if (password.includes(' ')) {
      return res.render('login', { error: 'Password cannot contain spaces', email });
    }

    // Verify user credentials
    const user = await User.verifyCredentials(email, password);

    if (user) {
      // Set session and redirect to home
      req.session.user = user;
      res.redirect('/');
    } else {
      res.render('login', { error: 'Invalid email or password', email });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { error: 'Login failed. Please try again.', email });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
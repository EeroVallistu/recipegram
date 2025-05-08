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
      return res.render('register', { error: 'Please provide a valid email and password (at least 6 characters)' });
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.render('register', { error: 'Email already registered' });
    }
    
    // Create new user
    const user = await User.create(email, password);
    
    // Set session and redirect to home
    req.session.user = user;
    res.redirect('/');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', { error: 'Registration failed. Please try again.' });
  }
});

module.exports = router;
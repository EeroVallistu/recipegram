const bcrypt = require('bcrypt');
const { db } = require('./db');

// User model
const User = {
  // Create a new user
  create: function(email, password) {
    return new Promise(async (resolve, reject) => {
      try {
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Insert the user into the database
        db.run('INSERT INTO users (email, password) VALUES (?, ?)', 
          [email, hashedPassword], 
          function(err) {
            if (err) {
              reject(err);
            } else {
              // Return the created user
              resolve({
                id: this.lastID,
                email: email
              });
            }
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  },

  // Find a user by email
  findByEmail: function(email) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    });
  },

  // Verify user credentials
  verifyCredentials: function(email, password) {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await this.findByEmail(email);
        if (!user) {
          resolve(false);
        } else {
          const match = await bcrypt.compare(password, user.password);
          if (match) {
            // Return user without password
            const { password, ...userWithoutPassword } = user;
            resolve(userWithoutPassword);
          } else {
            resolve(false);
          }
        }
      } catch (err) {
        reject(err);
      }
    });
  }
};

module.exports = User;
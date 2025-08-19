const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken'); // To generate JWT for Google users

// Serialize user to store in session
passport.serializeUser((user, done) => {
  done(null, user.id); // user.id is MongoDB _id
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new GoogleStrategy({
    // options for google strategy
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://www.confique.com/api/auth/google/callback', // This must match your Google Cloud Console redirect URI
  }, async (accessToken, refreshToken, profile, done) => {
    // passport callback function
    try {
      // Check if user already exists in our db
      let currentUser = await User.findOne({ googleId: profile.id });

      if (currentUser) {
        // user already exists, log them in
        console.log('User already exists:', currentUser.email);
        done(null, currentUser);
      } else {
        // if not, create new user in our db
        const newUser = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value, // Get primary email
          avatar: profile.photos[0].value, // Get profile picture
          // No password for Google-authenticated users
          isAdmin: profile.emails[0].value === 'confique01@gmail.com', // Admin check
        });
        console.log('New user created:', newUser.email);
        done(null, newUser);
      }
    } catch (err) {
      console.error('Error during Google OAuth callback:', err);
      done(err, null);
    }
  })
);

// Helper to generate JWT for Google users after successful authentication
const generateTokenForGoogleUser = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

module.exports = { passport, generateTokenForGoogleUser };
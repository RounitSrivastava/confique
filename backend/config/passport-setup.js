const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

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
    // The callbackURL must be an exact match to the one in Google Cloud Console
    callbackURL: 'https://confique.onrender.com/api/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists in our db
      let currentUser = await User.findOne({ googleId: profile.id });

      if (currentUser) {
        // User already exists, log them in
        console.log('User already exists:', currentUser.email);
        done(null, currentUser);
      } else {
        // Safely access user data from profile object with fallbacks
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        
        if (!email) {
          // Handle case where no email is provided by Google.
          return done(new Error('Google profile does not contain an email address.'), null);
        }

        // Corrected: If not, create a new user in our db with the avatar object.
        const newUser = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email,
          avatar: {
            url: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : 'https://placehold.co/40x40/cccccc/000000?text=A',
            publicId: 'google_avatar', // A static placeholder for Google users
          },
          isAdmin: email === 'confique01@gmail.com', // Admin check
        });

        console.log('New user created:', newUser.email);
        done(null, newUser);
      }
    } catch (err) {
      console.error('Error during Google OAuth callback:', err);
      // Pass the error to done to indicate a failure
      done(err, null);
    }
  })
);

// Helper to generate JWT for Google users after successful authentication
const generateTokenForGoogleUser = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

module.exports = { passport, generateTokenForGoogleUser };
// --- START OF FILE passport.js ---
import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js"; // <--- IMPORT USER MODEL

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Add a check to ensure env variables are loaded (for debugging)
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error(
    "CRITICAL ERROR: Google OAuth credentials (GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET) are missing from .env file."
  );
  // process.exit(1); // Optionally exit if they are critical for startup
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      proxy: true, // Important if your app is behind a proxy (e.g. Heroku, Nginx)
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Find if user already exists
        let existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
          // Optional: Update user info if it has changed (e.g., picture, displayName)
          existingUser.displayName = profile.displayName;
          existingUser.email = profile.emails[0].value;
          if (profile.photos && profile.photos.length > 0) {
            existingUser.picture = profile.photos[0].value;
          }
          await existingUser.save();
          return done(null, existingUser);
        }

        // 2. If not, create a new user
        const newUser = new User({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
          picture:
            profile.photos && profile.photos.length > 0
              ? profile.photos[0].value
              : null,
        });
        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        console.error("Error in Google Strategy:", err);
        return done(err, false);
      }
    }
  )
);

// Session serialization: Store user ID in session
passport.serializeUser((user, done) => {
  // 'user' here is the Mongoose user object from the strategy's 'done' callback
  done(null, user.id); // user.id is the MongoDB _id
});

// Session deserialization: Fetch user from DB using ID from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); // Attaches user object to req.user
  } catch (err) {
    done(err, null);
  }
});

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    picture: {
      // To store the user's profile picture URL from Google
      type: String,
    },
    // You can add more fields like firstName, lastName if profile provides them
  },
  { timestamps: true }
); // timestamps will add createdAt and updatedAt

const User = mongoose.model("User", userSchema);
export default User;

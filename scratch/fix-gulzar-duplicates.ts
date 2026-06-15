import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: ".env.local" });

import User from '../models/User';

async function fixGulzarDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB.");

    const username = "CLM286947";
    const user = await User.findOne({ username });

    if (!user) {
      console.log("User not found!");
      return;
    }

    console.log("Before fix, sessionBasedIncome length:", user.sessionBasedIncome?.length);

    // Keep only the first 3 items (remove the 4th duplicate)
    if (user.sessionBasedIncome && user.sessionBasedIncome.length > 3) {
      user.sessionBasedIncome = user.sessionBasedIncome.slice(0, 3);
      user.markModified('sessionBasedIncome');
    }

    console.log("Saving user using the real User model to trigger pre-save hooks...");
    await user.save();
    console.log("User saved successfully.");

    // Retrieve updated user to verify
    const updatedUser = await User.findOne({ username });
    console.log("\nUpdated user details:");
    console.log("BasicPairs:", updatedUser?.basicPairs);
    console.log("BasicIncome:", updatedUser?.basicIncome);
    console.log("basicIncomeRecords:", JSON.stringify(updatedUser?.basicIncomeRecords, null, 2));

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

fixGulzarDuplicates();

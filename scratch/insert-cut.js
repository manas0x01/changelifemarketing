const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: ".env.local" });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function insertCut() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const username = "CLM286947";
    const user = await User.findOne({ username });

    if (!user) {
      console.log("User not found!");
      return;
    }

    console.log("Current sessionBasedIncome length:", user.sessionBasedIncome?.length);
    console.log("Current basicPairs:", user.basicPairs);

    // Push the 3rd pair cut record
    const newRecord = {
      date: new Date("2026-06-13T12:42:52.000Z"),
      sessionType: "evening",
      pairs: 1,
      netIncome: 0,
      description: "Basic Session #3 Cut (evening)",
      processed: true
    };

    if (!user.sessionBasedIncome) {
      user.sessionBasedIncome = [];
    }

    user.sessionBasedIncome.push(newRecord);
    user.markModified('sessionBasedIncome');

    console.log("Saving user to trigger pre-save self-healing hooks...");
    await user.save();
    console.log("User saved successfully.");

    // Retrieve updated user to verify
    const updatedUser = await User.findOne({ username });
    console.log("\nUpdated user details:");
    console.log("BasicPairs:", updatedUser.basicPairs);
    console.log("BasicIncome:", updatedUser.basicIncome);
    console.log("basicIncomeRecords:", JSON.stringify(updatedUser.basicIncomeRecords, null, 2));

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

insertCut();

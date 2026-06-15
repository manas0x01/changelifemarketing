const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: ".env.local" });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function viewGulzar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const user = await User.findOne({ username: 'CLM286947' }).lean();
    if (user) {
      console.log("sessionBasedIncome:");
      console.log(JSON.stringify(user.sessionBasedIncome, null, 2));
      console.log("\nbasicIncomeRecords:");
      console.log(JSON.stringify(user.basicIncomeRecords, null, 2));
    }
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

viewGulzar();

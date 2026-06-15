const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: ".env.local" });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function testApi() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const username = "CLM286947";
    const user = await User.findOne({
      $or: [
        { userId: { $regex: new RegExp(`^${username}$`, 'i') } },
        { username: { $regex: new RegExp(`^${username}$`, 'i') } }
      ]
    });

    if (!user) {
      console.log("User not found");
      return;
    }

    const incomeRecords = user.basicIncomeRecords || [];
    const formattedRecords = incomeRecords.map((record, index) => ({
      srNo: record.srNo || index + 1,
      amount: `₹${record.amount || 0}`,
      rawAmount: record.amount || 0,
      pairCount: record.pairCount || 1,
      date: record.date ? new Date(record.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      description: record.description || "Pair completed",
      status: record.status || "Paid",
    }));

    console.log("Formatted Records count:", formattedRecords.length);
    console.log("Formatted Records:", formattedRecords);

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

testApi();

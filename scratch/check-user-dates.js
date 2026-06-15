const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: ".env.local" });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function checkUserDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const usernames = ["CLM748004", "CLM286947"];
    for (const name of usernames) {
      const user = await User.findOne({ username: name });
      if (user) {
        console.log(`\nUser: ${user.username}`);
        console.log(`SessionTeam: L:${user.sessionTeam?.left}, R:${user.sessionTeam?.right}`);
        console.log(`LastSessionType: ${user.lastSessionType}`);
        console.log(`LastSessionDate: ${user.lastSessionDate}`);
        console.log(`BasicPairs: ${user.basicPairs}`);
        console.log(`TotalTeam: L:${user.totalTeam?.left}, R:${user.totalTeam?.right}`);
        console.log(`SessionBasedIncome Length: ${user.sessionBasedIncome?.length}`);
      }
    }

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkUserDates();

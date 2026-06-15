const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: ".env.local" });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function checkRightPath() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const username = "CLM251083";
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`User ${username} not found`);
      return;
    }

    console.log(`User: ${user.username} - Parent: ${user.placementId} (${user.placementPosition}) - Created: ${user.createdAt}`);

    let curr = user.placementId;
    while (curr) {
      const parent = await User.findOne({ username: curr });
      if (!parent) {
        console.log(`Parent ${curr} not found`);
        break;
      }
      console.log(`Ancestor: ${parent.username} (${parent.fullName}) - LeftChild: ${parent.leftChild}, RightChild: ${parent.rightChild} - TotalTeam: L:${parent.totalTeam?.left}, R:${parent.totalTeam?.right} - SessionTeam: L:${parent.sessionTeam?.left}, R:${parent.sessionTeam?.right} - Created: ${parent.createdAt}`);
      curr = parent.placementId;
    }

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkRightPath();

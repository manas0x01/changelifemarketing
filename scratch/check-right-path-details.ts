import mongoose from 'mongoose';
import User from '../models/User';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function checkPath() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const usernames = ['CLM118284', 'CLM914977', 'CLM589898', 'CLM332825'];
  for (const username of usernames) {
    const user = await User.findOne({ username });
    if (user) {
      console.log(`\nUser: ${user.username} (${user.fullName})`);
      console.log(`  leftChild: ${user.leftChild}, rightChild: ${user.rightChild}`);
      console.log(`  placementId: ${user.placementId}, placementPosition: ${user.placementPosition}`);
      console.log(`  totalTeam: ${JSON.stringify(user.totalTeam)}`);
      console.log(`  sessionTeam: ${JSON.stringify(user.sessionTeam)}`);
      console.log(`  lastSessionType: ${user.lastSessionType}, lastSessionDate: ${user.lastSessionDate}`);
    } else {
      console.log(`\nUser not found: ${username}`);
    }
  }

  await mongoose.disconnect();
}

checkPath().catch(err => {
  console.error(err);
  process.exit(1);
});

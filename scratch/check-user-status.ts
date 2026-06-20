import mongoose from 'mongoose';
import User from '../models/User';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function checkUser() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const user = await User.findOne({ username: 'CLM332825' });
  if (!user) {
    console.error('User CLM332825 not found');
    process.exit(1);
  }

  console.log('--- USER DATA ---');
  console.log('Username:', user.username);
  console.log('isBooster:', user.isBooster);
  console.log('totalTeam:', user.totalTeam);
  console.log('sessionTeam:', user.sessionTeam);
  console.log('basicIncome:', user.basicIncome);
  console.log('basicPairs:', user.basicPairs);
  console.log('lastSessionType:', user.lastSessionType);
  console.log('lastSessionDate:', user.lastSessionDate);
  console.log('sessionBasedIncome:', JSON.stringify(user.sessionBasedIncome, null, 2));
  console.log('basicIncomeRecords:', JSON.stringify(user.basicIncomeRecords, null, 2));

  // Find children
  console.log('leftChild:', user.leftChild);
  console.log('rightChild:', user.rightChild);

  if (user.leftChild) {
    const left = await User.findOne({ username: user.leftChild });
    console.log(`Left child ${user.leftChild} details: joiningDate: ${left?.joiningDate}, createdAt: ${left?.createdAt}`);
  }
  if (user.rightChild) {
    const right = await User.findOne({ username: user.rightChild });
    console.log(`Right child ${user.rightChild} details: joiningDate: ${right?.joiningDate}, createdAt: ${right?.createdAt}`);
  }

  await mongoose.disconnect();
}

checkUser().catch(err => {
  console.error(err);
  process.exit(1);
});

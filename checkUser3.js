const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const User = require('./models/User').default || require('./models/User');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ userId: { $regex: new RegExp('^clm507060$', 'i') } });
  if (!user) { process.exit(0); }
  console.log('basicPairs:', user.basicPairs);
  console.log('sessionTeam:', user.sessionTeam);
  console.log('placement left/right counts:', user.leftCount, user.rightCount);
  process.exit(0);
}
run().catch(console.error);

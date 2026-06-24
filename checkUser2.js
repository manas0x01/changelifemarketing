const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const User = require('./models/User').default || require('./models/User');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ userId: { $regex: new RegExp('^clm507060$', 'i') } });
  if (!user) {
    console.log('User not found');
    process.exit(0);
  }
  console.log('User found:', user.userId);
  console.log('basicIncome:', user.basicIncome);
  console.log('sessionBasedIncome:', JSON.stringify(user.sessionBasedIncome, null, 2));
  process.exit(0);
}
run().catch(console.error);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({ userId: 'CLM949879' });
  if (!user) { console.log('User not found'); process.exit(0); }
  
  if (user.sessionBasedIncome && user.sessionBasedIncome.length > 0) {
     user.sessionBasedIncome[0].netIncome = 0;
  }
  
  await db.collection('users').updateOne(
     { userId: 'CLM949879' },
     { $set: { 
         basicIncome: 0, 
         totalIncome: 0, 
         sessionBasedIncome: user.sessionBasedIncome
       } 
     }
  );
  console.log('Successfully zeroed out the invalid cross-session income for CLM949879.');

  process.exit(0);
}
run().catch(console.error);

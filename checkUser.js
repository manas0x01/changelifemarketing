const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const User = require('./models/User').default || require('./models/User');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ memberId: 'CLM949879' });
  if (!user) {
    console.log('User not found');
    process.exit(0);
  }
  console.log('User found:', user.memberId, user.username);
  console.log('Current Income:', user.boosterMatchingIncome);
  console.log('Total Income:', user.totalIncome);
  console.log('Carry Forward:', user.boosterPairsCarryForward);
  console.log('Matching Records:', JSON.stringify(user.boosterMatchingRecords, null, 2));

  let correctIncome = 0;
  let changed = false;

  if (user.boosterMatchingRecords) {
    user.boosterMatchingRecords.forEach((r) => {
       const sessionPairs = Math.min(r.sessionLeftGenerated || 0, r.sessionRightGenerated || 0);
       let paidPairs = Math.min(sessionPairs, r.pairsMatched || 0); 
       
       if (r.sessionLeftGenerated === undefined && r.sessionRightGenerated === undefined) {
         paidPairs = 0;
       }

       if (r.sameSessionPairsPaid !== paidPairs) {
         r.sameSessionPairsPaid = paidPairs;
         changed = true;
       }

       const recordIncome = paidPairs * 1000;
       if (r.income !== recordIncome) {
         r.income = recordIncome;
         r.netIncome = recordIncome;
         changed = true;
       }
       correctIncome += recordIncome;
    });
  }
  
  if (user.boosterMatchingIncome !== correctIncome) {
     console.log('Correcting boosterMatchingIncome from', user.boosterMatchingIncome, 'to', correctIncome);
     user.boosterMatchingIncome = correctIncome;
     changed = true;
  }
  
  const expectedTotalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);
  if (user.totalIncome !== expectedTotalIncome) {
      console.log('Correcting totalIncome from', user.totalIncome, 'to', expectedTotalIncome);
      user.totalIncome = expectedTotalIncome;
      changed = true;
  }

  if (changed) {
     user.markModified('boosterMatchingRecords');
     await user.save();
     console.log('Saved corrected user CLM949879.');
  } else {
     console.log('Income is already correct. No changes needed.');
  }
  process.exit(0);
}
run().catch(console.error);

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import User from './models/User';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const user = await User.findOne({ userId: 'CLM949879' });
  if (!user) {
    console.log('User not found');
    process.exit(0);
  }
  const u = user as any;
  console.log('User found:', u.memberId, u.username);
  console.log('Current Income:', u.boosterMatchingIncome);
  console.log('Total Income:', u.totalIncome);
  console.log('Carry Forward:', u.boosterPairsCarryForward);
  console.log('Matching Records:', JSON.stringify(u.boosterMatchingRecords, null, 2));

  let correctIncome = 0;
  let changed = false;

  if (u.boosterMatchingRecords) {
    u.boosterMatchingRecords.forEach((r: any) => {
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
  
  if (u.boosterMatchingIncome !== correctIncome) {
     console.log('Correcting boosterMatchingIncome from', u.boosterMatchingIncome, 'to', correctIncome);
     u.boosterMatchingIncome = correctIncome;
     changed = true;
  }
  
  const expectedTotalIncome = (u.basicIncome || 0) + (u.boosterMatchingIncome || 0) + (u.awardIncome || 0) + (u.repurchaseIncome || 0);
  if (u.totalIncome !== expectedTotalIncome) {
      console.log('Correcting totalIncome from', u.totalIncome, 'to', expectedTotalIncome);
      u.totalIncome = expectedTotalIncome;
      changed = true;
  }

  if (changed) {
     // markModified is needed for mixed types or nested objects in Mongoose if not strictly defined
     u.markModified('boosterMatchingRecords');
     await u.save();
     console.log('Saved corrected user CLM949879.');
  } else {
     console.log('Income is already correct. No changes needed.');
  }
  process.exit(0);
}
run().catch(console.error);

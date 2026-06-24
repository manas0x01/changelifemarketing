const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  // 1. Analyze CLM507060 specifically
  const u = await db.collection('users').findOne({ userId: 'CLM507060' });
  if (u) {
     console.log('--- CLM507060 ---');
     console.log('basicPairs:', u.basicPairs);
     console.log('basicIncome:', u.basicIncome);
     console.log('totalIncome:', u.totalIncome);
     console.log('sessionBasedIncome length:', u.sessionBasedIncome ? u.sessionBasedIncome.length : 0);
  }

  // 2. Find any user with negative income
  const negativeUsers = await db.collection('users').find({
      $or: [
          { totalIncome: { $lt: 0 } },
          { basicIncome: { $lt: 0 } },
          { boosterMatchingIncome: { $lt: 0 } }
      ]
  }).toArray();
  
  console.log('--- Negative Users ---');
  console.log('Count:', negativeUsers.length);
  negativeUsers.forEach(nu => {
      console.log(nu.userId, 'total:', nu.totalIncome, 'basic:', nu.basicIncome, 'booster:', nu.boosterMatchingIncome);
      
      // Fix negative amounts
      if (nu.totalIncome < 0) nu.totalIncome = 0;
      if (nu.basicIncome < 0) nu.basicIncome = 0;
      if (nu.boosterMatchingIncome < 0) nu.boosterMatchingIncome = 0;
      
      db.collection('users').updateOne({ _id: nu._id }, {
         $set: { totalIncome: nu.totalIncome, basicIncome: nu.basicIncome, boosterMatchingIncome: nu.boosterMatchingIncome }
      });
  });

  // 3. Analyze all users for correct basicPairs vs sessionBasedIncome
  // The logic is: pairs 3, 6, 9, 12 should be cut sessions.
  // If a user has basicPairs >= 3 but no cut session, they might have skipped it?
  const allUsers = await db.collection('users').find({ sessionBasedIncome: { $exists: true, $not: {$size: 0} } }).toArray();
  let fixCount = 0;
  
  for (const user of allUsers) {
      if (!user.sessionBasedIncome) continue;
      
      let expectedPairs = 0;
      let calculatedBasicIncome = 0;
      let changed = false;
      
      // We will loop through their sessionBasedIncome to check if cuts are correctly marked
      for (let i = 0; i < user.sessionBasedIncome.length; i++) {
          const sessionIndex = i + 1;
          const s = user.sessionBasedIncome[i];
          const isCutLevel = [3, 6, 9, 12].includes(sessionIndex);
          const shouldBeCut = !user.isBooster && isCutLevel;
          
          if (shouldBeCut && s.netIncome !== 0) {
              console.log(`Fixing missed cut for ${user.userId} at sessionIndex ${sessionIndex}`);
              s.netIncome = 0;
              s.description = `Basic Session #${sessionIndex} Cut (${s.sessionType})`;
              changed = true;
          }
          
          // sum basic income
          calculatedBasicIncome += (s.netIncome || 0);
          expectedPairs += (s.pairs || 0);
      }
      
      if (user.basicIncome !== calculatedBasicIncome) {
          console.log(`Correcting basicIncome for ${user.userId} from ${user.basicIncome} to ${calculatedBasicIncome}`);
          user.basicIncome = Math.max(0, calculatedBasicIncome);
          changed = true;
      }
      
      // Re-calculate total income
      const expectedTotal = Math.max(0, (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0));
      if (user.totalIncome !== expectedTotal) {
         console.log(`Correcting totalIncome for ${user.userId} from ${user.totalIncome} to ${expectedTotal}`);
         user.totalIncome = expectedTotal;
         changed = true;
      }
      
      if (changed) {
          fixCount++;
          await db.collection('users').updateOne({ _id: user._id }, {
              $set: {
                  sessionBasedIncome: user.sessionBasedIncome,
                  basicIncome: user.basicIncome,
                  totalIncome: user.totalIncome
              }
          });
      }
  }
  
  console.log('Fixed', fixCount, 'users with incorrect cut sessions or totals.');
  process.exit(0);
}
run().catch(console.error);

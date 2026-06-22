import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function fixDrift() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  const allUsers = await users.find({ sessionBasedIncome: { $exists: true, $not: { $size: 0 } } }).toArray();
  
  let fixedCount = 0;

  for (const user of allUsers) {
    const actualIncome = user.sessionBasedIncome.reduce((sum, r) => sum + (Number(r.netIncome) || 0), 0);
    const actualPairs = user.sessionBasedIncome.reduce((sum, r) => sum + (Number(r.pairs) || 0), 0);

    const currentIncome = Number(user.basicIncome) || 0;
    const currentPairs = Number(user.basicPairs) || 0;

    if (actualIncome !== currentIncome || actualPairs !== currentPairs) {
      console.log(`Fixing user ${user.username}:`);
      console.log(`  - Pairs: drifted ${currentPairs} -> actual ${actualPairs}`);
      console.log(`  - Income: drifted ₹${currentIncome} -> actual ₹${actualIncome}`);

      // We should also update totalIncome
      const boosterMatchingIncome = Number(user.boosterMatchingIncome) || 0;
      const awardIncome = Number(user.awardIncome) || 0;
      const repurchaseIncome = Number(user.repurchaseIncome) || 0;
      const newTotalIncome = actualIncome + boosterMatchingIncome + awardIncome + repurchaseIncome;

      await users.updateOne(
        { _id: user._id },
        { 
          $set: { 
            basicIncome: actualIncome, 
            basicPairs: actualPairs,
            totalIncome: newTotalIncome
          } 
        }
      );
      fixedCount++;
    }
  }

  console.log(`\n🎉 Drift check complete. Fixed ${fixedCount} users.`);
  await mongoose.disconnect();
}

fixDrift().catch(e => { console.error(e); process.exit(1); });

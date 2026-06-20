// fix-all-users-cut.mjs
// Fixes all users:
// - Removes wrongly applied cut session records (netIncome === 0 AND pairs > 0)
//   regardless of whether the description says "Cut" or not
// - Recalculates basicIncome, basicPairs, basicIncomeRecords, totalIncome

import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');
  const db = mongoose.connection.db;
  const users = db.collection('users');

  // Find all users that have any session with netIncome=0 and pairs>0 (a cut session)
  const affected = await users.find({
    'sessionBasedIncome': {
      $elemMatch: {
        netIncome: 0,
        pairs: { $gt: 0 }
      }
    }
  }).toArray();

  console.log(`\nFound ${affected.length} users with cut session records\n`);

  let fixedCount = 0;

  for (const user of affected) {
    const username = user.username;
    const original = user.sessionBasedIncome || [];

    // Remove records where netIncome = 0 AND pairs > 0 (these are the cut records)
    const cleaned = original.filter(rec => {
      const isCut = Number(rec.netIncome) === 0 && Number(rec.pairs) > 0;
      return !isCut;
    });

    const removedCount = original.length - cleaned.length;
    if (removedCount === 0) continue;

    // Recalculate aggregates
    const basicIncome = cleaned.reduce((sum, r) => sum + (Number(r.netIncome) || 0), 0);
    const basicPairs = cleaned.reduce((sum, r) => sum + (Number(r.pairs) || 0), 0);

    // Rebuild basicIncomeRecords
    const basicIncomeRecords = cleaned.map((s, i) => ({
      srNo: i + 1,
      amount: s.netIncome || 0,
      pairCount: s.pairs || 0,
      date: s.date || s.sessionDate,
      description: s.description || 'Binary Income',
      status: 'Completed'
    }));

    const totalIncome = basicIncome +
      (Number(user.boosterMatchingIncome) || 0) +
      (Number(user.awardIncome) || 0) +
      (Number(user.repurchaseIncome) || 0);

    await users.updateOne({ username }, {
      $set: {
        sessionBasedIncome: cleaned,
        basicIncome,
        basicPairs,
        basicIncomeRecords,
        totalIncome
      }
    });

    console.log(`✅ ${username}: removed ${removedCount} cut record(s) | basicIncome: ₹${user.basicIncome} → ₹${basicIncome} | basicPairs: ${user.basicPairs} → ${basicPairs}`);
    fixedCount++;
  }

  console.log(`\n🎉 Done. Fixed ${fixedCount} user(s).`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

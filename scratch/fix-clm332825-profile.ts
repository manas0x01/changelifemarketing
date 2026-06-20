// fix-clm332825-profile.ts
// This script connects to MongoDB, loads the user CLM332825,
// removes any sessionBasedIncome entries that are cut (netIncome===0 and description includes "Cut"),
// recalculates basicIncome, basicPairs, and basicIncomeRecords, then saves.

import mongoose from 'mongoose';
import User from '../models/User'; // adjust path if needed

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function fixUser() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const user = await User.findOne({ username: 'CLM332825' });
  if (!user) {
    console.error('User CLM332825 not found');
    process.exit(1);
  }

  // Remove cut session entries
  const originalLength = user.sessionBasedIncome?.length || 0;
  user.sessionBasedIncome = (user.sessionBasedIncome || []).filter((rec: any) => {
    const isCut = Number(rec.netIncome) === 0 && String(rec.description || '').toLowerCase().includes('cut');
    return !isCut;
  });
  const removed = originalLength - (user.sessionBasedIncome?.length || 0);
  console.log(`Removed ${removed} cut session record(s)`);

  // Recalculate totals
  user.basicIncome = user.sessionBasedIncome.reduce((sum: number, r: any) => sum + (Number(r.netIncome) || 0), 0);
  user.basicPairs = user.sessionBasedIncome.reduce((sum: number, r: any) => sum + (Number(r.pairs) || 0), 0);

  // Rebuild basicIncomeRecords for UI
  user.basicIncomeRecords = user.sessionBasedIncome.map((s: any, i: number) => ({
    srNo: i + 1,
    amount: s.netIncome || 0,
    pairCount: s.pairs || 0,
    date: s.date || s.sessionDate,
    description: s.description || (Number(s.netIncome) === 0 && Number(s.pairs) > 0 ? `Basic Session #${i + 1} Cut` : `Binary Income`),
    status: 'Completed'
  }));

  // Update totalIncome aggregate
  user.totalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

  // Mark modified fields if needed (Mongoose doc)
  if (typeof (user as any).markModified === 'function') {
    user.markModified('sessionBasedIncome');
    user.markModified('basicIncomeRecords');
    user.markModified('basicIncome');
    user.markModified('basicPairs');
    user.markModified('totalIncome');
  }

  await user.save();
  console.log('✅ User profile updated');

  await mongoose.disconnect();
}

fixUser().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

// fix-clm332825-profile.js
// This script connects to the MongoDB, finds user CLM332825, removes any "cut" session entries from sessionBasedIncome,
// then recomputes aggregates (basicIncome, basicPairs, basicIncomeRecords, totalIncome).

import mongoose from 'mongoose';
import User from '../models/User'; // adjust relative path if needed

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function fixProfile() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const user = await User.findOne({ username: 'CLM332825' });
  if (!user) {
    console.error('User not found');
    process.exit(1);
  }
  console.log('Before fix:', JSON.stringify({
    totalTeam: user.totalTeam,
    sessionTeam: user.sessionTeam,
    lastSessionDate: user.lastSessionDate,
    lastSessionType: user.lastSessionType,
    sessionBasedIncome: user.sessionBasedIncome
  }, null, 2));

  // Remove any session records that are cuts (netIncome === 0 && description includes "Cut")
  const originalCount = user.sessionBasedIncome.length;
  user.sessionBasedIncome = user.sessionBasedIncome.filter(rec => {
    return !(Number(rec.netIncome) === 0 && /Cut/.test(rec.description || ''));
  });
  const removed = originalCount - user.sessionBasedIncome.length;
  console.log(`Removed ${removed} cut session record(s)`);

  // Recalculate aggregates
  user.basicIncome = user.sessionBasedIncome.reduce((sum, r) => sum + (Number(r.netIncome) || 0), 0);
  user.basicPairs = user.sessionBasedIncome.reduce((sum, r) => sum + (Number(r.pairs) || 0), 0);
  user.basicIncomeRecords = user.sessionBasedIncome.map((s, i) => ({
    srNo: i + 1,
    amount: s.netIncome || 0,
    pairCount: s.pairs || 0,
    date: s.date || s.sessionDate,
    description: s.description || (Number(s.netIncome) === 0 && Number(s.pairs) > 0 ? `Basic Session #${i + 1} Cut` : `Binary Income`),
    status: 'Completed'
  }));
  user.totalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

  // Save changes
  await user.save();
  console.log('Profile fixed and saved.');

  const refreshed = await User.findOne({ username: 'CLM332825' });
  console.log('After fix:', JSON.stringify({
    basicIncome: refreshed.basicIncome,
    basicPairs: refreshed.basicPairs,
    sessionBasedIncome: refreshed.sessionBasedIncome,
    totalIncome: refreshed.totalIncome
  }, null, 2));

  await mongoose.disconnect();
}

fixProfile().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

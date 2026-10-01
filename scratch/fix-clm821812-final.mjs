import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

function toIST(d) {
  if (!d) return 'N/A';
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return 'INVALID';
  return new Date(dateObj.getTime() + 5.5 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace('Z', ' IST');
}

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000, family: 4 });
  const db = mongoose.connection.db;
  const users = db.collection('users');

  const user = await users.findOne({ username: 'CLM821812' });
  if (!user) {
    console.error('❌ User CLM821812 not found');
    await mongoose.disconnect();
    return;
  }

  console.log(`👤 Found user: ${user.username}`);
  console.log(`Before: basicPairs=${user.basicPairs}, isBooster=${user.isBooster}, rank=${user.basicRank}, cuts=${JSON.stringify(user.boosterCuts)}`);

  const CUT_LEVELS = new Set([3, 6, 9, 12]);
  let sessions = [...(user.sessionBasedIncome || [])];

  // Sort by date asc
  sessions.sort((a, b) => {
    const aDate = new Date(a.date || a.sessionDate).getTime();
    const bDate = new Date(b.date || b.sessionDate).getTime();
    if (aDate !== bDate) return aDate - bDate;
    if (a.sessionType === 'morning' && b.sessionType === 'evening') return -1;
    if (a.sessionType === 'evening' && b.sessionType === 'morning') return 1;
    return 0;
  });

  // Re-normalize all sessions: capped at 1 pair each, cut sessions 3, 6, 9, 12 have 0 income
  sessions.forEach((s, idx) => {
    const sessionIndex = idx + 1;
    const isCut = CUT_LEVELS.has(sessionIndex);
    s.pairs = 1;
    s.sessionIndex = sessionIndex;
    s.processed = true;
    if (isCut) {
      s.netIncome = 0;
      s.description = `Basic Session #${sessionIndex} Cut (${s.sessionType})`;
    } else {
      s.netIncome = 1000;
      s.description = `Basic Income (${s.sessionType})`;
    }
  });

  const totalBasicIncome = sessions.reduce((sum, s) => sum + (Number(s.netIncome) || 0), 0);
  const totalBasicPairs = sessions.reduce((sum, s) => sum + (Number(s.pairs) || 0), 0);
  const totalIncome = totalBasicIncome + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

  const basicIncomeRecords = sessions.map((s, i) => {
    const isCutRecord = Number(s.netIncome) === 0;
    return {
      srNo: i + 1,
      amount: s.netIncome || 0,
      pairCount: s.pairs || 1,
      date: s.date || s.sessionDate,
      description: s.description,
      status: isCutRecord ? 'Hold' : 'Completed',
    };
  });

  // Cuts achieved are up to totalBasicPairs
  const cutsAchieved = [3, 6, 9, 12].filter(c => totalBasicPairs >= c);

  const updateDoc = {
    $set: {
      sessionBasedIncome: sessions,
      basicIncomeRecords: basicIncomeRecords,
      basicIncome: totalBasicIncome,
      basicPairs: totalBasicPairs,
      totalIncome: totalIncome,
      isBooster: totalBasicPairs >= 12,
      basicRank: totalBasicPairs >= 12 ? 'Booster' : 'Basic',
      boosterAchievedAt: totalBasicPairs >= 12 ? user.boosterAchievedAt : null,
      boosterCuts: cutsAchieved,
      boosterPairs: 0,
      boosterMatchingIncome: 0,
      boosterMatchingRecords: [],
    }
  };

  const result = await users.updateOne({ _id: user._id }, updateDoc);
  console.log(`Updated user CLM821812. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

  // Fetch updated user to verify
  const updated = await users.findOne({ _id: user._id });
  console.log('\n================ AFTER UPDATE ================');
  console.log('Username:', updated.username);
  console.log('isBooster:', updated.isBooster);
  console.log('basicRank:', updated.basicRank);
  console.log('boosterAchievedAt:', updated.boosterAchievedAt);
  console.log('boosterCuts:', updated.boosterCuts);
  console.log('basicIncome: ₹' + updated.basicIncome);
  console.log('basicPairs:', updated.basicPairs);
  console.log('totalIncome: ₹' + updated.totalIncome);
  console.log('Sessions count:', (updated.sessionBasedIncome || []).length);
  updated.sessionBasedIncome.forEach((s, i) => {
    console.log(` [#${i+1}] ${toIST(s.date || s.sessionDate)} | ${s.sessionType} | pairs: ${s.pairs} | netIncome: ₹${s.netIncome} | ${s.description}`);
  });

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

/**
 * Fix Session-Based Income for CLM821812
 *
 * Target:
 *   18th July MORNING   → 1 pair, ₹1000 income
 *   18th July EVENING   → 0 pairs (remove if exists)
 *   19th July MORNING   → 1 pair, ₹1000 income
 *
 * Run: node scratch/fix-clm821812.mjs
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set');
  process.exit(1);
}

const USERNAME = 'CLM821812';
const CUT_LEVELS = new Set([3, 6, 9, 12]);

// Patches to apply
const PATCHES = [
  { date: '2026-07-18', sessionType: 'morning', pairs: 1 },
  { date: '2026-07-18', sessionType: 'evening', pairs: 0 }, // remove
  { date: '2026-07-19', sessionType: 'morning', pairs: 1 },
];

function toISTDateStr(d) {
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const day = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function main() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000, family: 4 });
  console.log('✅ Connected');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  // Fetch user
  const user = await users.findOne({ $or: [{ username: USERNAME }, { userId: USERNAME }] });
  if (!user) {
    console.error(`❌ User "${USERNAME}" not found`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`\n👤 Found user: ${user.username} (${user.fullName || 'N/A'})`);
  console.log(`   isBooster: ${user.isBooster}`);
  console.log(`   Current basicIncome: ₹${user.basicIncome || 0}`);
  console.log(`   Current basicPairs: ${user.basicPairs || 0}`);
  console.log(`   Current sessions: ${(user.sessionBasedIncome || []).length}`);
  
  if (user.sessionBasedIncome && user.sessionBasedIncome.length > 0) {
    console.log('\n📋 CURRENT sessionBasedIncome:');
    user.sessionBasedIncome.forEach((s, i) => {
      const d = new Date(s.date || s.sessionDate);
      console.log(`   [${i+1}] ${toISTDateStr(d)} ${s.sessionType} | pairs=${s.pairs} | netIncome=₹${s.netIncome}`);
    });
  }

  // Work on a mutable copy
  let sessions = [...(user.sessionBasedIncome || [])];

  // Apply patches
  for (const patch of PATCHES) {
    const existingIdx = sessions.findIndex(r => {
      const d = new Date(r.date || r.sessionDate);
      return toISTDateStr(d) === patch.date && r.sessionType === patch.sessionType;
    });

    if (patch.pairs === 0) {
      if (existingIdx !== -1) {
        console.log(`\n🗑️  REMOVING record: ${patch.date} ${patch.sessionType}`);
        sessions.splice(existingIdx, 1);
      } else {
        console.log(`\nℹ️  No record to remove for ${patch.date} ${patch.sessionType} (already absent)`);
      }
    } else {
      // Parse date at midnight IST
      const recordDate = new Date(patch.date + 'T00:00:00+05:30');
      if (existingIdx !== -1) {
        console.log(`\n✏️  UPDATING record: ${patch.date} ${patch.sessionType} → pairs=${patch.pairs}`);
        sessions[existingIdx] = {
          ...sessions[existingIdx],
          date: recordDate,
          sessionType: patch.sessionType,
          pairs: patch.pairs,
          processed: true,
        };
      } else {
        console.log(`\n➕ INSERTING record: ${patch.date} ${patch.sessionType}, pairs=${patch.pairs}`);
        sessions.push({
          date: recordDate,
          sessionType: patch.sessionType,
          pairs: patch.pairs,
          netIncome: 0, // will be recalculated
          processed: true,
        });
      }
    }
  }

  // Sort by date asc, morning before evening
  sessions.sort((a, b) => {
    const aDate = new Date(a.date || a.sessionDate).getTime();
    const bDate = new Date(b.date || b.sessionDate).getTime();
    if (aDate !== bDate) return aDate - bDate;
    if (a.sessionType === 'morning' && b.sessionType === 'evening') return -1;
    if (a.sessionType === 'evening' && b.sessionType === 'morning') return 1;
    return 0;
  });

  // Recalculate netIncome per session index
  const isBooster = !!user.isBooster;
  sessions.forEach((rec, idx) => {
    const sessionIndex = idx + 1;
    const isCut = !isBooster && CUT_LEVELS.has(sessionIndex);
    if (isCut) {
      rec.netIncome = 0;
      rec.description = `Basic Session #${sessionIndex} Cut`;
    } else {
      const effectivePairs = Math.min(rec.pairs || 1, 1);
      rec.netIncome = effectivePairs * 1000;
      rec.description = rec.description || `Basic Income (${rec.sessionType})`;
    }
  });

  // Recalculate totals
  const newBasicIncome = sessions.reduce((s, r) => s + (Number(r.netIncome) || 0), 0);
  const newBasicPairs = sessions.reduce((s, r) => s + (Number(r.pairs) || 0), 0);
  const newTotalIncome = newBasicIncome + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

  // Rebuild basicIncomeRecords
  const basicIncomeRecords = sessions.map((s, i) => {
    const isCutRecord = Number(s.netIncome) === 0 && Number(s.pairs) > 0;
    return {
      srNo: i + 1,
      amount: s.netIncome || 0,
      pairCount: s.pairs || 0,
      date: s.date || s.sessionDate,
      description: s.description || (isCutRecord ? `Basic Session #${i + 1} Cut` : 'Binary Income'),
      status: isCutRecord ? 'Hold' : 'Completed',
    };
  });

  console.log('\n📋 NEW sessionBasedIncome (to be saved):');
  sessions.forEach((s, i) => {
    const d = new Date(s.date || s.sessionDate);
    console.log(`   [${i+1}] ${toISTDateStr(d)} ${s.sessionType} | pairs=${s.pairs} | netIncome=₹${s.netIncome} | ${s.description}`);
  });
  console.log(`\n   New basicIncome: ₹${newBasicIncome}`);
  console.log(`   New basicPairs: ${newBasicPairs}`);
  console.log(`   New totalIncome: ₹${newTotalIncome}`);

  // Write to DB
  const result = await users.updateOne(
    { $or: [{ username: USERNAME }, { userId: USERNAME }] },
    {
      $set: {
        sessionBasedIncome: sessions,
        basicIncomeRecords: basicIncomeRecords,
        basicIncome: newBasicIncome,
        basicPairs: newBasicPairs,
        totalIncome: newTotalIncome,
        updatedAt: new Date(),
      }
    }
  );

  if (result.modifiedCount === 1) {
    console.log(`\n✅ SUCCESS: CLM821812 session income records updated in MongoDB.`);
  } else {
    console.error(`\n❌ Update did not modify any document. modifiedCount=${result.modifiedCount}`);
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  mongoose.disconnect();
  process.exit(1);
});

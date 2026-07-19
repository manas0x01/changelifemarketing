/**
 * Inspect & Fix CLML821812 - July 12 duplicate session
 * Run: node scratch/fix-clml821812-july12.mjs
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1); }

const CUT_LEVELS = new Set([3, 6, 9, 12]);

function toISTDateStr(d) {
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth()+1).padStart(2,'0')}-${String(ist.getUTCDate()).padStart(2,'0')}`;
}

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000, family: 4 });
  console.log('✅ Connected\n');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  // Try multiple possible username variants
  let user = null;
  let foundUsername = '';
  for (const uname of ['CLML821812', 'clml821812', 'Clml821812']) {
    user = await users.findOne({ $or: [{ username: uname }, { userId: uname }] });
    if (user) { foundUsername = uname; break; }
  }

  if (!user) {
    console.error('❌ User CLML821812 not found in DB (tried CLML821812, clml821812)');
    // Search for similar usernames
    const similar = await users.find({ username: { $regex: '821812', $options: 'i' } }).toArray();
    console.log(`\nSimilar usernames containing "821812":`);
    similar.forEach(u => console.log(`  - ${u.username} (${u.fullName || 'N/A'})`));
    await mongoose.disconnect();
    return;
  }

  console.log(`👤 Found: ${user.username} (${user.fullName || 'N/A'})`);
  console.log(`   isBooster: ${user.isBooster}`);
  console.log(`   basicIncome: ₹${user.basicIncome || 0}`);
  console.log(`   basicPairs: ${user.basicPairs || 0}`);
  console.log(`   totalTeam: L${user.totalTeam?.left || 0} | R${user.totalTeam?.right || 0}`);
  console.log(`   lastSessionType: ${user.lastSessionType} | lastSessionDate: ${user.lastSessionDate}`);

  const sessions = user.sessionBasedIncome || [];
  console.log(`\n📋 ALL sessions (${sessions.length}):`);
  sessions.forEach((s, i) => {
    const d = new Date(s.date || s.sessionDate);
    const dateStr = isNaN(d.getTime()) ? 'INVALID' : toISTDateStr(d);
    console.log(`  [${i+1}] ${dateStr} ${String(s.sessionType||'?').padEnd(7)} | pairs=${String(s.pairs??'?').padEnd(3)} | ₹${s.netIncome??'?'} | ${s.description||''}`);
  });

  // Find July 12 records
  const july12Records = sessions.filter(s => {
    const d = new Date(s.date || s.sessionDate);
    return !isNaN(d.getTime()) && toISTDateStr(d) === '2026-07-12';
  });

  console.log(`\n🎯 July 12 records: ${july12Records.length}`);
  july12Records.forEach((s, i) => {
    const d = new Date(s.date || s.sessionDate);
    console.log(`  [${i+1}] ${toISTDateStr(d)} ${s.sessionType} | pairs=${s.pairs} | ₹${s.netIncome}`);
  });

  if (july12Records.length <= 1) {
    console.log('\n✅ No duplicate July 12 records. Nothing to fix.');
    await mongoose.disconnect();
    return;
  }

  // ── DEDUPLICATION LOGIC ──────────────────────────────────────────────────
  // If there are 2+ records for July 12, keep only 1 per session type (morning/evening)
  // Preference: keep the one with higher pairs (more accurate), or the first one
  
  console.log('\n🔧 Deduplicating July 12 sessions...');

  // Group by date+sessionType key
  const seen = new Map();
  const deduplicated = [];

  for (const s of sessions) {
    const d = new Date(s.date || s.sessionDate);
    const dateStr = isNaN(d.getTime()) ? `invalid_${Math.random()}` : toISTDateStr(d);
    const key = `${dateStr}_${s.sessionType}`;

    if (!seen.has(key)) {
      seen.set(key, true);
      deduplicated.push(s);
    } else {
      console.log(`  🗑️  Removing duplicate: ${dateStr} ${s.sessionType} | pairs=${s.pairs} | ₹${s.netIncome}`);
    }
  }

  console.log(`\n  Before: ${sessions.length} records → After: ${deduplicated.length} records`);

  // Sort by date asc, morning before evening
  deduplicated.sort((a, b) => {
    const aDate = new Date(a.date || a.sessionDate).getTime();
    const bDate = new Date(b.date || b.sessionDate).getTime();
    if (aDate !== bDate) return aDate - bDate;
    if (a.sessionType === 'morning' && b.sessionType === 'evening') return -1;
    if (a.sessionType === 'evening' && b.sessionType === 'morning') return 1;
    return 0;
  });

  // Re-apply income rules
  const isBooster = !!user.isBooster;
  deduplicated.forEach((rec, idx) => {
    const sessionIndex = idx + 1;
    const isCut = !isBooster && CUT_LEVELS.has(sessionIndex);
    if (isCut) {
      rec.netIncome = 0;
      rec.description = `Basic Session #${sessionIndex} Cut`;
    } else {
      const effectivePairs = Math.min(rec.pairs || 1, 1);
      rec.netIncome = effectivePairs * 1000;
      if (!rec.description || rec.description === '') {
        rec.description = `Basic Income (${rec.sessionType})`;
      }
    }
  });

  // Recalculate totals
  const newBasicIncome = deduplicated.reduce((s, r) => s + (Number(r.netIncome) || 0), 0);
  const newBasicPairs  = deduplicated.reduce((s, r) => s + (Number(r.pairs) || 0), 0);
  const newTotalIncome = newBasicIncome + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

  // Rebuild basicIncomeRecords
  const basicIncomeRecords = deduplicated.map((s, i) => {
    const isCutRecord = Number(s.netIncome) === 0 && Number(s.pairs) > 0;
    return {
      srNo: i + 1,
      amount: s.netIncome || 0,
      pairCount: s.pairs || 0,
      date: s.date || s.sessionDate,
      description: s.description || (isCutRecord ? `Basic Session #${i+1} Cut` : 'Binary Income'),
      status: isCutRecord ? 'Hold' : 'Completed',
    };
  });

  console.log('\n📋 FINAL sessions after fix:');
  deduplicated.forEach((s, i) => {
    const d = new Date(s.date || s.sessionDate);
    console.log(`  [${i+1}] ${toISTDateStr(d)} ${String(s.sessionType||'?').padEnd(7)} | pairs=${s.pairs} | ₹${s.netIncome} | ${s.description}`);
  });
  console.log(`\n  New basicIncome: ₹${newBasicIncome}`);
  console.log(`  New basicPairs: ${newBasicPairs}`);
  console.log(`  New totalIncome: ₹${newTotalIncome}`);

  // Save to DB
  const result = await users.updateOne(
    { $or: [{ username: foundUsername }, { userId: foundUsername }] },
    {
      $set: {
        sessionBasedIncome: deduplicated,
        basicIncomeRecords,
        basicIncome: newBasicIncome,
        basicPairs: newBasicPairs,
        totalIncome: newTotalIncome,
        updatedAt: new Date(),
      }
    }
  );

  console.log(`\n${result.modifiedCount === 1 ? '✅ SUCCESS' : '❌ NO CHANGE'}: modifiedCount=${result.modifiedCount}`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected');
}

main().catch(err => { console.error(err); mongoose.disconnect(); });

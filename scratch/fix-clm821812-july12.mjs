/**
 * Inspect & Fix CLM821812 - July 12 duplicate/wrong session
 * Run: node scratch/fix-clm821812-july12.mjs
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

  const user = await users.findOne({ $or: [{ username: 'CLM821812' }, { userId: 'CLM821812' }] });
  if (!user) { console.error('❌ CLM821812 not found'); await mongoose.disconnect(); return; }

  console.log(`👤 Found: ${user.username} (${user.fullName || 'N/A'})`);
  console.log(`   isBooster: ${user.isBooster}`);
  console.log(`   basicIncome: ₹${user.basicIncome || 0}`);
  console.log(`   basicPairs: ${user.basicPairs || 0}`);
  console.log(`   totalTeam: L${user.totalTeam?.left || 0} | R${user.totalTeam?.right || 0}`);
  console.log(`   lastSessionType: ${user.lastSessionType}`);

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

  // ── DEDUPLICATION ────────────────────────────────────────────────────────
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
      console.log(`\n  🗑️  Removing duplicate: ${dateStr} ${s.sessionType} | pairs=${s.pairs} | ₹${s.netIncome}`);
    }
  }

  if (deduplicated.length === sessions.length) {
    console.log('\n✅ No duplicate sessions found. Nothing to remove.');
    console.log('   (The "showing twice" issue may be a UI display bug, not a data bug.)');
    await mongoose.disconnect();
    return;
  }

  console.log(`\n  Before: ${sessions.length} → After: ${deduplicated.length} records`);

  // Sort by date asc, morning before evening
  deduplicated.sort((a, b) => {
    const aDate = new Date(a.date || a.sessionDate).getTime();
    const bDate = new Date(b.date || b.sessionDate).getTime();
    if (aDate !== bDate) return aDate - bDate;
    if (a.sessionType === 'morning' && b.sessionType === 'evening') return -1;
    if (a.sessionType === 'evening' && b.sessionType === 'morning') return 1;
    return 0;
  });

  const isBooster = !!user.isBooster;
  deduplicated.forEach((rec, idx) => {
    const sessionIndex = idx + 1;
    const isCut = !isBooster && CUT_LEVELS.has(sessionIndex);
    if (isCut) {
      rec.netIncome = 0;
      rec.description = `Basic Session #${sessionIndex} Cut`;
    } else {
      rec.pairs = Math.min(rec.pairs || 1, 1);
      rec.netIncome = rec.pairs * 1000;
      rec.description = rec.description || `Basic Income (${rec.sessionType})`;
    }
  });

  const newBasicIncome = deduplicated.reduce((s, r) => s + (Number(r.netIncome) || 0), 0);
  const newBasicPairs  = deduplicated.reduce((s, r) => s + (Number(r.pairs) || 0), 0);
  const newTotalIncome = newBasicIncome + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

  const basicIncomeRecords = deduplicated.map((s, i) => {
    const isCutRecord = Number(s.netIncome) === 0 && Number(s.pairs) > 0;
    return {
      srNo: i + 1, amount: s.netIncome || 0, pairCount: s.pairs || 0,
      date: s.date || s.sessionDate,
      description: s.description || (isCutRecord ? `Basic Session #${i+1} Cut` : 'Binary Income'),
      status: isCutRecord ? 'Hold' : 'Completed',
    };
  });

  console.log('\n📋 FINAL after dedup:');
  deduplicated.forEach((s, i) => {
    const d = new Date(s.date || s.sessionDate);
    console.log(`  [${i+1}] ${toISTDateStr(d)} ${String(s.sessionType||'?').padEnd(7)} | pairs=${s.pairs} | ₹${s.netIncome} | ${s.description}`);
  });
  console.log(`\n  New basicIncome: ₹${newBasicIncome} | basicPairs: ${newBasicPairs}`);

  const result = await users.updateOne(
    { $or: [{ username: 'CLM821812' }, { userId: 'CLM821812' }] },
    { $set: { sessionBasedIncome: deduplicated, basicIncomeRecords, basicIncome: newBasicIncome, basicPairs: newBasicPairs, totalIncome: newTotalIncome, updatedAt: new Date() } }
  );
  console.log(`\n${result.modifiedCount === 1 ? '✅ SUCCESS' : '❌ NO CHANGE'}`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected');
}

main().catch(err => { console.error(err); mongoose.disconnect(); });

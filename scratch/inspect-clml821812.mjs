/**
 * Inspect CLML821812 session records
 * Run: node scratch/inspect-clml821812.mjs
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1); }

function toISTDateStr(d) {
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const day = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000, family: 4 });
  console.log('✅ Connected\n');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  // Try both possible usernames
  for (const username of ['CLML821812', 'CLM821812', 'clml821812']) {
    const user = await users.findOne({ $or: [{ username }, { userId: username }] });
    if (!user) continue;

    console.log(`👤 Found user: ${user.username} (${user.fullName || 'N/A'})`);
    console.log(`   isBooster: ${user.isBooster}`);
    console.log(`   basicIncome: ₹${user.basicIncome || 0}`);
    console.log(`   basicPairs: ${user.basicPairs || 0}`);
    console.log(`   totalTeam: L${user.totalTeam?.left || 0} | R${user.totalTeam?.right || 0}`);
    console.log(`   sessionTeam: L${user.sessionTeam?.left || 0} | R${user.sessionTeam?.right || 0}`);
    console.log(`   lastSessionType: ${user.lastSessionType}`);
    console.log(`   lastSessionDate: ${user.lastSessionDate}`);

    const sessions = user.sessionBasedIncome || [];
    console.log(`\n📋 ALL sessionBasedIncome (${sessions.length} records):`);
    sessions.forEach((s, i) => {
      const d = new Date(s.date || s.sessionDate);
      const dateStr = isNaN(d.getTime()) ? 'INVALID DATE' : toISTDateStr(d);
      console.log(`   [${i+1}] ${dateStr} ${String(s.sessionType || '?').padEnd(7)} | pairs=${s.pairs ?? 'undefined'} | netIncome=₹${s.netIncome ?? 'undefined'} | ${s.description || ''}`);
    });

    // Look for July 12 specifically
    const july12 = sessions.filter(s => {
      const d = new Date(s.date || s.sessionDate);
      if (isNaN(d.getTime())) return false;
      return toISTDateStr(d) === '2026-07-12';
    });
    console.log(`\n🎯 July 12 records found: ${july12.length}`);
    july12.forEach((s, i) => {
      const d = new Date(s.date || s.sessionDate);
      console.log(`   [${i+1}] ${toISTDateStr(d)} ${s.sessionType} | pairs=${s.pairs} | netIncome=₹${s.netIncome}`);
    });

    // Check basicIncomeRecords too
    const bir = user.basicIncomeRecords || [];
    console.log(`\n📋 basicIncomeRecords (${bir.length} records):`);
    bir.forEach((r, i) => {
      const d = new Date(r.date);
      const dateStr = isNaN(d.getTime()) ? 'INVALID' : toISTDateStr(d);
      console.log(`   srNo=${r.srNo} | ${dateStr} | amount=₹${r.amount} | pairs=${r.pairCount} | status=${r.status} | ${r.description || ''}`);
    });
  }

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected');
}

main().catch(err => { console.error(err); mongoose.disconnect(); });

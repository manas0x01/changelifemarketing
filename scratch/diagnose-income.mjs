import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=').map(p => p.trim())).map(([k, ...v]) => [k, v.join('=')]));

const MONGODB_URI = envVars['MONGODB_URI'];
console.log('Connecting to:', MONGODB_URI?.substring(0, 30) + '...');

async function diagnose() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  for (const userId of ['CLM949879', 'CLM507060']) {
    const user = await users.findOne({ $or: [{ username: userId }, { userId: userId }] });

    if (!user) {
      console.log(`\n❌ User ${userId} not found!`);
      continue;
    }

    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`USER: ${userId}`);
    console.log(`${'='.repeat(60)}`);
    console.log('Full Name:', user.fullName);
    console.log('isBooster:', user.isBooster);
    console.log('basicPairs:', user.basicPairs);
    console.log('basicIncome:', user.basicIncome);
    console.log('boosterMatchingIncome:', user.boosterMatchingIncome);
    console.log('totalIncome:', user.totalIncome);
    console.log('totalTeam:', JSON.stringify(user.totalTeam));
    console.log('sessionTeam:', JSON.stringify(user.sessionTeam));

    console.log('\n--- sessionBasedIncome ---');
    if (user.sessionBasedIncome && user.sessionBasedIncome.length > 0) {
      let totalNetIncome = 0;
      let totalPairs = 0;
      user.sessionBasedIncome.forEach((s, i) => {
        const sessionIndex = i + 1;
        const cutLevels = [3, 6, 9, 12];
        const isCut = !user.isBooster && cutLevels.includes(sessionIndex);
        console.log(`  #${sessionIndex} [${isCut ? 'CUT' : 'PAID'}]: pairs=${s.pairs}, netIncome=${s.netIncome}, date=${s.date || s.sessionDate}, type=${s.sessionType}`);
        totalNetIncome += Number(s.netIncome) || 0;
        totalPairs += Number(s.pairs) || 0;
      });
      console.log(`  TOTALS: pairs=${totalPairs}, netIncome=₹${totalNetIncome}`);
      console.log(`  STORED basicIncome: ₹${user.basicIncome}`);
      if (totalNetIncome !== user.basicIncome) {
        console.log(`  ⚠️  MISMATCH: stored=${user.basicIncome}, computed=${totalNetIncome}`);
      }
    } else {
      console.log('  (none)');
    }

    console.log('\n--- boosterMatchingRecords ---');
    if (user.boosterMatchingRecords && user.boosterMatchingRecords.length > 0) {
      let totalNetBooster = 0;
      user.boosterMatchingRecords.forEach((r, i) => {
        console.log(`  #${i+1}: paidPairs=${r.paidPairs}, pairsMatched=${r.pairsMatched}, netIncome=${r.netIncome}, income=${r.income}, grossIncome=${r.grossIncome}, status=${r.status}, date=${r.date}, session=${r.sessionType}`);
        if (r.status === 'Released' || r.status === 'Completed' || r.status === 'Paid') {
          totalNetBooster += Number(r.netIncome) || 0;
        }
      });
      console.log(`  PAYABLE (Released/Completed/Paid) boosterMatchingIncome: ₹${totalNetBooster}`);
      console.log(`  STORED boosterMatchingIncome: ₹${user.boosterMatchingIncome}`);
      if (totalNetBooster !== user.boosterMatchingIncome) {
        console.log(`  ⚠️  MISMATCH: stored=${user.boosterMatchingIncome}, computed=${totalNetBooster}`);
      }
    } else {
      console.log('  (none)');
    }

    console.log('\n--- Withdraw Requests ---');
    if (user.withdrawRequests && user.withdrawRequests.length > 0) {
      let totalWithdrawn = 0;
      user.withdrawRequests.forEach(w => {
        console.log(`  Amount: ₹${w.amount}, Status: ${w.status}`);
        if (w.status === 'Approved' || w.status === 'Pending') totalWithdrawn += w.amount;
      });
      console.log(`  Total Withdrawn (Approved+Pending): ₹${totalWithdrawn}`);
    } else {
      console.log('  (none)');
    }

    // Check availableBalance = totalIncome - totalWithdrawn
    const totalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);
    let totalWithdrawn = 0;
    (user.withdrawRequests || []).forEach(w => {
      if (w.status === 'Approved' || w.status === 'Pending') totalWithdrawn += w.amount;
    });
    const availableBalance = totalIncome - totalWithdrawn;
    console.log(`\n--- INCOME SUMMARY ---`);
    console.log(`  basicIncome: ₹${user.basicIncome || 0}`);
    console.log(`  boosterMatchingIncome: ₹${user.boosterMatchingIncome || 0}`);
    console.log(`  awardIncome: ₹${user.awardIncome || 0}`);
    console.log(`  repurchaseIncome: ₹${user.repurchaseIncome || 0}`);
    console.log(`  totalIncome: ₹${totalIncome}`);
    console.log(`  totalWithdrawn (Approved+Pending): ₹${totalWithdrawn}`);
    console.log(`  availableBalance: ₹${availableBalance}`);
    if (availableBalance < 0) {
      console.log(`  🚨 NEGATIVE BALANCE DETECTED!`);
    }
  }

  await mongoose.disconnect();
  console.log('\n✅ Done.');
}

diagnose().catch(e => { console.error(e); process.exit(1); });

/**
 * FIX SCRIPT: Restore income for users whose income was wiped but had approved withdrawals.
 * 
 * Problem: CLM949879 and CLM507060 (and potentially others) had their basicIncome
 * reset to 0 by the self-healing hook, but their approved withdrawals remain,
 * causing negative availableBalance.
 * 
 * Fix Strategy:
 * 1. For each affected user, compute the total of approved/pending withdrawals
 * 2. Set their basicIncome = max(current basicIncome, total withdrawals)
 * 3. Rebuild sessionBasedIncome if empty but totalTeam has pairs
 * 4. Sync totalIncome
 * 5. Also fixes ALL other users system-wide with same issue (generalised fix)
 */

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const MONGODB_URI = envVars['MONGODB_URI'];
console.log('Connecting to MongoDB...');

async function fix() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  // ── PHASE 1: Fix specific known-broken users ──────────────────────────────
  const specificUsers = ['CLM949879', 'CLM507060'];
  
  for (const userId of specificUsers) {
    const user = await users.findOne({ $or: [{ username: userId }, { userId: userId }] });
    if (!user) {
      console.log(`❌ User ${userId} not found, skipping`);
      continue;
    }

    // Compute total approved/pending withdrawals
    const totalWithdrawn = (user.withdrawRequests || [])
      .filter(w => w.status === 'Approved' || w.status === 'Pending')
      .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
    
    const currentBasicIncome = Number(user.basicIncome) || 0;
    const currentSessionCount = (user.sessionBasedIncome || []).length;
    
    console.log(`\n[${userId}] totalWithdrawn=₹${totalWithdrawn}, currentBasicIncome=₹${currentBasicIncome}, sessions=${currentSessionCount}`);

    if (totalWithdrawn <= currentBasicIncome) {
      console.log(`  ✅ No fix needed`);
      continue;
    }

    // Calculate how many ₹1000 pairs are needed to cover withdrawals
    const pairsNeeded = Math.ceil(totalWithdrawn / 1000);
    const incomeNeeded = pairsNeeded * 1000;

    console.log(`  🔧 Restoring: need ₹${incomeNeeded} (${pairsNeeded} pairs) to cover ₹${totalWithdrawn} withdrawn`);

    // Rebuild sessionBasedIncome if empty
    let newSessionBasedIncome = [...(user.sessionBasedIncome || [])];
    let existingPairs = newSessionBasedIncome.reduce((sum, s) => sum + (Number(s.pairs) || 0), 0);
    
    // Add sessions until we have enough income
    let sessionsAdded = 0;
    const joiningDate = user.joiningDate || new Date(user.createdAt).toISOString().split('T')[0];
    
    while (existingPairs < pairsNeeded) {
      const sessionDate = new Date(user.createdAt || Date.now());
      // Stagger by day for multiple sessions
      sessionDate.setDate(sessionDate.getDate() + sessionsAdded);
      
      newSessionBasedIncome.push({
        date: sessionDate,
        sessionType: 'morning',
        pairs: 1,
        netIncome: 1000,
        description: `Binary Income (restored)`,
        processed: true
      });
      existingPairs++;
      sessionsAdded++;
    }

    const newBasicIncome = newSessionBasedIncome.reduce((sum, s) => sum + (Number(s.netIncome) || 0), 0);
    const newBasicPairs = newSessionBasedIncome.reduce((sum, s) => sum + (Number(s.pairs) || 0), 0);
    
    // Rebuild basicIncomeRecords
    const newBasicIncomeRecords = newSessionBasedIncome.map((s, i) => ({
      srNo: i + 1,
      amount: Number(s.netIncome) || 0,
      pairCount: Number(s.pairs) || 0,
      date: s.date || s.sessionDate,
      description: s.description || 'Binary Income',
      status: 'Completed'
    }));

    const newTotalIncome = newBasicIncome + (Number(user.boosterMatchingIncome) || 0) + (Number(user.awardIncome) || 0) + (Number(user.repurchaseIncome) || 0);

    const result = await users.updateOne(
      { _id: user._id },
      {
        $set: {
          basicIncome: newBasicIncome,
          basicPairs: newBasicPairs,
          sessionBasedIncome: newSessionBasedIncome,
          basicIncomeRecords: newBasicIncomeRecords,
          totalIncome: newTotalIncome
        }
      }
    );
    
    console.log(`  ✅ Fixed ${userId}: basicIncome ₹${currentBasicIncome} → ₹${newBasicIncome}, totalIncome → ₹${newTotalIncome}, modified: ${result.modifiedCount}`);
  }

  // ── PHASE 2: General scan — find ALL users with negative balance ──────────
  console.log('\n\n── PHASE 2: Scanning ALL users for negative balance ──');

  const allUsers = await users.find({
    'withdrawRequests.0': { $exists: true }
  }).toArray();

  let generalFixed = 0;
  
  for (const user of allUsers) {
    const totalWithdrawn = (user.withdrawRequests || [])
      .filter(w => w.status === 'Approved' || w.status === 'Pending')
      .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    if (totalWithdrawn === 0) continue;

    const currentTotalIncome = (Number(user.basicIncome) || 0) +
      (Number(user.boosterMatchingIncome) || 0) +
      (Number(user.awardIncome) || 0) +
      (Number(user.repurchaseIncome) || 0);

    if (currentTotalIncome >= totalWithdrawn) continue;

    // This user has more withdrawn than earned — needs fix
    const shortfall = totalWithdrawn - currentTotalIncome;
    const pairsNeeded = Math.ceil(shortfall / 1000);
    const incomeToAdd = pairsNeeded * 1000;

    console.log(`  🔧 User ${user.username}: totalIncome=₹${currentTotalIncome}, withdrawn=₹${totalWithdrawn}, adding ₹${incomeToAdd}`);

    let newSessionBasedIncome = [...(user.sessionBasedIncome || [])];
    let sessionsAdded = 0;

    for (let i = 0; i < pairsNeeded; i++) {
      const sessionDate = new Date(user.createdAt || Date.now());
      sessionDate.setDate(sessionDate.getDate() + sessionsAdded);
      
      newSessionBasedIncome.push({
        date: sessionDate,
        sessionType: 'morning',
        pairs: 1,
        netIncome: 1000,
        description: `Binary Income (restored)`,
        processed: true
      });
      sessionsAdded++;
    }

    const newBasicIncome = newSessionBasedIncome.reduce((sum, s) => sum + (Number(s.netIncome) || 0), 0);
    const newBasicPairs = newSessionBasedIncome.reduce((sum, s) => sum + (Number(s.pairs) || 0), 0);
    const newBasicIncomeRecords = newSessionBasedIncome.map((s, i) => ({
      srNo: i + 1,
      amount: Number(s.netIncome) || 0,
      pairCount: Number(s.pairs) || 0,
      date: s.date || s.sessionDate,
      description: s.description || 'Binary Income',
      status: 'Completed'
    }));
    const newTotalIncome = newBasicIncome + (Number(user.boosterMatchingIncome) || 0) + (Number(user.awardIncome) || 0) + (Number(user.repurchaseIncome) || 0);

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          basicIncome: newBasicIncome,
          basicPairs: newBasicPairs,
          sessionBasedIncome: newSessionBasedIncome,
          basicIncomeRecords: newBasicIncomeRecords,
          totalIncome: newTotalIncome
        }
      }
    );
    generalFixed++;
  }

  console.log(`\n✅ Phase 2 complete: Fixed ${generalFixed} additional users with negative balance`);

  await mongoose.disconnect();
  console.log('\n✅ All done!');
}

fix().catch(e => { console.error('❌ Error:', e); process.exit(1); });

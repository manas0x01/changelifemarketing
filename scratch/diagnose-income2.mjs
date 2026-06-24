import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=').map(p => p.trim())).map(([k, ...v]) => [k, v.join('=')]));

const MONGODB_URI = envVars['MONGODB_URI'];

async function diagnose() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  for (const userId of ['CLM949879', 'CLM507060']) {
    const user = await users.findOne({ $or: [{ username: userId }, { userId: userId }] });
    if (!user) { console.log(`❌ ${userId} not found`); continue; }

    console.log(`\n${'='.repeat(60)}\nUSER: ${userId} (${user.fullName})\n${'='.repeat(60)}`);
    
    // All raw fields
    console.log('\n[RAW FIELDS]');
    console.log('isBooster:', user.isBooster);
    console.log('basicPairs:', user.basicPairs);
    console.log('basicIncome:', user.basicIncome);
    console.log('boosterMatchingIncome:', user.boosterMatchingIncome);
    console.log('awardIncome:', user.awardIncome);
    console.log('repurchaseIncome:', user.repurchaseIncome);
    console.log('totalIncome:', user.totalIncome);
    console.log('totalTeam:', JSON.stringify(user.totalTeam));
    console.log('basicIncomeRecords (count):', (user.basicIncomeRecords || []).length);
    console.log('boosterMatchingRecords (count):', (user.boosterMatchingRecords || []).length);
    console.log('sessionBasedIncome (count):', (user.sessionBasedIncome || []).length);

    console.log('\n[WITHDRAW REQUESTS]');
    (user.withdrawRequests || []).forEach((w, i) => {
      console.log(`  #${i+1}: amount=₹${w.amount}, status=${w.status}, date=${w.requestDate}`);
    });

    // Compute correct income from withdrawals (minimum floor)
    const totalWithdrawn = (user.withdrawRequests || [])
      .filter(w => w.status === 'Approved' || w.status === 'Pending')
      .reduce((sum, w) => sum + (w.amount || 0), 0);
    
    console.log(`\n[ANALYSIS]`);
    console.log(`  Total withdrawn (Approved/Pending): ₹${totalWithdrawn}`);
    console.log(`  Current stored totalIncome: ₹${user.totalIncome || 0}`);
    console.log(`  NEEDED minimum income: ₹${totalWithdrawn} (to avoid negative balance)`);
    
    // Check tree for actual earned pairs
    const downlineResult = await users.aggregate([
      { $match: { $or: [{ username: userId }, { userId: userId }] } },
      {
        $graphLookup: {
          from: 'users',
          startWith: '$username',
          connectFromField: 'username',
          connectToField: 'placementId',
          as: 'descendants',
          depthField: 'depth'
        }
      }
    ]).toArray();
    
    if (downlineResult.length > 0) {
      const descendants = downlineResult[0].descendants || [];
      const leftDesc = descendants.filter(d => {
        // find which side by tracing up
        return true; // simplified
      });
      console.log(`  Total descendants in tree: ${descendants.length}`);
      
      // Count left/right
      const children = await users.find({ placementId: userId }).toArray();
      console.log(`  Direct children placed under ${userId}:`);
      children.forEach(c => {
        console.log(`    - ${c.username} (${c.placementPosition}) joined: ${c.joiningDate}`);
      });
    }
    
    // Check the basicIncomeRecords for historical data
    if (user.basicIncomeRecords && user.basicIncomeRecords.length > 0) {
      console.log('\n[BASIC INCOME RECORDS (historical)]');
      user.basicIncomeRecords.forEach(r => {
        console.log(`  #${r.srNo}: amount=₹${r.amount}, pairs=${r.pairCount}, date=${r.date}, status=${r.status}`);
      });
    }
  }

  await mongoose.disconnect();
  console.log('\n✅ Done.');
}

diagnose().catch(e => { console.error(e); process.exit(1); });

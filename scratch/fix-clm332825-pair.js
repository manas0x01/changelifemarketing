/**
 * Fix CLM332825's sessionTeam to restore the right-side count that was
 * lost due to the premature flash-out bug.
 *
 * What happened:
 *   15:53 IST - CLM118284 registered on RIGHT side → sessionTeam.right = 1
 *   16:18 IST - A background calculateBasicIncome call flushed sessionTeam → {0,0}
 *   17:06 IST - CLM692566 registered on LEFT side  → sessionTeam = {left:1, right:0}
 *
 * The right count was lost. Both users are in the same EVENING session on the same day,
 * so a pair should have formed. This script restores the right count and triggers
 * income recalculation.
 */

const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function fix() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const users = db.collection('users');

  const toIST = (d) => {
    if (!d) return 'N/A';
    const ist = new Date(new Date(d).getTime() + 5.5 * 60 * 60 * 1000);
    return ist.toISOString().replace('T', ' ').substring(0, 19) + ' IST';
  };

  // 1. Read current state
  const root = await users.findOne({ username: 'CLM332825' });
  console.log('=== BEFORE FIX ===');
  console.log('sessionTeam:', JSON.stringify(root.sessionTeam));
  console.log('lastSessionDate:', toIST(root.lastSessionDate));
  console.log('lastSessionType:', root.lastSessionType);
  console.log('basicIncome:', root.basicIncome);
  console.log('basicPairs:', root.basicPairs);
  console.log('sessionBasedIncome count:', (root.sessionBasedIncome || []).length);
  (root.sessionBasedIncome || []).forEach((s, i) => {
    console.log(`  #${i + 1}: date=${toIST(s.date)} type=${s.sessionType} pairs=${s.pairs} income=Rs${s.netIncome}`);
  });

  // 2. Verify that CLM118284 (right) and CLM692566 (left) are both in today's evening session
  const leftUser = await users.findOne({ username: 'CLM692566' });
  const rightUser = await users.findOne({ username: 'CLM118284' });
  
  const leftCreated = new Date(leftUser.createdAt);
  const rightCreated = new Date(rightUser.createdAt);
  
  const leftIST = new Date(leftCreated.getTime() + 5.5 * 60 * 60 * 1000);
  const rightIST = new Date(rightCreated.getTime() + 5.5 * 60 * 60 * 1000);
  
  const leftSession = leftIST.getUTCHours() < 12 ? 'morning' : 'evening';
  const rightSession = rightIST.getUTCHours() < 12 ? 'morning' : 'evening';
  const leftDay = leftCreated.toDateString();
  const rightDay = rightCreated.toDateString();
  
  console.log('\n=== VERIFICATION ===');
  console.log(`LEFT  CLM692566: created=${toIST(leftUser.createdAt)} session=${leftSession} day=${leftDay}`);
  console.log(`RIGHT CLM118284: created=${toIST(rightUser.createdAt)} session=${rightSession} day=${rightDay}`);
  
  if (leftDay !== rightDay || leftSession !== rightSession) {
    console.error('❌ Users are NOT in the same session! Cannot fix.');
    await mongoose.disconnect();
    return;
  }
  
  console.log('✅ Both users are in the same session (evening, same day)');

  // 3. Fix sessionTeam: restore right count to 1
  // The right-side user (CLM118284) did propagate up, but the count was lost due to flush bug
  const currentLeft = root.sessionTeam?.left || 0;
  const fixedSessionTeam = { left: currentLeft, right: 1 };
  
  console.log(`\n=== APPLYING FIX ===`);
  console.log(`sessionTeam: ${JSON.stringify(root.sessionTeam)} → ${JSON.stringify(fixedSessionTeam)}`);

  // 4. Now we need to add the 3rd session income record
  // Session #3 is a CUT session (sessions 3, 6, 9, 12 are cuts for non-booster users)
  const sessionBasedIncome = root.sessionBasedIncome || [];
  const sessionIndex = sessionBasedIncome.length + 1; // This will be session #3
  const isCut = [3, 6, 9, 12].includes(sessionIndex) && !root.isBooster;
  
  console.log(`Session index: #${sessionIndex}, isCut: ${isCut}, isBooster: ${root.isBooster}`);
  
  const newSessionRecord = {
    date: new Date(), // today
    sessionType: 'evening',
    pairs: 1,
    netIncome: isCut ? 0 : 1000,
    description: isCut ? `Basic Session #${sessionIndex} Cut (evening)` : `Basic Income (evening)`,
    processed: true,
  };
  
  sessionBasedIncome.push(newSessionRecord);
  
  // Recalculate totals from the full history
  const newBasicIncome = sessionBasedIncome.reduce((sum, r) => sum + (Number(r.netIncome) || 0), 0);
  const newBasicPairs = sessionBasedIncome.reduce((sum, r) => sum + (Number(r.pairs) || 0), 0);
  
  // Rebuild basicIncomeRecords
  const newBasicIncomeRecords = sessionBasedIncome.map((s, i) => {
    const isCutRecord = Number(s.netIncome) === 0 && Number(s.pairs) > 0;
    return {
      srNo: i + 1,
      amount: s.netIncome || 0,
      pairCount: s.pairs || 0,
      date: s.date || s.sessionDate,
      description: s.description || (isCutRecord ? `Basic Session #${i + 1} Cut` : `Binary Income`),
      status: isCutRecord ? 'Hold' : 'Completed',
    };
  });
  
  const newTotalIncome = newBasicIncome + (root.boosterMatchingIncome || 0) + (root.awardIncome || 0) + (root.repurchaseIncome || 0);
  
  console.log(`\nNew session record: ${JSON.stringify(newSessionRecord)}`);
  console.log(`basicIncome: Rs${root.basicIncome} → Rs${newBasicIncome}`);
  console.log(`basicPairs: ${root.basicPairs} → ${newBasicPairs}`);
  console.log(`totalIncome: Rs${root.totalIncome || 0} → Rs${newTotalIncome}`);
  
  // 5. Apply the update
  await users.updateOne(
    { username: 'CLM332825' },
    {
      $set: {
        sessionTeam: fixedSessionTeam,
        sessionBasedIncome: sessionBasedIncome,
        basicIncome: newBasicIncome,
        basicPairs: newBasicPairs,
        basicIncomeRecords: newBasicIncomeRecords,
        totalIncome: newTotalIncome,
      }
    }
  );
  
  console.log('\n✅ Update applied to database');

  // 6. Verify
  const updated = await users.findOne({ username: 'CLM332825' });
  console.log('\n=== AFTER FIX ===');
  console.log('sessionTeam:', JSON.stringify(updated.sessionTeam));
  console.log('basicIncome:', updated.basicIncome);
  console.log('basicPairs:', updated.basicPairs);
  console.log('totalIncome:', updated.totalIncome);
  console.log('sessionBasedIncome:');
  (updated.sessionBasedIncome || []).forEach((s, i) => {
    console.log(`  #${i + 1}: date=${toIST(s.date)} type=${s.sessionType} pairs=${s.pairs} income=Rs${s.netIncome} desc=${s.description}`);
  });
  console.log('basicIncomeRecords:');
  (updated.basicIncomeRecords || []).forEach((r, i) => {
    console.log(`  #${r.srNo}: amount=Rs${r.amount} pairs=${r.pairCount} status=${r.status} desc=${r.description}`);
  });

  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

fix().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function verifyIncome() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('changelifemarketing');
    const users = db.collection('users');

    const clm = await users.findOne({ username: 'CLM114511' });

    console.log('══════════════════════════════════════════');
    console.log('   INCOME VERIFICATION FOR CLM114511');
    console.log('══════════════════════════════════════════');

    const sessions = clm.sessionBasedIncome || [];
    
    console.log(`\n📋 SESSIONS RECORDED: ${sessions.length}`);
    let totalExpected = 0;
    sessions.forEach((s, i) => {
      const isCut = (Number(s.netIncome) === 0) && (Number(s.pairs) > 0);
      const cutLevels = [3, 6, 9, 12];
      const sessionIdx = i + 1;
      const shouldBeCut = !clm.isBooster && cutLevels.includes(sessionIdx);
      const expectedIncome = shouldBeCut ? 0 : (s.pairs > 0 ? 1000 : 0);
      totalExpected += expectedIncome;
      console.log(`  Session #${sessionIdx}: Date=${new Date(s.date).toLocaleDateString('en-IN')} | Type=${s.sessionType} | Pairs=${s.pairs} | Stored Income=Rs.${s.netIncome} | Expected=Rs.${expectedIncome} | Match=${Number(s.netIncome) === expectedIncome ? '✅' : '❌'}`);
    });

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  STORED basicIncome   : Rs.${clm.basicIncome || 0}`);
    console.log(`  EXPECTED basicIncome : Rs.${totalExpected}`);
    console.log(`  MATCH?               : ${(clm.basicIncome || 0) === totalExpected ? '✅ CORRECT' : '❌ MISMATCH'}`);

    console.log(`\n━━━━ CUT SESSION RULES ━━━━`);
    console.log(`  User is Booster? : ${clm.isBooster}`);
    console.log(`  Cut sessions (for non-boosters): #3, #6, #9, #12`);
    console.log(`  Session #1 → PAID (Rs.1000) — correct`);
    console.log(`  Session #2 → PAID (Rs.1000) if generated (not a cut)`);
    console.log(`  Session #3 → CUT (Rs.0) — income withheld`);

    console.log(`\n━━━━ TEAM OVERVIEW ━━━━`);
    console.log(`  totalTeam L : ${clm.totalTeam?.left} | R : ${clm.totalTeam?.right}`);
    console.log(`  Min pairs ever (total): ${Math.min(clm.totalTeam?.left || 0, clm.totalTeam?.right || 0)}`);
    console.log(`  ⚠️  Note: totalTeam counts ALL-TIME members. Income is per-SESSION only.`);
    console.log(`  ⚠️  Having L=3, R=2 does NOT mean 2 income events. Each session is counted separately.`);

    console.log(`\n════════════════════════════════════════`);
    console.log(`VERDICT: Rs.${clm.basicIncome || 0} shown is ${(clm.basicIncome || 0) === totalExpected ? '✅ CORRECT' : '❌ INCORRECT'}`);
    console.log(`════════════════════════════════════════`);

  } catch(err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

verifyIncome();

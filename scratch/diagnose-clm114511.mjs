import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';
const TARGET_USER = 'CLM114511';

async function diagnose() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('changelifemarketing');
    const users = db.collection('users');

    const user = await users.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${TARGET_USER}$`, 'i') } },
        { userId:   { $regex: new RegExp(`^${TARGET_USER}$`, 'i') } },
      ]
    });

    if (!user) {
      console.error(`❌ User "${TARGET_USER}" NOT FOUND in database`);
      return;
    }

    console.log('════════════════════════════════════════════════');
    console.log(`👤 USER FOUND: ${user.username || user.userId}`);
    console.log('════════════════════════════════════════════════');
    console.log(`  Full Name        : ${user.fullName || 'N/A'}`);
    console.log(`  Username         : ${user.username}`);
    console.log(`  UserId           : ${user.userId}`);
    console.log(`  Role             : ${user.role}`);
    console.log(`  Member Type      : ${user.memberType}`);
    console.log(`  Is Booster       : ${user.isBooster}`);
    console.log(`  Sponsor ID       : ${user.sponsorId}`);
    console.log(`  Placement ID     : ${user.placementId}`);
    console.log(`  Placement Pos    : ${user.placementPosition}`);

    console.log('\n━━━━━━━ JOINING DATE ━━━━━━━');
    console.log(`  joiningDate field  : ${user.joiningDate || 'NOT SET'}`);
    console.log(`  createdAt          : ${user.createdAt}`);
    console.log(`  lastSessionDate    : ${user.lastSessionDate || 'NOT SET'}`);
    console.log(`  lastSessionType    : ${user.lastSessionType || 'NOT SET'}`);

    console.log('\n━━━━━━━ SESSION TEAM (Current Session) ━━━━━━━');
    console.log(`  sessionTeam.left   : ${user.sessionTeam?.left ?? 'NOT SET'}`);
    console.log(`  sessionTeam.right  : ${user.sessionTeam?.right ?? 'NOT SET'}`);
    console.log(`  totalTeam.left     : ${user.totalTeam?.left ?? 'NOT SET'}`);
    console.log(`  totalTeam.right    : ${user.totalTeam?.right ?? 'NOT SET'}`);

    console.log('\n━━━━━━━ SESSION BASED INCOME ━━━━━━━');
    const sessions = user.sessionBasedIncome || [];
    if (sessions.length === 0) {
      console.log('  ⚠️  NO sessionBasedIncome records found!');
    } else {
      sessions.forEach((s, i) => {
        const isCut = (Number(s.netIncome) === 0) && (Number(s.pairs) > 0);
        console.log(`  Session #${i + 1}: Date=${s.date || s.sessionDate} | Type=${s.sessionType} | Pairs=${s.pairs} | Income=Rs.${s.netIncome} | ${isCut ? 'CUT' : 'PAID'} | Desc=${s.description}`);
      });
    }

    console.log('\n━━━━━━━ INCOME SUMMARY ━━━━━━━');
    console.log(`  basicIncome           : Rs.${user.basicIncome || 0}`);
    console.log(`  basicPairs            : ${user.basicPairs || 0}`);
    console.log(`  totalIncome           : Rs.${user.totalIncome || 0}`);
    console.log(`  boosterMatchingIncome : Rs.${user.boosterMatchingIncome || 0}`);

    console.log('\n━━━━━━━ 2ND INCOME DIAGNOSIS ━━━━━━━');
    const sessionCount = sessions.length;
    console.log(`  Total session records : ${sessionCount}`);
    if (sessionCount === 0) {
      console.log('  ❌ No income at all!');
      if (!user.joiningDate) console.log('  ⚠️  joiningDate is NOT SET → income will be blocked');
      console.log(`  sessionTeam L=${user.sessionTeam?.left} R=${user.sessionTeam?.right} → both must be >0 for income`);
    } else if (sessionCount === 1) {
      const s1 = sessions[0];
      console.log('  ✅ Session #1 exists');
      console.log('  ❌ Session #2 NOT generated yet');
      console.log(`  Diagnosis:`);
      console.log(`    After 1st session, sessionTeam was reset to 0`);
      console.log(`    For a 2nd income, new members must join on BOTH sides in the SAME session`);
      console.log(`    Current sessionTeam: L=${user.sessionTeam?.left ?? 0} R=${user.sessionTeam?.right ?? 0}`);
      const L = user.sessionTeam?.left ?? 0;
      const R = user.sessionTeam?.right ?? 0;
      if (L === 0 && R === 0) {
        console.log('    → No new members added since last session flush');
      } else if (L > 0 && R === 0) {
        console.log(`    → ${L} member(s) on LEFT but NONE on RIGHT in current session`);
      } else if (R > 0 && L === 0) {
        console.log(`    → ${R} member(s) on RIGHT but NONE on LEFT in current session`);
      } else {
        console.log(`    → Both sides have members (L=${L}, R=${R}), income should trigger on next registration`);
      }
    } else {
      console.log(`  ✅ All ${sessionCount} sessions exist - check above for details`);
    }

    console.log('\n━━━━━━━ PLACEMENT CHILDREN ━━━━━━━');
    const downline = await users.find({ placementId: user.username }).sort({ createdAt: 1 }).toArray();
    if (downline.length === 0) {
      console.log('  No direct placement children');
    } else {
      downline.forEach(m => {
        console.log(`  ${(m.placementPosition || '?').toUpperCase()} | ${m.username} | ${m.fullName} | Joined: ${m.joiningDate || m.createdAt} | LastSession: ${m.lastSessionType}`);
      });
    }

    console.log('\n━━━━━━━ SPONSORED MEMBERS ━━━━━━━');
    const sponsored = await users.find({ sponsorId: user.username }).sort({ createdAt: 1 }).toArray();
    if (sponsored.length === 0) {
      console.log('  No sponsored members');
    } else {
      sponsored.forEach(m => {
        console.log(`  ${m.username} | ${m.fullName || 'N/A'} | Joined: ${m.joiningDate || m.createdAt}`);
      });
    }

    console.log('\n════════════════════════════════════════════════');
    console.log('✅ Diagnosis complete');
    console.log('════════════════════════════════════════════════');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.close();
  }
}

diagnose();

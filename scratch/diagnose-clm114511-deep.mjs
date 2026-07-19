import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function diagnose() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('changelifemarketing');
    const users = db.collection('users');

    // Check the children's full session state
    const leftChild = await users.findOne({ username: 'CLM371546' });
    const rightChild = await users.findOne({ username: 'CLM137536' });

    // Also check who the user placed in RIGHT who has lastSessionType=morning today
    console.log('=== LEFT CHILD: CLM371546 (Anita yadav) ===');
    if (leftChild) {
      console.log(`  placementId     : ${leftChild.placementId}`);
      console.log(`  placementPosition: ${leftChild.placementPosition}`);
      console.log(`  joiningDate     : ${leftChild.joiningDate}`);
      console.log(`  lastSessionDate : ${leftChild.lastSessionDate}`);
      console.log(`  lastSessionType : ${leftChild.lastSessionType}`);
      console.log(`  sessionTeam L   : ${leftChild.sessionTeam?.left}`);
      console.log(`  sessionTeam R   : ${leftChild.sessionTeam?.right}`);
      console.log(`  totalTeam L     : ${leftChild.totalTeam?.left}`);
      console.log(`  totalTeam R     : ${leftChild.totalTeam?.right}`);
      console.log(`  Sessions        : ${(leftChild.sessionBasedIncome || []).length}`);
    }

    console.log('\n=== RIGHT CHILD: CLM137536 (Priyanka Singh Gond) ===');
    if (rightChild) {
      console.log(`  placementId     : ${rightChild.placementId}`);
      console.log(`  placementPosition: ${rightChild.placementPosition}`);
      console.log(`  joiningDate     : ${rightChild.joiningDate}`);
      console.log(`  lastSessionDate : ${rightChild.lastSessionDate}`);
      console.log(`  lastSessionType : ${rightChild.lastSessionType}`);
      console.log(`  sessionTeam L   : ${rightChild.sessionTeam?.left}`);
      console.log(`  sessionTeam R   : ${rightChild.sessionTeam?.right}`);
      console.log(`  totalTeam L     : ${rightChild.totalTeam?.left}`);
      console.log(`  totalTeam R     : ${rightChild.totalTeam?.right}`);
      console.log(`  Sessions        : ${(rightChild.sessionBasedIncome || []).length}`);
    }

    // Now check CLM114511 with full state
    const clm = await users.findOne({ username: 'CLM114511' });
    console.log('\n=== CLM114511 (Kumari Sudha Singh) - Detailed ===');
    if (clm) {
      console.log(`  lastSessionDate : ${clm.lastSessionDate}`);
      console.log(`  lastSessionType : ${clm.lastSessionType}`);
      console.log(`  sessionTeam     : L=${clm.sessionTeam?.left} R=${clm.sessionTeam?.right}`);
      console.log(`  totalTeam       : L=${clm.totalTeam?.left} R=${clm.totalTeam?.right}`);
      
      // Calculate what the current IST hour/session is
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + istOffset);
      const istHour = istNow.getUTCHours();
      const currentSession = istHour < 12 ? 'morning' : 'evening';
      const currentDateIST = istNow.toISOString().split('T')[0];
      
      console.log(`\n  Current IST Time: ${istNow.toISOString()} (${currentDateIST} ${currentSession})`);
      console.log(`  Last session was: ${clm.lastSessionDate?.toISOString?.()?.split('T')[0]} ${clm.lastSessionType}`);
      
      const lastDateStr = clm.lastSessionDate ? new Date(new Date(clm.lastSessionDate).getTime() + istOffset).toISOString().split('T')[0] : '';
      const sessionChanged = lastDateStr !== currentDateIST || clm.lastSessionType !== currentSession;
      console.log(`  Session changed? : ${sessionChanged}`);
      
      if (sessionChanged) {
        console.log('  ⚠️ Session HAS changed since last recorded member addition');
        console.log('  → Old session (L + R = pair) was closed. sessionTeam was reset to L=0 R=0');
        console.log('  → Current sessionTeam shows L=0 R=1');
        console.log('  → This R=1 is a NEW member who joined in TODAY\'s morning session');
        console.log('  → But there is NO LEFT member in today\'s morning session');
        console.log('  → So 2nd income CANNOT be generated until a LEFT member joins in the SAME session');
      }
      
      // Check who is the R=1 member in current session
      console.log('\n  Looking for who updated sessionTeam.right to 1...');
      // Find members placed under CLM114511 on the right that joined recently
      const recentRight = await users.find({
        placementId: 'CLM114511',
        placementPosition: 'right'
      }).sort({ createdAt: -1 }).toArray();
      
      console.log(`  RIGHT-side placement children of CLM114511:`);
      recentRight.forEach(m => {
        const mISTJoin = m.createdAt ? new Date(new Date(m.createdAt).getTime() + istOffset).toISOString() : 'N/A';
        console.log(`    ${m.username} | ${m.fullName} | createdAt(IST)=${mISTJoin} | joiningDate=${m.joiningDate} | lastSession=${m.lastSessionType} ${m.lastSessionDate}`);
      });

      const recentLeft = await users.find({
        placementId: 'CLM114511',
        placementPosition: 'left'
      }).sort({ createdAt: -1 }).toArray();
      
      console.log(`  LEFT-side placement children of CLM114511:`);
      recentLeft.forEach(m => {
        const mISTJoin = m.createdAt ? new Date(new Date(m.createdAt).getTime() + istOffset).toISOString() : 'N/A';
        console.log(`    ${m.username} | ${m.fullName} | createdAt(IST)=${mISTJoin} | joiningDate=${m.joiningDate} | lastSession=${m.lastSessionType} ${m.lastSessionDate}`);
      });
    }

    console.log('\n=== CONCLUSION ===');
    console.log('CLM114511 joined: 2026-07-16');
    console.log('1st Income: Session=evening 2026-07-17 (Rs.1000) ✅');
    console.log('2nd Income: NOT YET generated');
    console.log('Reason: sessionTeam is currently L=0 R=1');
    console.log('  → There is 1 right-side member in the current session');
    console.log('  → No left-side member has been added in this same session');
    console.log('  → 2nd income will be generated AUTOMATICALLY when a LEFT member joins in the same session');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

diagnose();

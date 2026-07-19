import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
function toISTStr(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  return ist.toISOString().replace('T', ' ').substring(0, 19) + ' IST';
}
function istDateISO(date) {
  if (!date) return '';
  const ist = new Date(new Date(date).getTime() + IST_OFFSET_MS);
  return ist.toISOString().split('T')[0];
}
function istHour(date) {
  return new Date(new Date(date).getTime() + IST_OFFSET_MS).getUTCHours();
}
function sessionOf(date) {
  if (!date) return 'N/A';
  return istHour(date) < 12 ? 'morning' : 'evening';
}

async function diagnose() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('changelifemarketing');
    const users = db.collection('users');

    // Target timestamps
    const t1 = new Date('2026-07-19T06:09:53.000Z'); // 01:39:53 AM IST = 06:09:53 UTC? 
    // 01:39:53 AM IST = 01:39:53 - 5:30 = 2026-07-18T20:09:53Z
    const t1_utc = new Date('2026-07-18T20:09:53.000Z'); // 01:39:53 AM IST on 19 Jul
    const t2_utc = new Date('2026-07-19T05:58:50.000Z'); // 11:28:50 AM IST on 19 Jul

    console.log('══════════════════════════════════════════════════');
    console.log('  TIMESTAMP-BASED INCOME GLITCH DIAGNOSIS');
    console.log('══════════════════════════════════════════════════');
    console.log(`\nTarget Time 1: 19/07/2026 01:39:53 AM IST`);
    console.log(`  → UTC: ${t1_utc.toISOString()}`);
    console.log(`  → Date: 2026-07-19 | Session: morning (01:39 AM < 12:00 PM)`);
    console.log(`\nTarget Time 2: 19/07/2026 11:28:50 AM IST`);
    console.log(`  → UTC: ${t2_utc.toISOString()}`);
    console.log(`  → Date: 2026-07-19 | Session: morning (11:28 AM < 12:00 PM)`);

    // Find users created around these timestamps (±2 minutes)
    const window = 2 * 60 * 1000; // 2 minutes

    console.log('\n━━━━ USERS CREATED NEAR 01:39:53 AM IST (±2 min) ━━━━');
    const near1 = await users.find({
      createdAt: { $gte: new Date(t1_utc.getTime() - window), $lte: new Date(t1_utc.getTime() + window) }
    }).toArray();
    if (near1.length === 0) {
      console.log('  ⚠️ No users created at that exact time (±2 min)');
      // Try wider window
      const wide = 10 * 60 * 1000;
      const near1wide = await users.find({
        createdAt: { $gte: new Date(t1_utc.getTime() - wide), $lte: new Date(t1_utc.getTime() + wide) }
      }).toArray();
      console.log(`  Wider search (±10 min): ${near1wide.length} users`);
      near1wide.forEach(u => {
        console.log(`    ${u.username} | ${u.fullName} | createdAt(IST)=${toISTStr(u.createdAt)} | Sponsor=${u.sponsorId} | PlacedUnder=${u.placementId} ${u.placementPosition} | joiningDate=${u.joiningDate}`);
      });
    } else {
      near1.forEach(u => {
        console.log(`  ✅ ${u.username} | ${u.fullName} | createdAt(IST)=${toISTStr(u.createdAt)} | Sponsor=${u.sponsorId} | PlacedUnder=${u.placementId} ${u.placementPosition}`);
      });
    }

    console.log('\n━━━━ USERS CREATED NEAR 11:28:50 AM IST (±2 min) ━━━━');
    const near2 = await users.find({
      createdAt: { $gte: new Date(t2_utc.getTime() - window), $lte: new Date(t2_utc.getTime() + window) }
    }).toArray();
    if (near2.length === 0) {
      console.log('  ⚠️ No users created at that exact time (±2 min)');
      const wide = 10 * 60 * 1000;
      const near2wide = await users.find({
        createdAt: { $gte: new Date(t2_utc.getTime() - wide), $lte: new Date(t2_utc.getTime() + wide) }
      }).toArray();
      console.log(`  Wider search (±10 min): ${near2wide.length} users`);
      near2wide.forEach(u => {
        console.log(`    ${u.username} | ${u.fullName} | createdAt(IST)=${toISTStr(u.createdAt)} | Sponsor=${u.sponsorId} | PlacedUnder=${u.placementId} ${u.placementPosition} | joiningDate=${u.joiningDate}`);
      });
    } else {
      near2.forEach(u => {
        console.log(`  ✅ ${u.username} | ${u.fullName} | createdAt(IST)=${toISTStr(u.createdAt)} | Sponsor=${u.sponsorId} | PlacedUnder=${u.placementId} ${u.placementPosition}`);
      });
    }

    // Also find all users who joined on 19/07/2026 and sort by time
    console.log('\n━━━━ ALL USERS JOINED ON 19/07/2026 (by time) ━━━━');
    const dayStart = new Date('2026-07-18T18:30:00.000Z'); // 00:00 IST = 18:30 UTC prev day
    const dayEnd   = new Date('2026-07-19T18:29:59.000Z'); // 23:59 IST = next 18:29 UTC
    const day19 = await users.find({
      createdAt: { $gte: dayStart, $lte: dayEnd }
    }).sort({ createdAt: 1 }).toArray();

    console.log(`  Total users joined on 19 Jul 2026: ${day19.length}`);
    day19.forEach(u => {
      const session = sessionOf(u.createdAt);
      const istDate = istDateISO(u.createdAt);
      console.log(`  ${toISTStr(u.createdAt)} | ${session.toUpperCase()} | ${u.username} | ${u.fullName || 'N/A'} | PlacedUnder=${u.placementId} ${u.placementPosition}`);
    });

    // Check the parent of each 19-Jul user and their sessionTeam state
    console.log('\n━━━━ PARENT INCOME CHECK FOR EACH 19-JUL MEMBER ━━━━');
    for (const u of day19) {
      if (!u.placementId) continue;
      const parent = await users.findOne({
        $or: [{ username: u.placementId }, { userId: u.placementId }]
      });
      if (!parent) continue;

      const sessions = parent.sessionBasedIncome || [];
      // Find sessions on 19 Jul
      const sessions19 = sessions.filter(s => {
        const d = s.date || s.sessionDate;
        return d && istDateISO(new Date(d)) === '2026-07-19';
      });

      const lstSessionIST = parent.lastSessionDate ? toISTStr(parent.lastSessionDate) : 'N/A';
      console.log(`\n  Member: ${u.username} (${u.fullName}) → placed ${u.placementPosition?.toUpperCase()} under: ${parent.username}`);
      console.log(`    Parent sessionTeam : L=${parent.sessionTeam?.left ?? '?'} R=${parent.sessionTeam?.right ?? '?'}`);
      console.log(`    Parent lastSession : ${lstSessionIST} (${parent.lastSessionType})`);
      console.log(`    Parent basicIncome : Rs.${parent.basicIncome || 0} | Sessions: ${sessions.length}`);
      if (sessions19.length > 0) {
        sessions19.forEach(s => {
          console.log(`    19-Jul Session: ${s.sessionType} | Pairs=${s.pairs} | Income=Rs.${s.netIncome} | Desc=${s.description}`);
        });
      } else {
        console.log(`    ❌ No income session recorded for 19 Jul under parent ${parent.username}`);
      }
    }

    // Specifically check CLM114511 and CLM687510
    console.log('\n━━━━ SPECIFIC CHECK: CLM114511 & CLM687510 ━━━━');
    for (const uid of ['CLM114511', 'CLM687510']) {
      const u = await users.findOne({ username: uid });
      if (!u) { console.log(`${uid}: NOT FOUND`); continue; }
      const sessions = u.sessionBasedIncome || [];
      console.log(`\n  ${uid} (${u.fullName}):`);
      console.log(`    basicIncome : Rs.${u.basicIncome || 0} | basicPairs=${u.basicPairs || 0}`);
      console.log(`    sessionTeam : L=${u.sessionTeam?.left ?? '?'} R=${u.sessionTeam?.right ?? '?'}`);
      console.log(`    totalTeam   : L=${u.totalTeam?.left ?? '?'} R=${u.totalTeam?.right ?? '?'}`);
      console.log(`    lastSession : ${toISTStr(u.lastSessionDate)} (${u.lastSessionType})`);
      console.log(`    Sessions (${sessions.length}):`);
      sessions.forEach((s, i) => {
        const isCut = Number(s.netIncome) === 0 && Number(s.pairs) > 0;
        console.log(`      #${i+1}: ${toISTStr(s.date || s.sessionDate)} | ${s.sessionType} | Pairs=${s.pairs} | Rs.${s.netIncome} | ${isCut ? 'CUT ✂️' : 'PAID ✅'}`);
      });
    }

    console.log('\n══════════════════════════════════════════════════');
    console.log('Diagnosis complete');

  } catch(err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

diagnose();

import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
function toIST(date) {
  return new Date(date.getTime() + IST_OFFSET_MS);
}
function istDateISO(date) {
  const ist = toIST(date);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function simulate() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('changelifemarketing');
    const user = await db.collection('users').findOne({ username: 'CLM114511' });

    console.log('=== User State for Simulation ===');
    console.log(`username: ${user.username}`);
    console.log(`joiningDate: ${user.joiningDate}`);
    console.log(`lastSessionDate: ${user.lastSessionDate}`);
    console.log(`lastSessionType: ${user.lastSessionType}`);
    console.log(`sessionTeam: L=${user.sessionTeam?.left} R=${user.sessionTeam?.right}`);

    const sessionLeft = 1;
    const sessionRight = 1;
    const pairsInSession = Math.min(sessionLeft, sessionRight);
    console.log(`pairsInSession: ${pairsInSession}`);

    const sessionDate = new Date('2026-07-19T06:00:00Z'); // 11:30 AM IST
    const todayStr = istDateISO(sessionDate);
    console.log('todayStr:', todayStr);

    const sessions = user.sessionBasedIncome || [];
    let recordIndex = sessions.findIndex((s) => {
      const recDate = new Date(s.date || s.sessionDate);
      return istDateISO(recDate) === todayStr && s.sessionType === 'morning';
    });

    console.log('recordIndex:', recordIndex);
    const isExisting = recordIndex !== -1;
    console.log('isExisting:', isExisting);

    const sessionIndex = isExisting ? (recordIndex + 1) : (sessions.length + 1);
    console.log('sessionIndex:', sessionIndex);

    const cutLevels = [3, 6, 9, 12];
    const isCutSession = !user.isBooster && cutLevels.includes(sessionIndex);
    console.log('isCutSession:', isCutSession);

  } catch(e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
simulate();

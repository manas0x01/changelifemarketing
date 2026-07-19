import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function traceSequence() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('changelifemarketing');
    const users = db.collection('users');

    const clm = await users.findOne({ username: 'CLM114511' });
    console.log('=== CLM114511 Current State ===');
    console.log(`sessionTeam: L=${clm.sessionTeam?.left} R=${clm.sessionTeam?.right}`);
    console.log(`totalTeam  : L=${clm.totalTeam?.left} R=${clm.totalTeam?.right}`);
    console.log(`lastSession: ${clm.lastSessionDate} (${clm.lastSessionType})`);
    
    // Find all descendants of CLM114511 recursively
    const allUsers = await users.find({}).toArray();
    
    // Build tree map
    const byUsername = {};
    allUsers.forEach(u => {
      byUsername[u.username] = u;
    });

    function getDescendants(username) {
      const descendants = [];
      const queue = [username];
      while (queue.length > 0) {
        const curr = queue.shift();
        const children = allUsers.filter(u => u.placementId === curr);
        children.forEach(c => {
          descendants.push(c);
          queue.push(c.username);
        });
      }
      return descendants;
    }

    const descendants = getDescendants('CLM114511');
    console.log(`\n=== Descendants of CLM114511 (${descendants.length}) ===`);
    descendants.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    descendants.forEach(d => {
      // Find path position from CLM114511
      let path = [];
      let curr = d;
      while (curr && curr.username !== 'CLM114511') {
        path.unshift(`${curr.placementPosition === 'left' ? 'L' : 'R'}->${curr.username}`);
        curr = byUsername[curr.placementId];
      }
      console.log(`- User: ${d.username} (${d.fullName})`);
      console.log(`  Path        : CLM114511 -> ${path.join(' -> ')}`);
      console.log(`  Created At  : ${d.createdAt} (${new Date(d.createdAt).toLocaleString('en-IN')})`);
      console.log(`  joiningDate : ${d.joiningDate}`);
      console.log(`  lastSession : ${d.lastSessionDate} (${d.lastSessionType})`);
      console.log(`  sessionTeam : L=${d.sessionTeam?.left} R=${d.sessionTeam?.right}`);
      console.log(`  totalTeam   : L=${d.totalTeam?.left} R=${d.totalTeam?.right}`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

traceSequence();

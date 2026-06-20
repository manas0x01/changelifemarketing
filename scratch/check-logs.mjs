import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function checkLogs() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  
  // Let's see what collections exist in the DB
  const collections = await db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));

  // Check activity logs
  const activitylogs = db.collection('activitylogs');
  if (activitylogs) {
    const logs = await activitylogs.find({ 
      $or: [
        { username: 'CLM332825' },
        { details: /CLM332825/ }
      ]
    }).sort({ timestamp: -1 }).limit(50).toArray();

    console.log('\n===== ACTIVITY LOGS FOR CLM332825 =====');
    logs.forEach(l => {
      console.log(`[${l.timestamp?.toISOString() || l.createdAt?.toISOString()}] ${l.action} | ${l.details || JSON.stringify(l)}`);
    });
  }

  await mongoose.disconnect();
}

checkLogs().catch(e => { console.error(e); process.exit(1); });

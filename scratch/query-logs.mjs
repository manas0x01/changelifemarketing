import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function queryLogs() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('changelifemarketing');
    const logs = await db.collection('activitylogs')
      .find({
        $or: [
          { username: 'CLM114511' },
          { message: /CLM114511/i },
          { action: /income/i },
          { description: /income/i }
        ]
      })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    console.log(`Found ${logs.length} logs:`);
    logs.forEach(l => {
      console.log(`[${l.timestamp ? new Date(l.timestamp).toLocaleString('en-IN') : 'N/A'}] User=${l.username || l.userId} | Action=${l.action} | Msg=${l.message || l.description}`);
    });
  } catch(e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
queryLogs();

import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function inspectUser() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('changelifemarketing');
    const u = await db.collection('users').findOne({ username: 'CLM114511' });
    console.log(JSON.stringify(u, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
inspectUser();

import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function listCols() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('changelifemarketing');
    const cols = await db.listCollections().toArray();
    console.log('Collections:', cols.map(c => c.name));
  } catch(e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
listCols();

import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function run() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('changelifemarketing');
    const totalUsers = await db.collection('users').countDocuments();
    console.log('Total users:', totalUsers);

    // Users with sessionBasedIncome or boosterMatchingRecords
    const incomeUsers = await db.collection('users').find({
      $or: [
        { 'sessionBasedIncome.0': { $exists: true } },
        { 'boosterMatchingRecords.0': { $exists: true } },
        { 'withdrawRequests.0': { $exists: true } }
      ]
    }).limit(3).toArray();

    console.log('Found income users count:', incomeUsers.length);
    for (const u of incomeUsers) {
      console.log('User:', u.username, u.userId, u.fullName, 'PAN:', u.panNo, 'City/State:', u.city, u.state);
      console.log('  sessionBasedIncome count:', u.sessionBasedIncome?.length);
      if (u.sessionBasedIncome?.length) {
        console.log('  sample session:', u.sessionBasedIncome[0]);
      }
      console.log('  boosterMatchingRecords count:', u.boosterMatchingRecords?.length);
      if (u.boosterMatchingRecords?.length) {
        console.log('  sample booster:', u.boosterMatchingRecords[0]);
      }
    }

    const withdraws = await db.collection('withdrawrequests').find().limit(3).toArray();
    console.log('Sample withdraws count:', withdraws.length);
    if (withdraws.length) {
      console.log('Sample withdraw:', withdraws[0]);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();

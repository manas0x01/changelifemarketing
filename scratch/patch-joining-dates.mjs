import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function patchJoiningDates() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('changelifemarketing');
    const users = db.collection('users');

    // Find all users whose createdAt IST date does NOT match their joiningDate
    // (caused by the UTC vs IST bug)
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

    const allUsers = await users.find({
      joiningDate: { $exists: true, $ne: '' }
    }).toArray();

    let fixCount = 0;
    const fixes = [];

    for (const u of allUsers) {
      if (!u.createdAt) continue;
      const istDate = new Date(new Date(u.createdAt).getTime() + IST_OFFSET_MS).toISOString().split('T')[0];
      if (u.joiningDate !== istDate) {
        fixes.push({
          username: u.username,
          oldJoiningDate: u.joiningDate,
          newJoiningDate: istDate,
          createdAt: u.createdAt
        });
      }
    }

    console.log(`Found ${fixes.length} users with wrong joiningDate:`);
    for (const fix of fixes) {
      console.log(`  ${fix.username}: ${fix.oldJoiningDate} → ${fix.newJoiningDate}  (createdAt: ${fix.createdAt})`);
    }

    if (fixes.length === 0) {
      console.log('✅ No fixes needed');
      return;
    }

    // Apply fixes
    for (const fix of fixes) {
      await users.updateOne(
        { username: fix.username },
        { $set: { joiningDate: fix.newJoiningDate } }
      );
      fixCount++;
    }

    console.log(`\n✅ Fixed ${fixCount} users' joiningDate to correct IST date`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

patchJoiningDates();

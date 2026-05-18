const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Fetch all users missing plain text passwords
    const users = await usersCollection.find({
      $or: [
        { plainPassword: { $exists: false } },
        { plainPassword: null },
        { plainPassword: '' },
        { plainTransactionPassword: { $exists: false } },
        { plainTransactionPassword: null },
        { plainTransactionPassword: '' },
      ]
    }, {
      projection: { username: 1, userId: 1, plainPassword: 1, plainTransactionPassword: 1 }
    }).toArray();

    console.log(`Found ${users.length} users needing plain-text password migration.`);

    const salt = await bcrypt.genSalt(12);
    let updated = 0;

    for (const u of users) {
      const updates = {};

      // Assign a new plain-text login password if missing
      if (!u.plainPassword) {
        // Use userId as base so it's predictable for admin to hand to user
        const newPassword = `CLM@${u.userId || u.username}`;
        updates.plainPassword = newPassword;
        updates.password = await bcrypt.hash(newPassword, salt);
        console.log(`  [${u.username}] New password set: '${newPassword}'`);
      }

      // Assign a new plain-text transaction password if missing
      if (!u.plainTransactionPassword) {
        // Simple numeric 6-digit derived from username, predictable
        const numericSeed = String(u.username).replace(/\D/g, '').slice(0, 6).padStart(6, '1');
        updates.plainTransactionPassword = numericSeed;
        updates.transactionPassword = await bcrypt.hash(numericSeed, salt);
        console.log(`  [${u.username}] New transaction password set: '${numericSeed}'`);
      }

      if (Object.keys(updates).length > 0) {
        await usersCollection.updateOne({ _id: u._id }, { $set: updates });
        updated++;
      }
    }

    console.log(`\n✅ Migration complete! Updated ${updated} users.`);
    console.log('\n--- Summary ---');
    console.log('Login Password format:       CLM@<UserID>  (e.g. CLM@CLM150835)');
    console.log('Transaction Password format: First 6 digits of the numeric part of User ID');
    console.log('Admin should inform affected users to change their passwords after first login.');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected.');
  }
}

run();

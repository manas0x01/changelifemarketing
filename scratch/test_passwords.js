const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

const COMMON_PASSWORDS = [
  '12345678',
  '123456789',
  '123456',
  '12345',
  '1234',
  '0000',
  '1111',
  'password',
  'changelifemarketing',
  'ajaykumar',
  '12345678@',
];

const COMMON_TXN_PASSWORDS = [
  '1234',
  '12345',
  '123456',
  '12345678',
  '0000',
  '1111',
];

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const users = await usersCollection.find({}, {
      projection: {
        username: 1,
        userId: 1,
        password: 1,
        transactionPassword: 1,
        plainPassword: 1,
        plainTransactionPassword: 1
      }
    }).toArray();

    console.log(`Auditing ${users.length} users...`);

    let matchedPasswordCount = 0;
    let matchedTxnCount = 0;

    for (const u of users) {
      let foundPass = null;
      let foundTxn = null;

      if (u.plainPassword) {
        foundPass = u.plainPassword;
      } else if (u.password) {
        for (const p of COMMON_PASSWORDS) {
          const match = await bcrypt.compare(p, u.password);
          if (match) {
            foundPass = p;
            break;
          }
        }
      }

      if (u.plainTransactionPassword) {
        foundTxn = u.plainTransactionPassword;
      } else if (u.transactionPassword) {
        for (const t of COMMON_TXN_PASSWORDS) {
          const match = await bcrypt.compare(t, u.transactionPassword);
          if (match) {
            foundTxn = t;
            break;
          }
        }
      }

      console.log(`User: ${u.username}`);
      console.log(`  Password:            ${foundPass ? `SUCCESS ('${foundPass}')` : 'FAILED TO DECRYPT'}`);
      console.log(`  Transaction Password: ${foundTxn ? `SUCCESS ('${foundTxn}')` : 'FAILED TO DECRYPT'}`);

      // Auto update if we successfully matched a password that was previously missing
      const updates = {};
      if (foundPass && !u.plainPassword) {
        updates.plainPassword = foundPass;
        matchedPasswordCount++;
      }
      if (foundTxn && !u.plainTransactionPassword) {
        updates.plainTransactionPassword = foundTxn;
        matchedTxnCount++;
      }

      if (Object.keys(updates).length > 0) {
        await usersCollection.updateOne({ _id: u._id }, { $set: updates });
        console.log(`  💾 Updated DB with matched plain text fields!`);
      }
    }

    console.log(`\nAudit complete! Successfully resolved plain text for:`);
    console.log(`- ${matchedPasswordCount} missing passwords`);
    console.log(`- ${matchedTxnCount} missing transaction passwords`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();

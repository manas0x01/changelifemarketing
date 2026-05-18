const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const allUsers = await usersCollection.find({}, {
      projection: {
        username: 1,
        userId: 1,
        password: 1,
        transactionPassword: 1,
        plainPassword: 1,
        plainTransactionPassword: 1
      }
    }).toArray();

    console.log(`Total Users: ${allUsers.length}`);
    console.log('--- Detail List ---');
    allUsers.forEach(u => {
      console.log(`User: ${u.username} (${u.userId})`);
      console.log(`  plainPassword:            ${u.plainPassword ? `'${u.plainPassword}'` : 'UNDEFINED'}`);
      console.log(`  plainTransactionPassword: ${u.plainTransactionPassword ? `'${u.plainTransactionPassword}'` : 'UNDEFINED'}`);
      console.log(`  password (hash):          ${u.password}`);
      console.log(`  transactionPassword (txn):${u.transactionPassword}`);
      console.log('------------------');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();

import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function checkOldData() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const users = db.collection('users');

  const oldUsers = await users.find({ 
    basicIncome: { $gt: 0 },
    $or: [
      { sessionBasedIncome: { $exists: false } },
      { sessionBasedIncome: { $size: 0 } }
    ]
  }).toArray();

  if (oldUsers.length > 0) {
    console.log(`⚠️ Found ${oldUsers.length} users with basicIncome > 0 but NO sessionBasedIncome array.`);
    for (const u of oldUsers) {
      console.log(`- ${u.username}: basicIncome=${u.basicIncome}, basicPairs=${u.basicPairs}`);
    }
  } else {
    console.log('✅ All users with basicIncome have a sessionBasedIncome array.');
  }

  // Also check if any basicPairs > 0 but no sessionBasedIncome
  const oldPairs = await users.find({ 
    basicPairs: { $gt: 0 },
    $or: [
      { sessionBasedIncome: { $exists: false } },
      { sessionBasedIncome: { $size: 0 } }
    ]
  }).toArray();

  if (oldPairs.length > 0) {
    console.log(`⚠️ Found ${oldPairs.length} users with basicPairs > 0 but NO sessionBasedIncome array.`);
  } else {
    console.log('✅ All users with basicPairs have a sessionBasedIncome array.');
  }

  await mongoose.disconnect();
}

checkOldData().catch(console.error);

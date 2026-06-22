import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function checkDetails() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  const u = await users.findOne({ username: 'CLM821812' });

  console.log('\n===== CLM821812 =====');
  console.log('basicIncome:', u?.basicIncome);
  console.log('basicPairs:', u?.basicPairs);
  console.log('totalIncome:', u?.totalIncome);
  console.log('totalTeam:', JSON.stringify(u?.totalTeam));
  console.log('sessionTeam:', JSON.stringify(u?.sessionTeam));
  console.log('sessionBasedIncome:', JSON.stringify(u?.sessionBasedIncome, null, 2));

  await mongoose.disconnect();
}

checkDetails().catch(e => { console.error(e); process.exit(1); });

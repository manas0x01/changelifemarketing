import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function checkDetails() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  // Let's get the detailed information of CLM708153, CLM118284, CLM332825
  const u1 = await users.findOne({ username: 'CLM708153' });
  const u2 = await users.findOne({ username: 'CLM118284' });
  const root = await users.findOne({ username: 'CLM332825' });

  console.log('\n===== CLM708153 (Left Child Registered at 11:29 AM) =====');
  console.log(JSON.stringify(u1, null, 2));

  console.log('\n===== CLM118284 (Right Child Registered at 3:53 PM) =====');
  console.log(JSON.stringify(u2, null, 2));

  console.log('\n===== CLM332825 (Root User) =====');
  console.log('totalTeam:', JSON.stringify(root.totalTeam));
  console.log('sessionTeam:', JSON.stringify(root.sessionTeam));
  console.log('lastSessionDate:', root.lastSessionDate);
  console.log('lastSessionType:', root.lastSessionType);

  await mongoose.disconnect();
}

checkDetails().catch(e => { console.error(e); process.exit(1); });

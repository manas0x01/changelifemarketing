const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/changelifemarketing';

async function checkUserID() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✓ Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Find user CLM674643
    console.log('🔍 Finding user CLM674643...');
    let user = await usersCollection.findOne({ username: 'CLM674643' });

    if (!user) {
      console.log('❌ User CLM674643 not found');
      return;
    }

    console.log(`\n✓ Found user: ${user.fullName || user.username}`);
    console.log(`\n📌 User Details:`);
    console.log(`   MongoDB ID: ${user._id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   UserID field: ${user.userId || 'NOT SET'}`);
    console.log(`   Total E-pins: ${user.ePins?.length || 0}`);
    
    console.log(`\n🔐 Session ID from logs: 69ce3106d269ea754f21cf8d`);
    
    // Check if IDs match
    if (user._id.toString() === '69ce3106d269ea754f21cf8d') {
      console.log('✅ IDs MATCH - Same user');
    } else {
      console.log(`❌ IDs DO NOT MATCH`);
      console.log(`   Expected: ${user._id.toString()}`);
      console.log(`   Got: 69ce3106d269ea754f21cf8d`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✓ Database connection closed');
  }
}

checkUserID();

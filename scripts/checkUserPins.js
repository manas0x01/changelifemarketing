const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/changelifemarketing';

async function checkUserPins() {
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
    console.log(`\n📌 E-Pins in database:`);
    
    if (!user.ePins || user.ePins.length === 0) {
      console.log('   ❌ No E-pins found');
    } else {
      console.log(`   Total pins: ${user.ePins.length}\n`);
      user.ePins.forEach((pin, idx) => {
        console.log(`   [${idx + 1}] PIN: ${pin.pin}`);
        console.log(`       Package: ${pin.packageName}`);
        console.log(`       Used Date: ${pin.usedDate || 'NOT SET (Available)'}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('✓ Database connection closed');
  }
}

checkUserPins();

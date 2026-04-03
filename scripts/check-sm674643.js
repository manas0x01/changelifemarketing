/**
 * Script to check data for user Sm674643 and CLM674643
 * Usage: node scripts/check-sm674643.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkUsers() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';
  const client = new MongoClient(mongoUri);
  
  try {
    console.log('🔐 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('changelifemarketing');
    const usersCollection = db.collection('users');

    // Check both users
    const users = ['Sm674643', 'CLM674643', 'sm674643', 'clm674643'];
    
    for (const username of users) {
      const user = await usersCollection.findOne({ username });
      if (user) {
        console.log(`\n✅ Found user: ${username}`);
        console.log(`   Full Name: ${user.fullName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Joining Date: ${user.joiningDate || '(NOT SET)'}`);
        console.log(`   Sponsor ID: ${user.sponsorId || '(NOT SET)'}`);
        console.log(`   Sponsor Name: ${user.sponsorName || '(NOT SET)'}`);
        console.log(`   Placement ID: ${user.placementId || '(NOT SET)'}`);
        console.log(`   Placement Name: ${user.placementName || '(NOT SET)'}`);
      } else {
        console.log(`❌ User not found: ${username}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkUsers();

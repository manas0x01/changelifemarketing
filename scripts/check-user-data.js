/**
 * Script to check complete user data from database
 * Usage: node scripts/check-user-data.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkUserData() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';
  const client = new MongoClient(mongoUri);
  
  try {
    console.log('🔐 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('changelifemarketing');
    const usersCollection = db.collection('users');

    console.log('\n🔍 Fetching ALL data for user CLM674643...');
    
    const user = await usersCollection.findOne({ username: 'CLM674643' });
    
    if (user) {
      console.log('\n✅ User found! Complete data:');
      console.log(JSON.stringify(user, null, 2));
      
      console.log('\n📋 Placement Fields Status:');
      console.log(`   joiningDate: ${user.joiningDate || '(EMPTY)'}`);
      console.log(`   sponsorId: ${user.sponsorId || '(EMPTY)'}`);
      console.log(`   sponsorName: ${user.sponsorName || '(EMPTY)'}`);
      console.log(`   placementId: ${user.placementId || '(EMPTY)'}`);
      console.log(`   placementName: ${user.placementName || '(EMPTY)'}`);
    } else {
      console.log('❌ User not found!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkUserData();

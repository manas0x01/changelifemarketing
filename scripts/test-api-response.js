/**
 * Test API endpoint to debug placement data fetch
 */

require('dotenv').config();

async function testAPI() {
  try {
    const { MongoClient } = require('mongodb');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';
    const client = new MongoClient(mongoUri);
    
    await client.connect();
    const db = client.db('changelifemarketing');
    const usersCollection = db.collection('users');
    
    console.log('🔍 Fetching CLM674643 from database...\n');
    
    const user = await usersCollection.findOne({ username: 'CLM674643' });
    
    if (user) {
      console.log('✅ User found in database!\n');
      console.log('📊 PLACEMENT FIELDS IN DATABASE:');
      console.log(`   username: ${user.username}`);
      console.log(`   fullName: ${user.fullName}`);
      console.log(`   joiningDate: "${user.joiningDate || ''}"`);
      console.log(`   sponsorId: "${user.sponsorId || ''}"`);
      console.log(`   sponsorName: "${user.sponsorName || ''}"`);
      console.log(`   placementId: "${user.placementId || ''}"`);
      console.log(`   placementName: "${user.placementName || ''}"`);
      
      console.log('\n📋 What API should return:');
      console.log(JSON.stringify({
        memberId: user.username || "",
        joiningDate: user.joiningDate || "",
        sponsorId: user.sponsorId || "",
        sponsorName: user.sponsorName || "",
        placementId: user.placementId || "",
        placementName: user.placementName || "",
      }, null, 2));
    } else {
      console.log('❌ User not found in database!');
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();

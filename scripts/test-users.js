/**
 * Test API response for CLM674643
 */

require('dotenv').config();

async function testAPI() {
  try {
    // Simulate getting user data without authentication
    // by directly querying MongoDB
    const { MongoClient } = require('mongodb');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';
    const client = new MongoClient(mongoUri);
    
    await client.connect();
    const db = client.db('changelifemarketing');
    const usersCollection = db.collection('users');
    
    console.log('🔍 Searching for all users with 674643...\n');
    
    const users = await usersCollection.find({
      username: { $regex: '674643', $options: 'i' }
    }).toArray();
    
    console.log(`Found ${users.length} users:\n`);
    
    users.forEach(user => {
      console.log(`========================================`);
      console.log(`Username: ${user.username}`);
      console.log(`Full Name: ${user.fullName}`);
      console.log(`Email: ${user.email}`);
      console.log(`\n📍 PLACEMENT FIELDS:`);
      console.log(`   memberID/Username: ${user.username}`);
      console.log(`   joiningDate: "${user.joiningDate || ''}"`);
      console.log(`   sponsorId: "${user.sponsorId || ''}"`);
      console.log(`   sponsorName: "${user.sponsorName || ''}"`);
      console.log(`   placementId: "${user.placementId || ''}"`);
      console.log(`   placementName: "${user.placementName || ''}"`);
      console.log(`========================================\n`);
    });
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();

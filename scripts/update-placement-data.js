/**
 * Script to update placement and sponsor details for a user
 * Usage: node scripts/update-placement-data.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function updateUserPlacementData() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';
  const client = new MongoClient(mongoUri);
  
  try {
    // Connect to MongoDB
    console.log('🔐 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    // Get database - explicitly specify database name
    const db = client.db('changelifemarketing');
    console.log('📊 Connected to database: changelifemarketing');
    
    const usersCollection = db.collection('users');

    // Update user placement data
    const updateData = {
      joiningDate: '02-April-2026',
      sponsorId: 'SM956718',
      sponsorName: 'ANKIT KUMAR',
      placementId: 'SM956718',
      placementName: 'ANKIT KUMAR',
    };

    console.log('\n🔍 Updating user: CLM674643');
    console.log('📋 Update data:', updateData);

    const result = await usersCollection.findOneAndUpdate(
      { username: 'CLM674643' },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (result) {
      console.log('\n✅ User updated successfully!');
      console.log('\n📊 Updated Fields:');
      console.log(`   ✓ Joining Date: ${result.joiningDate}`);
      console.log(`   ✓ Sponsor ID: ${result.sponsorId}`);
      console.log(`   ✓ Sponsor Name: ${result.sponsorName}`);
      console.log(`   ✓ Placement ID: ${result.placementId}`);
      console.log(`   ✓ Placement Name: ${result.placementName}`);
      console.log(`\n📊 User Record:`);
      console.log(`   Username: ${result.username}`);
      console.log(`   Email: ${result.email}`);
      console.log(`   Full Name: ${result.fullName}`);
    } else {
      console.log('❌ Failed to update user - user not found');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
updateUserPlacementData();

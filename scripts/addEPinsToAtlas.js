const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function addEPinsToAtlas() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✓ Connected to MongoDB Atlas\n');

    const db = client.db('changelifemarketing');
    const usersCollection = db.collection('users');

    // Find user CLM674643
    console.log('🔍 Finding user CLM674643...');
    const user = await usersCollection.findOne({ username: 'CLM674643' });

    if (!user) {
      console.log('❌ User CLM674643 not found');
      return;
    }

    console.log(`✓ Found user: ${user.fullName || user.username}`);
    console.log(`  Current E-pins: ${user.ePins?.length || 0}\n`);

    // Create 5 new E-pins
    const newPins = [
      { pin: 'EPIN21', packageName: 'Agriculture Package' },
      { pin: 'EPIN22', packageName: 'Healthcare Package' },
      { pin: 'EPIN23', packageName: 'Sanitary Napkine' },
      { pin: 'EPIN24', packageName: 'Agriculture Package' },
      { pin: 'EPIN25', packageName: 'Healthcare Package' },
    ];

    // Initialize ePins array if it doesn't exist
    const currentPins = user.ePins || [];

    // Add new pins (without usedDate so they're available)
    const updatedPins = [...currentPins, ...newPins];

    // Update user in database
    const result = await usersCollection.updateOne(
      { _id: user._id },
      { $set: { ePins: updatedPins } }
    );

    if (result.matchedCount === 0) {
      console.log('❌ User not found for update');
      return;
    }

    console.log('✓ Successfully added 5 E-pins to MongoDB Atlas:');
    newPins.forEach(p => console.log(`   ✓ ${p.pin} - ${p.packageName}`));
    
    console.log(`\n📊 Total E-pins for user now: ${updatedPins.length}`);
    console.log(`   Available: ${updatedPins.filter(p => !p.usedDate).length}`);
    console.log(`   Used: ${updatedPins.filter(p => p.usedDate).length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✓ Database connection closed');
  }
}

addEPinsToAtlas();

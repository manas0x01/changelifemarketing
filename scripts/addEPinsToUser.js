const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0;

async function addEPins() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✓ Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Find user by userId or username
    console.log('🔍 Finding user CLM674643...');
    let user = await usersCollection.findOne({ userId: 'CLM674643' });
    
    if (!user) {
      user = await usersCollection.findOne({ username: 'CLM674643' });
    }

    if (!user) {
      console.log('❌ User CLM674643 not found');
      return;
    }

    console.log(`✓ Found user: ${user.fullName || user.username}`);

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

    // Add new pins
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

    console.log('✓ Successfully added 5 E-pins:');
    newPins.forEach(p => console.log(`  - ${p.pin} (${p.packageName})`));
    
    console.log(`\n✓ Total E-pins for user now: ${updatedPins.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('✓ Database connection closed');
  }
}

addEPins();

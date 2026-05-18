const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get collection names and direct connection
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    // Let's check the users collection directly
    const usersCollection = db.collection('users');
    const totalUsers = await usersCollection.countDocuments();
    console.log('Total users in users collection:', totalUsers);

    // Let's group by role
    const roles = await usersCollection.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]).toArray();
    console.log('Users by role:', roles);

    // Let's group by memberType
    const memberTypes = await usersCollection.aggregate([
      { $group: { _id: '$memberType', count: { $sum: 1 } } }
    ]).toArray();
    console.log('Users by memberType:', memberTypes);

    // Let's list a few users
    const sampleUsers = await usersCollection.find({}, { projection: { username: 1, userId: 1, role: 1, memberType: 1 } }).limit(20).toArray();
    console.log('Sample users:', sampleUsers);

  } catch (error) {
    console.error('Error running audit:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();

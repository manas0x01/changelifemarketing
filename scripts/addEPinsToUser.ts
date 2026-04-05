import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Get absolute path for models
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modelPath = path.join(__dirname, '../models/User.ts');

// Import User model
const User = require(path.join(__dirname, '../models/User')).default;

async function addEPins() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Find user by userId or username
    console.log('🔍 Finding user CLM674643...');
    let user = await mongoose.connection.collection('users').findOne({ userId: 'CLM674643' });
    
    if (!user) {
      user = await mongoose.connection.collection('users').findOne({ username: 'CLM674643' });
    }

    if (!user) {
      console.log('❌ User CLM674643 not found');
      await mongoose.connection.close();
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
    if (!user.ePins) {
      user.ePins = [];
    }

    // Add new pins
    user.ePins.push(...newPins);

    // Update user in database
    await mongoose.connection.collection('users').updateOne(
      { _id: user._id },
      { $set: { ePins: user.ePins } }
    );

    console.log('✓ Successfully added 5 E-pins:');
    newPins.forEach(p => console.log(`  - ${p.pin} (${p.packageName})`));
    
    console.log(`\n✓ Total E-pins for user: ${user.ePins.length + newPins.length}`);

    await mongoose.connection.close();
    console.log('✓ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addEPins();

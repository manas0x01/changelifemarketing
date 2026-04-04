#!/usr/bin/env node

/**
 * Script to count total users in database
 * Usage: node scripts/countUsers.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Import User model
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  fullName: String,
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function countUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Count all users
    console.log('\n📊 Counting users...');
    const totalCount = await User.countDocuments();
    
    // Get some additional stats
    const usersWithEmail = await User.countDocuments({ email: { $exists: true, $ne: null } });
    const usersWithFullName = await User.countDocuments({ fullName: { $exists: true, $ne: null } });

    console.log('\n' + '='.repeat(50));
    console.log('📈 USER DATABASE STATISTICS');
    console.log('='.repeat(50));
    console.log(`\n✅ Total Users:              ${totalCount}`);
    console.log(`✅ Users with Email:        ${usersWithEmail}`);
    console.log(`✅ Users with Full Name:    ${usersWithFullName}`);
    console.log('\n' + '='.repeat(50) + '\n');

    // Show sample users (last 5)
    if (totalCount > 0) {
      console.log('📋 Last 5 registered users:');
      const recentUsers = await User.find()
        .select('username email fullName')
        .sort({ _id: -1 })
        .limit(5);
      
      recentUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.username} - ${user.fullName} (${user.email})`);
      });
      console.log('');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

countUsers();

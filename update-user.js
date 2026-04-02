const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const userSchema = new mongoose.Schema(
  {
    username: String,
    password: String,
    transactionPassword: String,
    email: String,
    phone: String,
    fullName: String,
    role: String,
  },
  { 
    timestamps: true,
    strict: false 
  }
);

userSchema.pre('save', async function () {
  const salt = await bcrypt.genSalt(12);

  if (this.isModified('transactionPassword')) {
    this.transactionPassword = await bcrypt.hash(this.transactionPassword, salt);
  }
});

const User = mongoose.model('User', userSchema);

async function updateUser() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);

    const userId = '69ce3106d269ea754f21cf8d';
    
    console.log('\n📝 Updating user data...');
    console.log('   User ID: ' + userId);
    
    const user = await User.findById(userId);

    if (!user) {
      console.log('❌ User not found');
      mongoose.connection.close();
      return;
    }

    console.log('\n✏️ Setting new fields:');
    console.log('   Transaction Password: 715930');
    console.log('   Phone: +91 82994 71579');
    console.log('   Full Name: Ajay Kumar');
    console.log('   Role: admin');

    user.transactionPassword = '715930';
    user.phone = '+91 82994 71579';
    user.fullName = 'Ajay Kumar';
    user.role = 'admin';

    await user.save();

    console.log('\n✅ User updated successfully!');
    console.log('\n📊 Updated User Data:');
    console.log('════════════════════════════════════');
    const updatedUser = await User.findById(userId).select('+password +transactionPassword').lean();
    
    Object.keys(updatedUser).forEach(key => {
      if (key === 'password' || key === 'transactionPassword') {
        console.log(`${key}: [HASHED - Length: ${updatedUser[key]?.length || 'N/A'}]`);
      } else if (key === '_id') {
        console.log(`${key}: ${updatedUser[key]}`);
      } else {
        console.log(`${key}: ${JSON.stringify(updatedUser[key])}`);
      }
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
}

updateUser();

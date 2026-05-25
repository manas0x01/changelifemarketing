const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: ".env.local" });

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function revertAdminEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");
    
    // Revert the email back
    const result = await User.updateOne(
      { username: 'Changelifemarketing' },
      { $set: { email: 'ajaykumaraj2476@gmail.com' } }
    );
    
    console.log("Revert result:", result);
    
    const admin = await User.findOne({ username: 'Changelifemarketing' });
    console.log("Reverted Admin user email:", admin.email);
    
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

revertAdminEmail();

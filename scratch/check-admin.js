const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: ".env.local" });

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  role: String,
  fullName: String
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");
    
    const admin = await User.findOne({ username: 'Changelifemarketing' });
    console.log("Admin user:", admin);
    
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkAdmin();

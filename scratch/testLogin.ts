import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const username = 'CHANGELIFEMARKETING';
    const passwordStr = 'changelifemarketing@ajaykumar';

    const user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username}$`, 'i') } },
        { userId: { $regex: new RegExp(`^${username}$`, 'i') } },
      ],
    }).select("+password");

    if (!user) {
      console.log('User not found by next-auth logic');
      return;
    }

    console.log('User found:', user.username);
    console.log('Has password field:', !!user.password);
    console.log('Hashed password:', user.password);
    
    const isValid = await user.comparePassword(passwordStr);
    console.log('Is valid password?', isValid);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

main();

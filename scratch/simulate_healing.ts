import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Users/Manas/Desktop/changelifemarketing/.env.local' });

import { connectDB } from '../lib/database';
import User from '../models/User';

async function simulate() {
  await connectDB();
  const user = await User.findOne({ username: 'CLM334978' });
  
  if (!user) {
    console.log("❌ User CLM334978 not found.");
    process.exit(1);
  }

  console.log("Original state:");
  console.log(`basicIncome: ${user.basicIncome}, boosterMatchingIncome: ${user.boosterMatchingIncome}, totalIncome: ${user.totalIncome}`);

  // Let's call save to trigger the pre-save hooks
  console.log("Saving user to trigger pre-save self-healing...");
  await user.save();

  // Fetch again
  const updatedUser = await User.findOne({ username: 'CLM334978' });
  if (updatedUser) {
    console.log("State after save:");
    console.log(`basicIncome: ${updatedUser.basicIncome}, boosterMatchingIncome: ${updatedUser.boosterMatchingIncome}, totalIncome: ${updatedUser.totalIncome}`);
  }
  process.exit(0);
}

simulate().catch(err => {
  console.error(err);
  process.exit(1);
});

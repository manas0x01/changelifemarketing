import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Users/Manas/Desktop/changelifemarketing/.env.local' });

import { connectDB } from '../lib/database';
import User from '../models/User';

async function saveAjayParent() {
  await connectDB();
  const user = await User.findOne({ username: 'CLM972562' });
  
  if (!user) {
    console.log("❌ User CLM972562 not found.");
    process.exit(1);
  }

  console.log("Before save:");
  console.log(`- Username: ${user.username}`);
  console.log(`- FullName: ${user.fullName}`);
  console.log(`- boosterCount: L:${user.boosterCount?.left}, R:${user.boosterCount?.right}`);
  console.log(`- boosterIncome.LG: ${user.boosterIncome?.LG}, RG: ${user.boosterIncome?.RG}`);

  console.log("\nSaving user CLM972562 to run pre-save self-healing...");
  await user.save();

  // Fetch again
  const updatedUser = await User.findOne({ username: 'CLM972562' });
  if (updatedUser) {
    console.log("\nAfter save:");
    console.log(`- Username: ${updatedUser.username}`);
    console.log(`- FullName: ${updatedUser.fullName}`);
    console.log(`- boosterCount: L:${updatedUser.boosterCount?.left}, R:${updatedUser.boosterCount?.right}`);
    console.log(`- boosterIncome.LG: ${updatedUser.boosterIncome?.LG}, RG: ${updatedUser.boosterIncome?.RG}`);
  }

  process.exit(0);
}

saveAjayParent().catch(err => {
  console.error(err);
  process.exit(1);
});

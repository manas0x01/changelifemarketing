import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Users/Manas/Desktop/changelifemarketing/.env.local' });

import { connectDB } from '../lib/database';
import User from '../models/User';

async function findDownline() {
  await connectDB();
  const user = await User.findOne({ username: 'CLM510248' });
  
  if (!user) {
    console.log("❌ User CLM510248 not found.");
    process.exit(1);
  }

  console.log("User details:");
  console.log(`- Username: ${user.username}`);
  console.log(`- FullName: ${user.fullName}`);
  console.log(`- Left Child: ${user.leftChild}`);
  console.log(`- Right Child: ${user.rightChild}`);
  console.log(`- boosterCount: L:${user.boosterCount?.left}, R:${user.boosterCount?.right}`);

  // Let's do a graphLookup to find all descendants on the left side
  if (user.leftChild) {
    console.log(`\n--- Descendants on Left Side (under placement ${user.leftChild}) ---`);
    const leftDescendants = await User.aggregate([
      { $match: { username: user.leftChild } },
      {
        $graphLookup: {
          from: "users",
          startWith: "$username",
          connectFromField: "username",
          connectToField: "placementId",
          as: "descendants"
        }
      }
    ]);
    
    if (leftDescendants.length > 0) {
      const root = leftDescendants[0];
      console.log(`Left Root: ${root.username} (${root.fullName}), isBooster: ${root.isBooster}`);
      for (const d of root.descendants) {
        console.log(`- ${d.username} (${d.fullName}), isBooster: ${d.isBooster}, placementId: ${d.placementId}, placementPosition: ${d.placementPosition}`);
      }
    } else {
      console.log("Left root not found in DB.");
    }
  } else {
    console.log("No left child placed yet.");
  }

  // Let's check descendants on the right side as well for comparison
  if (user.rightChild) {
    console.log(`\n--- Descendants on Right Side (under placement ${user.rightChild}) ---`);
    const rightDescendants = await User.aggregate([
      { $match: { username: user.rightChild } },
      {
        $graphLookup: {
          from: "users",
          startWith: "$username",
          connectFromField: "username",
          connectToField: "placementId",
          as: "descendants"
        }
      }
    ]);
    
    if (rightDescendants.length > 0) {
      const root = rightDescendants[0];
      console.log(`Right Root: ${root.username} (${root.fullName}), isBooster: ${root.isBooster}`);
      for (const d of root.descendants) {
        console.log(`- ${d.username} (${d.fullName}), isBooster: ${d.isBooster}, placementId: ${d.placementId}, placementPosition: ${d.placementPosition}`);
      }
    }
  }

  process.exit(0);
}

findDownline().catch(err => {
  console.error(err);
  process.exit(1);
});

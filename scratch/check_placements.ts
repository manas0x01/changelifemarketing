import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Users/Manas/Desktop/changelifemarketing/.env.local' });

import { connectDB } from '../lib/database';
import User from '../models/User';

async function checkPlacements() {
  await connectDB();
  const children = await User.find({ placementId: 'CLM510248' });
  console.log("Direct children of CLM510248 by placementId:");
  for (const child of children) {
    console.log(`- Username: ${child.username}, FullName: ${child.fullName}, placementPosition: ${child.placementPosition}, isBooster: ${child.isBooster}`);
  }
  
  // Let's also inspect CLM423643 and CLM597623 directly
  const c1 = await User.findOne({ username: 'CLM423643' });
  const c2 = await User.findOne({ username: 'CLM597623' });
  console.log("\nDirect child details:");
  if (c1) {
    console.log(`- CLM423643: placementId: ${c1.placementId}, placementPosition: ${c1.placementPosition}, isBooster: ${c1.isBooster}`);
  }
  if (c2) {
    console.log(`- CLM597623: placementId: ${c2.placementId}, placementPosition: ${c2.placementPosition}, isBooster: ${c2.isBooster}`);
  }

  process.exit(0);
}

checkPlacements().catch(err => {
  console.error(err);
  process.exit(1);
});

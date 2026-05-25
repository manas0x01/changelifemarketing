import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Users/Manas/Desktop/changelifemarketing/.env.local' });

import { connectDB } from '../lib/database';
import User from '../models/User';

async function viewRecords() {
  await connectDB();
  const user = await User.findOne({ username: 'CLM334978' });
  
  if (!user) {
    console.log("❌ User CLM334978 not found.");
  } else {
    console.log("=== sessionBasedIncome ===");
    console.log(JSON.stringify(user.sessionBasedIncome, null, 2));
    
    console.log("=== boosterMatchingRecords ===");
    console.log(JSON.stringify(user.boosterMatchingRecords, null, 2));

    console.log("=== basicIncomeRecords ===");
    console.log(JSON.stringify(user.basicIncomeRecords, null, 2));

    console.log("=== boosterIncomeRecords ===");
    console.log(JSON.stringify(user.boosterIncomeRecords, null, 2));
  }
  process.exit(0);
}

viewRecords().catch(err => {
  console.error(err);
  process.exit(1);
});

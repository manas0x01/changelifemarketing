import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Users/Manas/Desktop/changelifemarketing/.env.local' });

import { connectDB } from '../lib/database';
import User from '../models/User';

async function findUser() {
  await connectDB();
  const user = await User.findOne({
    $or: [
      { username: 'CLM334978' },
      { userId: 'CLM334978' }
    ]
  });
  
  if (!user) {
    console.log("❌ User CLM334978 not found.");
    
    // Let's search by fullName / username / etc. containing KUMA or REM KUMA
    console.log("Searching for users matching 'KUMA'...");
    const users = await User.find({
      $or: [
        { username: /KUMA/i },
        { fullName: /KUMA/i }
      ]
    });
    console.log(`Found ${users.length} matching users:`);
    for (const u of users) {
      console.log(`- Username: ${u.username}, UserID: ${u.userId}, FullName: ${u.fullName}`);
    }
  } else {
    console.log("✅ User found:");
    console.log(JSON.stringify({
      username: user.username,
      userId: user.userId,
      fullName: user.fullName,
      basicIncome: user.basicIncome,
      boosterMatchingIncome: user.boosterMatchingIncome,
      totalIncome: user.totalIncome,
      isBooster: user.isBooster,
      basicPairs: user.basicPairs,
      boosterPairs: user.boosterPairs,
      totalTeam: user.totalTeam,
      sessionBasedIncome: user.sessionBasedIncome?.length,
      boosterMatchingRecords: user.boosterMatchingRecords?.length
    }, null, 2));
  }
  process.exit(0);
}

findUser().catch(err => {
  console.error(err);
  process.exit(1);
});

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Users/Manas/Desktop/changelifemarketing/.env.local' });

import { connectDB } from '../lib/database';
import User from '../models/User';

async function verifyAll() {
  await connectDB();
  const usernames = ['CLM334978', 'CLM387658', 'CLM671299'];
  const users = await User.find({ username: { $in: usernames } });
  
  console.log("=== Verification Results ===");
  for (const username of usernames) {
    const user = users.find(u => u.username === username);
    if (user) {
      console.log(JSON.stringify({
        username: user.username,
        fullName: user.fullName,
        basicIncome: user.basicIncome,
        boosterMatchingIncome: user.boosterMatchingIncome,
        totalIncome: user.totalIncome,
        basicPairs: user.basicPairs,
        totalTeam: { left: user.totalTeam?.left, right: user.totalTeam?.right },
        sessionBasedIncomeLength: user.sessionBasedIncome?.length,
        basicIncomeRecordsLength: user.basicIncomeRecords?.length
      }, null, 2));
    } else {
      console.log(`❌ User ${username} not found in database.`);
    }
  }
  process.exit(0);
}

verifyAll().catch(err => {
  console.error(err);
  process.exit(1);
});

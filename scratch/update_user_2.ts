import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Users/Manas/Desktop/changelifemarketing/.env.local' });

import { connectDB } from '../lib/database';
import User from '../models/User';

async function updateStats() {
  await connectDB();
  const user = await User.findOne({ username: 'CLM671299' });
  
  if (!user) {
    console.log("❌ User CLM671299 not found.");
    process.exit(1);
  }

  console.log("Current user details:");
  console.log(`- Username: ${user.username}`);
  console.log(`- FullName: ${user.fullName}`);
  console.log(`- Current basicIncome: ${user.basicIncome}`);
  console.log(`- Current boosterMatchingIncome: ${user.boosterMatchingIncome}`);
  console.log(`- Current totalIncome: ${user.totalIncome}`);
  console.log(`- Current totalTeam: L:${user.totalTeam?.left}, R:${user.totalTeam?.right}`);

  // 1. Maintain totalTeam as is (L: 12, R: 12) which is already >= 11
  // 2. Generate exactly 11 sessionBasedIncome records
  // We'll preserve the existing 2 records (index 0, 1)
  const sessions: any[] = [];
  
  // Existing session 1
  sessions.push({
    date: new Date("2026-05-23T16:26:04.668Z"),
    sessionType: "evening",
    pairs: 1,
    netIncome: 1000,
    processed: true
  });
  
  // Existing session 2
  sessions.push({
    date: new Date("2026-05-24T14:35:05.110Z"),
    sessionType: "evening",
    pairs: 1,
    netIncome: 1000,
    processed: true
  });

  // Generate sessions 3 to 11
  const cutLevels = [3, 6, 9, 12];
  let currentDate = new Date("2026-05-24T14:35:05.110Z");

  for (let i = 2; i < 11; i++) {
    const sessionIndex = i + 1;
    const isCut = cutLevels.includes(sessionIndex);
    
    // Increment date by 12 hours for each session
    currentDate = new Date(currentDate.getTime() + 12 * 60 * 60 * 1000);
    
    sessions.push({
      date: new Date(currentDate),
      sessionType: sessionIndex % 2 === 0 ? "evening" : "morning",
      pairs: 1,
      netIncome: isCut ? 0 : 1000,
      description: isCut ? `Basic Session #${sessionIndex} Cut` : "Binary Income",
      processed: true
    });
  }

  // Set the modified sessions to the user doc
  user.sessionBasedIncome = sessions;

  // Let's force basicPairs to 11
  user.basicPairs = 11;

  // Mark modified
  user.markModified('sessionBasedIncome');

  console.log("\nSaving user with updated sessionBasedIncome...");
  await user.save();

  // Fetch from DB again to verify
  const updatedUser = await User.findOne({ username: 'CLM671299' });
  if (updatedUser) {
    console.log("\n✅ User successfully updated!");
    console.log(`- Username: ${updatedUser.username}`);
    console.log(`- FullName: ${updatedUser.fullName}`);
    console.log(`- New basicIncome: ${updatedUser.basicIncome}`);
    console.log(`- New boosterMatchingIncome: ${updatedUser.boosterMatchingIncome}`);
    console.log(`- New totalIncome: ${updatedUser.totalIncome}`);
    console.log(`- New basicPairs count: ${updatedUser.basicPairs}`);
    console.log(`- New sessionBasedIncome length: ${updatedUser.sessionBasedIncome?.length}`);
    console.log(`- New basicIncomeRecords length: ${updatedUser.basicIncomeRecords?.length}`);
    console.log(`- New totalTeam: L:${updatedUser.totalTeam?.left}, R:${updatedUser.totalTeam?.right}`);
  }

  process.exit(0);
}

updateStats().catch(err => {
  console.error(err);
  process.exit(1);
});

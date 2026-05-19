import mongoose from 'mongoose';
import { connectDB } from '../lib/database';
import User from '../models/User';

process.env.MONGODB_URI = "mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0";

async function main() {
  await connectDB();
  console.log("Connected to MongoDB successfully!");

  // 1. Fetch Changelifemarketing
  const mainUser = await User.findOne({ username: 'Changelifemarketing' });
  if (!mainUser) {
    console.log("Main user Changelifemarketing not found!");
    process.exit(1);
  }

  // 2. Clean up any previous dummy test users
  console.log("Cleaning up previous dummy users starting with 'dummy'...");
  await User.deleteMany({ username: /^dummy/ });

  // 3. Upgrade Changelifemarketing to Booster (required to get booster rewards)
  console.log("Upgrading Changelifemarketing to Booster status...");
  mainUser.isBooster = true;
  mainUser.basicRank = "Booster";
  mainUser.boosterAchievedAt = new Date();
  
  // Clear any old ranks so we start fresh
  mainUser.awardRankStatus = {
    rank: 0,
    rankName: 'Member',
    leftBoostersForRank: 0,
    rightBoostersForRank: 0,
  };
  mainUser.boosterCountUsedForRank = { left: 0, right: 0 };
  mainUser.awardRankRecords = [];
  await mainUser.save();
  console.log("Main user upgraded to Booster, award status reset.");

  // 4. Create 15 Booster descendants on Left leg (under CLM633778)
  console.log("Creating 15 booster descendants on Left leg...");
  const leftChild = mainUser.leftChild || "CLM633778";
  let parentLeft = leftChild;
  for (let i = 1; i <= 15; i++) {
    const username = `dummyL${i}`;
    await User.create({
      username,
      password: "dummypassword123",
      fullName: `Dummy Left Booster ${i}`,
      placementId: parentLeft,
      placementPosition: "left",
      isBooster: true,
      role: "user"
    });
    console.log(`Created left booster member: ${username} under parent: ${parentLeft}`);
    parentLeft = username;
  }

  // 5. Create 15 Booster descendants on Right leg (under CLM150835)
  console.log("Creating 15 booster descendants on Right leg...");
  const rightChild = mainUser.rightChild || "CLM150835";
  let parentRight = rightChild;
  for (let i = 1; i <= 15; i++) {
    const username = `dummyR${i}`;
    await User.create({
      username,
      password: "dummypassword123",
      fullName: `Dummy Right Booster ${i}`,
      placementId: parentRight,
      placementPosition: "right",
      isBooster: true,
      role: "user"
    });
    console.log(`Created right booster member: ${username} under parent: ${parentRight}`);
    parentRight = username;
  }

  // 6. Trigger save on main user to run self-healing hook
  console.log("Saving Changelifemarketing again to trigger aggregation tree audit and checkAwardRank hook...");
  
  // Fetch a fresh instance
  const freshUser = await User.findOne({ username: 'Changelifemarketing' });
  if (!freshUser) {
    console.log("Fresh instance not found!");
    process.exit(1);
  }

  // Touch any field to force save
  freshUser.updatedAt = new Date();
  await freshUser.save();
  console.log("Save triggered successfully!");

  // 7. Verify result
  const finalUser = await User.findOne({ username: 'Changelifemarketing' });
  if (finalUser) {
    console.log("\n=== POST-SAVE VERIFICATION RESULTS ===");
    console.log("isBooster:", finalUser.isBooster);
    console.log("boosterCount (Left / Right):", finalUser.boosterCount);
    console.log("usedCount (Left / Right):", finalUser.boosterCountUsedForRank);
    console.log("Current Rank:", finalUser.awardRankStatus);
    console.log("Award Rank Records:", JSON.stringify(finalUser.awardRankRecords, null, 2));
  }

  mongoose.connection.close();
}

main().catch(err => {
  console.error("Error in script:", err);
  mongoose.connection.close();
});

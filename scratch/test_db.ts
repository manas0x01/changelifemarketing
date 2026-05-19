import mongoose from 'mongoose';
import { connectDB } from '../lib/database';
import User from '../models/User';

process.env.MONGODB_URI = "mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0";

async function main() {
  await connectDB();
  console.log("Connected to MongoDB successfully!");

  const user = await User.findOne({ username: 'Changelifemarketing' });
  if (!user) {
    console.log("User Changelifemarketing not found!");
    process.exit(0);
  }

  console.log("=== USER DETAILS ===");
  console.log("Username:", user.username);
  console.log("isBooster:", user.isBooster);
  console.log("leftChild:", user.leftChild);
  console.log("rightChild:", user.rightChild);
  console.log("totalTeam:", user.totalTeam);
  console.log("boosterCount:", user.boosterCount);
  console.log("awardRankStatus:", user.awardRankStatus);
  console.log("awardRankRecords:", user.awardRankRecords);

  // Check if they have any children already
  const children = await User.find({ placementId: 'Changelifemarketing' });
  console.log("Immediate Placement Children Count:", children.length);
  children.forEach(c => {
    console.log(`- Child: ${c.username}, Position: ${c.placementPosition}, isBooster: ${c.isBooster}`);
  });

  mongoose.connection.close();
}

main().catch(err => {
  console.error("Error in script:", err);
  mongoose.connection.close();
});

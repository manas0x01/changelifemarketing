import { connectDB } from "./lib/database";
import mongoose from "mongoose";
import User from "./models/User";

async function checkCounts() {
  await connectDB();
  
  const ipGroups = await User.aggregate([
    { $match: { registrationIp: { $exists: true, $ne: "unknown" } } },
    { $group: { _id: "$registrationIp", count: { $sum: 1 } } }
  ]);
  console.log("IP counts:", ipGroups);

  const bankGroups = await User.aggregate([
    { $match: { accountNo: { $exists: true, $ne: "" } } },
    { $group: { _id: "$accountNo", count: { $sum: 1 } } },
    { $match: { count: { $gte: 1 } } }
  ]);
  console.log("Bank counts:", bankGroups.slice(0, 5));

  const upiGroups = await User.aggregate([
    { $match: { upiId: { $exists: true, $ne: "" } } },
    { $group: { _id: "$upiId", count: { $sum: 1 } } },
    { $match: { count: { $gte: 1 } } }
  ]);
  console.log("UPI counts:", upiGroups.slice(0, 5));

  process.exit(0);
}

checkCounts().catch(console.error);

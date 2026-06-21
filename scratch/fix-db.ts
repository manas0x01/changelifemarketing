import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";
import { connectDB } from "../lib/database";

dotenv.config({ path: ".env.local" });

async function fix() {
  await connectDB();
  
  const result = await User.updateMany({
    bankDetailsStatus: "approved",
    $and: [
      { $or: [{ accountNo: "" }, { accountNo: " " }, { accountNo: { $exists: false } }, { accountNo: null }] },
      { $or: [{ bankName: "" }, { bankName: " " }, { bankName: { $exists: false } }, { bankName: null }] }
    ]
  }, {
    $set: { bankDetailsStatus: "none" }
  });
  
  console.log(`Fixed ${result.modifiedCount} users who had 'approved' status but no bank details.`);
  
  process.exit(0);
}

fix();

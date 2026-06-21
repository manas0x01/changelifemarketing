import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";
import { connectDB } from "../lib/database";

dotenv.config({ path: ".env.local" });

async function check() {
  await connectDB();
  const users = await User.find({ 
    bankDetailsStatus: "approved",
    $or: [
      { accountNo: { $in: ["", " ", null, undefined, "undefined"] } },
      { bankName: { $in: ["", " ", null, undefined, "undefined"] } },
      { ifsc: { $in: ["", " ", null, undefined, "undefined"] } }
    ]
  }, "username bankName accountNo ifsc bankDetailsStatus createdAt").sort({ createdAt: -1 }).limit(10);
  
  console.log("Approved users with missing details:", users);
  
  const allUsers = await User.countDocuments();
  console.log("Total users:", allUsers);
  
  process.exit(0);
}

check();

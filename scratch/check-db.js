import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import { connectDB } from "./lib/database.js";

dotenv.config({ path: ".env.local" });

async function check() {
  await connectDB();
  const users = await User.find({ bankDetailsStatus: "approved" }, "username bankName accountNo ifsc bankDetailsStatus").limit(10);
  console.log("Approved users:", users);
  
  const noneUsers = await User.find({ bankDetailsStatus: "none" }, "username bankName accountNo ifsc bankDetailsStatus").limit(5);
  console.log("None users:", noneUsers);
  
  process.exit(0);
}

check();

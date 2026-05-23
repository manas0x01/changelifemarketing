import { connectDB } from "./lib/database";
import mongoose from "mongoose";

async function checkIndexes() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) {
    console.error("No db connection");
    process.exit(1);
  }
  const collection = db.collection("users");
  const indexes = await collection.indexes();
  console.log(JSON.stringify(indexes, null, 2));
  process.exit(0);
}

checkIndexes().catch(console.error);

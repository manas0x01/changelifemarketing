import mongoose from "mongoose";
import User from "./models/User";
import { connectDB } from "./lib/database";

async function run() {
  await connectDB();
  const rootUser = await User.findOne({ username: "CHANGELIFE" });
  if (!rootUser) {
    console.log("No root user");
    process.exit(0);
  }

  console.log("Root user:", rootUser.username, rootUser.leftChild, rootUser.rightChild);
  
  if (rootUser.leftChild) {
    const leftChild = await User.findOne({ username: rootUser.leftChild });
    if (leftChild) {
        const result = await User.aggregate([
          { $match: { _id: leftChild._id } },
          {
            $graphLookup: {
              from: "users",
              startWith: "$username",
              connectFromField: "username",
              connectToField: "placementId",
              as: "descendants"
            }
          }
        ]);
        console.log("Descendants via username:", result[0]?.descendants?.length);

        const result2 = await User.aggregate([
          { $match: { _id: leftChild._id } },
          {
            $graphLookup: {
              from: "users",
              startWith: "$userId",
              connectFromField: "userId",
              connectToField: "placementId",
              as: "descendants"
            }
          }
        ]);
        console.log("Descendants via userId:", result2[0]?.descendants?.length);
    }
  }
  process.exit(0);
}
run();

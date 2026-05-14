
import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('Connected to MongoDB');

  const sponsorId = 'CLMK22';
  
  // 1. Setup CLMK22 with ONE child on the Right
  console.log(`Setting up ${sponsorId} with a child on the RIGHT...`);
  await User.updateOne({ username: sponsorId }, {
      leftChild: "",
      rightChild: "R_CHILD_TEST",
      totalTeam: { left: 0, right: 1 } // even if count is 0, it should be considered filled
  });

  // Ensure the child exists in DB
  await User.deleteOne({ username: "R_CHILD_TEST" });
  await new User({ username: "R_CHILD_TEST", userId: "R_CHILD_TEST", password: "password", isBooster: false }).save();

  // 2. Call the logic that determines available positions (simulating the API)
  const sponsor = await User.findOne({ username: sponsorId });
  
  let hasLeftChild = false;
  let hasRightChild = false;

  if (sponsor!.leftChild && sponsor!.leftChild.trim() !== "") {
    const leftChildUser = await User.findOne({
      $or: [{ username: sponsor!.leftChild.trim() }, { userId: sponsor!.leftChild.trim() }]
    });
    hasLeftChild = !!leftChildUser;
  }
  if (sponsor!.rightChild && sponsor!.rightChild.trim() !== "") {
    const rightChildUser = await User.findOne({
      $or: [{ username: sponsor!.rightChild.trim() }, { userId: sponsor!.rightChild.trim() }]
    });
    hasRightChild = !!rightChildUser;
  }

  const availablePositions = [];
  if (!hasLeftChild) availablePositions.push("left");
  if (!hasRightChild) availablePositions.push("right");

  console.log('Results:');
  console.log('Has Left Child:', hasLeftChild);
  console.log('Has Right Child:', hasRightChild);
  console.log('Available Positions:', availablePositions);

  if (availablePositions.length === 1 && availablePositions[0] === 'left') {
      console.log('✅ SUCCESS: Only Left is available.');
  } else {
      console.log('❌ FAILURE: Incorrect available positions.');
  }

  await mongoose.disconnect();
}

run().catch(console.error);

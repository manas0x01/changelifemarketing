import dotenv from 'dotenv';
import path from 'path';

// Load environmental variables from .env.local
dotenv.config({ path: 'c:/Users/Manas/Desktop/changelifemarketing/.env.local' });

import { connectDB } from '../lib/database';
import User from '../models/User';
import { authOptions } from '../lib/auth';

const authorize = (authOptions.providers[0] as any).options.authorize;

async function testLockout() {
  console.log("Starting account lockout verification test...");
  
  await connectDB();
  
  const testUsername = "testlockoutuser_temp";
  
  // Clean up any existing test user
  await User.deleteOne({ username: testUsername });
  
  // Create a clean test user
  const testUser = new User({
    username: testUsername,
    password: "CorrectPassword123",
    email: "testlockout@example.com",
    role: "user"
  });
  
  await testUser.save();
  console.log("✅ Created test user:", testUsername);
  
  try {
    // 1. Success case: test with correct password
    console.log("\n--- Testing 1: Successful login with correct password ---");
    const successRes = await authorize({
      username: testUsername,
      password: "CorrectPassword123"
    } as any, {} as any);
    
    if (successRes) {
      console.log("✅ Successfully authorized with correct credentials");
    } else {
      console.error("❌ Failed to authorize with correct credentials");
    }

    // 2. Failed cases: attempt 1
    console.log("\n--- Testing 2: First wrong password attempt ---");
    try {
      await authorize({
        username: testUsername,
        password: "WrongPassword"
      } as any, {} as any);
      console.error("❌ Expected failure but authorized successfully!");
    } catch (e: any) {
      console.log(`✅ Failed as expected. Error: "${e.message}"`);
      const user = await User.findOne({ username: testUsername });
      console.log(`Database state: loginAttempts = ${user?.loginAttempts}, lockUntil = ${user?.lockUntil}`);
    }

    // 3. Failed cases: attempt 2
    console.log("\n--- Testing 3: Second wrong password attempt ---");
    try {
      await authorize({
        username: testUsername,
        password: "WrongPassword"
      } as any, {} as any);
      console.error("❌ Expected failure but authorized successfully!");
    } catch (e: any) {
      console.log(`✅ Failed as expected. Error: "${e.message}"`);
      const user = await User.findOne({ username: testUsername });
      console.log(`Database state: loginAttempts = ${user?.loginAttempts}, lockUntil = ${user?.lockUntil}`);
    }

    // 4. Failed cases: attempt 3 (Lockout trigger)
    console.log("\n--- Testing 4: Third wrong password attempt (Should Lockout) ---");
    try {
      await authorize({
        username: testUsername,
        password: "WrongPassword"
      } as any, {} as any);
      console.error("❌ Expected failure but authorized successfully!");
    } catch (e: any) {
      console.log(`✅ Failed as expected. Error: "${e.message}"`);
      const user = await User.findOne({ username: testUsername });
      console.log(`Database state: loginAttempts = ${user?.loginAttempts}, lockUntil = ${user?.lockUntil}`);
      if (e.message === "Try after 10 minutes" && user?.lockUntil) {
        console.log("✅ User successfully locked out!");
      } else {
        console.error("❌ User not locked out or incorrect error message!");
      }
    }

    // 5. Check lockout enforcement
    console.log("\n--- Testing 5: Fourth login attempt during lockout ---");
    try {
      await authorize({
        username: testUsername,
        password: "CorrectPassword123" // even correct password should fail during lockout!
      } as any, {} as any);
      console.error("❌ Expected failure during lockout but authorized successfully!");
    } catch (e: any) {
      console.log(`✅ Locked out as expected. Error: "${e.message}"`);
      if (e.message === "Try after 10 minutes") {
        console.log("✅ Enforced lockout is working perfectly!");
      } else {
        console.error("❌ Enforced lockout gave unexpected error:", e.message);
      }
    }

    // 6. Test Expiration / Retry
    console.log("\n--- Testing 6: Simulating lockout expiry ---");
    // Manually update the database lockUntil to a past date
    await User.updateOne({ username: testUsername }, { $set: { lockUntil: new Date(Date.now() - 5000) } });
    console.log("Simulated lockout expiration by setting lockUntil in the past.");
    
    // Now trying with wrong password again should not show lockout message, but rather 'Invalid username or password'
    // and increment attempt to 1.
    try {
      await authorize({
        username: testUsername,
        password: "WrongPassword"
      } as any, {} as any);
    } catch (e: any) {
      console.log(`✅ Failed as expected. Error: "${e.message}"`);
      const user = await User.findOne({ username: testUsername });
      console.log(`Database state: loginAttempts = ${user?.loginAttempts}, lockUntil = ${user?.lockUntil}`);
      if (e.message === "Invalid username or password" && user?.loginAttempts === 1) {
        console.log("✅ Successfully allowed login attempt after lock expired and set attempts to 1!");
      } else {
        console.error("❌ Attempt counting did not restart correctly after lock expired!");
      }
    }

    // 7. Successful login resets lock/attempts
    console.log("\n--- Testing 7: Successful login resets attempts ---");
    const successRes2 = await authorize({
      username: testUsername,
      password: "CorrectPassword123"
    } as any, {} as any);
    
    if (successRes2) {
      const user = await User.findOne({ username: testUsername });
      console.log(`Database state: loginAttempts = ${user?.loginAttempts}, lockUntil = ${user?.lockUntil}`);
      if (user?.loginAttempts === 0 && !user?.lockUntil) {
        console.log("✅ Successfully reset attempts to 0 and cleared lockUntil!");
      } else {
        console.error("❌ Successful login failed to reset database state!");
      }
    }

  } catch (err) {
    console.error("Error during test run:", err);
  } finally {
    // Clean up
    await User.deleteOne({ username: testUsername });
    console.log("\n✅ Cleaned up temporary test user");
    process.exit(0);
  }
}

testLockout();

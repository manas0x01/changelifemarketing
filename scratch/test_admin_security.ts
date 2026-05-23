import dotenv from 'dotenv';
import path from 'path';

// Load environmental variables from .env.local
dotenv.config({ path: 'c:/Users/Manas/Desktop/changelifemarketing/.env.local' });

import { connectDB } from '../lib/database';
import User from '../models/User';
import ActivityLog from '../models/ActivityLog';
import { authOptions } from '../lib/auth';

const authorize = (authOptions.providers[0] as any).options.authorize;

async function testAdminSecurity() {
  console.log("Starting Admin security, 2FA and Activity Log verification tests...");
  
  await connectDB();
  
  const testAdminUsername = "testadmin_temp";
  
  // Clean up any existing test user & logs
  await User.deleteOne({ username: testAdminUsername });
  await ActivityLog.deleteMany({ username: testAdminUsername });
  
  // Create a clean admin user
  const adminUser = new User({
    username: testAdminUsername,
    password: "AdminCorrectPassword123",
    email: "admin-test@example.com",
    role: "admin",
    fullName: "Test Admin User"
  });
  
  await adminUser.save();
  console.log("✅ Created test admin user:", testAdminUsername);
  
  try {
    // 1. Initial login attempt without OTP
    console.log("\n--- Testing 1: Admin login attempt WITHOUT OTP ---");
    try {
      await authorize({
        username: testAdminUsername,
        password: "AdminCorrectPassword123"
      } as any, {
        headers: {
          "x-forwarded-for": "127.0.0.1",
          "user-agent": "Mozilla/5.0"
        }
      } as any);
      console.error("❌ Expected 2FA_REQUIRED error but login succeeded!");
    } catch (e: any) {
      console.log(`✅ Failed as expected. Error: "${e.message}"`);
      if (e.message === "2FA_REQUIRED") {
        console.log("✅ 2FA_REQUIRED error thrown correctly.");
      } else {
        console.error("❌ Unexpected error thrown:", e.message);
      }
    }
    
    // Check if OTP was saved to DB
    let adminInDb = await User.findOne({ username: testAdminUsername });
    console.log("Database state after first attempt:", {
      twoFactorOtp: adminInDb?.twoFactorOtp,
      twoFactorOtpExpires: adminInDb?.twoFactorOtpExpires
    });
    
    const savedOtp = adminInDb?.twoFactorOtp;
    if (savedOtp && savedOtp.length === 6) {
      console.log(`✅ Generated 6-digit OTP code successfully: ${savedOtp}`);
    } else {
      console.error("❌ Failed to generate valid 6-digit OTP!");
    }

    // Check if activity log for "2FA OTP Sent" was recorded
    let logs = await ActivityLog.find({ username: testAdminUsername }).sort({ timestamp: 1 });
    console.log("Recorded logs after step 1:");
    logs.forEach(log => {
      console.log(`- [${log.action}] IP: ${log.ipAddress}, Agent: ${log.userAgent}, Details: ${log.details}`);
    });
    if (logs.some(l => l.action === "2FA OTP Sent")) {
      console.log("✅ ActivityLog correctly registered '2FA OTP Sent' event.");
    } else {
      console.error("❌ ActivityLog missing '2FA OTP Sent' event!");
    }

    // 2. Login attempt with INVALID OTP
    console.log("\n--- Testing 2: Admin login attempt with INVALID OTP ---");
    try {
      await authorize({
        username: testAdminUsername,
        password: "AdminCorrectPassword123",
        otp: "111111" // wrong OTP
      } as any, {
        headers: {
          "x-forwarded-for": "127.0.0.1",
          "user-agent": "Mozilla/5.0"
        }
      } as any);
      console.error("❌ Expected invalid code error but login succeeded!");
    } catch (e: any) {
      console.log(`✅ Failed as expected. Error: "${e.message}"`);
      if (e.message === "Invalid or expired 2FA code.") {
        console.log("✅ Correct error thrown for invalid OTP.");
      } else {
        console.error("❌ Unexpected error for invalid OTP:", e.message);
      }
    }

    // Check logs for 2FA Failed
    logs = await ActivityLog.find({ username: testAdminUsername }).sort({ timestamp: 1 });
    console.log("Recorded logs after step 2:");
    logs.forEach(log => {
      console.log(`- [${log.action}] Details: ${log.details}`);
    });
    if (logs.some(l => l.action === "2FA Failed")) {
      console.log("✅ ActivityLog correctly registered '2FA Failed' event.");
    } else {
      console.error("❌ ActivityLog missing '2FA Failed' event!");
    }

    // 3. Login attempt with VALID OTP
    console.log("\n--- Testing 3: Admin login attempt with VALID OTP ---");
    const successRes = await authorize({
      username: testAdminUsername,
      password: "AdminCorrectPassword123",
      otp: savedOtp
    } as any, {
      headers: {
        "x-forwarded-for": "127.0.0.1",
        "user-agent": "Mozilla/5.0"
      }
    } as any);

    if (successRes) {
      console.log("✅ Successfully logged in admin using valid 2FA code!");
      console.log("Authorized session user fields:", {
        id: successRes.id,
        username: successRes.username,
        role: successRes.role
      });
    } else {
      console.error("❌ Failed to login admin even with valid 2FA code!");
    }

    // Check that OTP is cleared from database
    adminInDb = await User.findOne({ username: testAdminUsername });
    if (!adminInDb?.twoFactorOtp && !adminInDb?.twoFactorOtpExpires) {
      console.log("✅ OTP successfully cleared from database after login.");
    } else {
      console.error("❌ OTP was not cleared from database after successful login!");
    }

    // Check logs for successful Login (Admin)
    logs = await ActivityLog.find({ username: testAdminUsername }).sort({ timestamp: 1 });
    console.log("Recorded logs after step 3:");
    logs.forEach(log => {
      console.log(`- [${log.action}] Details: ${log.details}`);
    });
    if (logs.some(l => l.action === "Login (Admin)")) {
      console.log("✅ ActivityLog correctly registered 'Login (Admin)' event.");
    } else {
      console.error("❌ ActivityLog missing 'Login (Admin)' event!");
    }

  } catch (err) {
    console.error("Error during test run:", err);
  } finally {
    // Clean up
    await User.deleteOne({ username: testAdminUsername });
    await ActivityLog.deleteMany({ username: testAdminUsername });
    console.log("\n✅ Cleaned up temporary test admin user and logs");
    process.exit(0);
  }
}

testAdminSecurity();

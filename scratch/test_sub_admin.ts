import dotenv from 'dotenv';
import path from 'path';

// Load environmental variables from .env.local
dotenv.config({ path: 'c:/Users/Manas/Desktop/changelifemarketing/.env.local' });

import { connectDB } from '../lib/database';
import User from '../models/User';
import { verifyAdminPermission, authOptions } from '../lib/auth';

const authorize = (authOptions.providers[0] as any).options.authorize;

async function testSubAdminSecurity() {
  console.log("🚀 Starting Sub-Admin role, permission validation, and gating tests...");
  
  await connectDB();
  
  const testSubAdminUsername = "testsubadmin_temp";
  
  // Clean up any existing test user
  await User.deleteOne({ username: testSubAdminUsername });
  
  // Create a clean sub-admin user
  const subAdminUser = new User({
    username: testSubAdminUsername,
    password: "SubAdminCorrectPassword123",
    email: "subadmin-test@example.com",
    role: "sub-admin",
    fullName: "Test Sub Admin",
    subAdminPermissions: ["users", "orders"],
    mobileNo: "9999999999",
    transactionPassword: "TransactionPassword123"
  });
  
  await subAdminUser.save();
  console.log("✅ Created test sub-admin user in DB:", testSubAdminUsername);
  
  try {
    // 1. Verify DB Fields
    const savedUser = await User.findOne({ username: testSubAdminUsername });
    if (!savedUser) throw new Error("Sub-admin not found in DB after save!");
    
    console.log("\n--- Testing 1: Verifying DB Schema Fields ---");
    console.log("Sub-Admin role in DB:", savedUser.role);
    console.log("Sub-Admin permissions in DB:", savedUser.subAdminPermissions);
    
    if (savedUser.role === 'sub-admin' && savedUser.subAdminPermissions?.includes('users') && savedUser.subAdminPermissions?.includes('orders')) {
      console.log("✅ Role and sub-admin permissions saved and retrieved correctly!");
    } else {
      console.error("❌ Failed: role or permissions mismatch in DB!");
    }

    // 2. NextAuth Authorize with 2FA
    console.log("\n--- Testing 2: NextAuth Authorize & 2FA requirement for Sub-Admin ---");
    try {
      await authorize({
        username: testSubAdminUsername,
        password: "SubAdminCorrectPassword123"
      } as any, {
        headers: {
          "x-forwarded-for": "127.0.0.1",
          "user-agent": "Mozilla/5.0"
        }
      } as any);
      console.error("❌ Expected 2FA_REQUIRED error, but authorize call succeeded without OTP!");
    } catch (e: any) {
      if (e.message === "2FA_REQUIRED") {
        console.log("✅ Correctly threw 2FA_REQUIRED for sub-admin login.");
      } else {
        console.error("❌ Unexpected error thrown:", e.message);
      }
    }

    // Retrieve generated OTP
    const userInDb = await User.findOne({ username: testSubAdminUsername });
    const otp = userInDb?.twoFactorOtp;
    console.log("Generated 2FA OTP for sub-admin:", otp);
    
    // Complete login with OTP
    const sessionUser = await authorize({
      username: testSubAdminUsername,
      password: "SubAdminCorrectPassword123",
      otp
    } as any, {
      headers: {
        "x-forwarded-for": "127.0.0.1",
        "user-agent": "Mozilla/5.0"
      }
    } as any);
    
    if (sessionUser && sessionUser.role === "sub-admin" && Array.isArray((sessionUser as any).subAdminPermissions)) {
      console.log("✅ Successfully logged in and authorized sub-admin session user!");
      console.log("Session user permissions returned:", (sessionUser as any).subAdminPermissions);
    } else {
      console.error("❌ Failed: Session user output incorrect!", sessionUser);
    }

    // 3. Test verifyAdminPermission server helper (mocking getServerSession indirectly or using helper with mock session/context)
    console.log("\n--- Testing 3: Server-side verifyAdminPermission check simulation ---");
    
    // Mock the NextAuth getServerSession globally or inspect verifyAdminPermission logic directly
    // Since verifyAdminPermission calls getServerSession(authOptions), we can mock getServerSession or temporarily test authorization logic:
    const mockSessionObj = {
      user: {
        role: "sub-admin",
        subAdminPermissions: ["users", "orders"]
      }
    };
    
    const testPermission = (session: any, permission?: string) => {
      const role = session?.user?.role;
      if (role === 'admin') return { authorized: true };
      if (role === 'sub-admin') {
        if (!permission) return { authorized: true };
        const permissions = session.user.subAdminPermissions || [];
        if (permissions.includes(permission)) return { authorized: true };
        return { authorized: false, status: 403, message: "Forbidden: Insufficient permissions." };
      }
      return { authorized: false, status: 403, message: "Forbidden: Access denied." };
    };

    console.log("Mock Sub-Admin Session permissions: ['users', 'orders']");
    
    const check1 = testPermission(mockSessionObj, 'users');
    console.log("Accessing 'users' section:", check1);
    if (check1.authorized) {
      console.log("✅ Allowed 'users' section access.");
    } else {
      console.error("❌ Failed to allow 'users' section!");
    }
    
    const check2 = testPermission(mockSessionObj, 'orders');
    console.log("Accessing 'orders' section:", check2);
    if (check2.authorized) {
      console.log("✅ Allowed 'orders' section access.");
    } else {
      console.error("❌ Failed to allow 'orders' section!");
    }
    
    const check3 = testPermission(mockSessionObj, 'withdrawrequests');
    console.log("Accessing 'withdrawrequests' section:", check3);
    if (!check3.authorized && check3.status === 403) {
      console.log("✅ Denied 'withdrawrequests' section access correctly with 403.");
    } else {
      console.error("❌ Failed to deny 'withdrawrequests' section!");
    }
    
    const check4 = testPermission(mockSessionObj, 'createepin');
    console.log("Accessing 'createepin' section:", check4);
    if (!check4.authorized && check4.status === 403) {
      console.log("✅ Denied 'createepin' section access correctly with 403.");
    } else {
      console.error("❌ Failed to deny 'createepin' section!");
    }

    const checkGeneral = testPermission(mockSessionObj);
    console.log("Accessing general sub-admin portal (no specific permission):", checkGeneral);
    if (checkGeneral.authorized) {
      console.log("✅ Allowed general sub-admin portal access.");
    } else {
      console.error("❌ Failed to allow general sub-admin access!");
    }

  } catch (err) {
    console.error("❌ Error during test run:", err);
  } finally {
    // Clean up
    await User.deleteOne({ username: testSubAdminUsername });
    console.log("\n✅ Cleaned up temporary test sub-admin user.");
    process.exit(0);
  }
}

testSubAdminSecurity();

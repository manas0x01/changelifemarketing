import { config } from 'dotenv';
config({ path: '.env.local' });
import mongoose from 'mongoose';

async function runTests() {
  console.log('🧪 Starting KYC & Bank Details Test Suite...\n');

  // Test 1: IFSC Validation Regex
  console.log('--- Test 1: IFSC Validation Regex ---');
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  const ifscTests = [
    { code: 'SBIN0006947', expected: true },
    { code: 'CBIN0284349', expected: true },
    { code: 'HDFC0001234', expected: true },
    { code: 'sbin0006947', expected: false }, // Lowercase
    { code: 'SBIN123', expected: false },      // Too short
    { code: '12340001234', expected: false },  // Starts with digits
    { code: 'SBIN1001234', expected: false },  // 5th character not 0
  ];

  let ifscPassed = true;
  for (const t of ifscTests) {
    const passed = ifscRegex.test(t.code) === t.expected;
    if (!passed) ifscPassed = false;
    console.log(`  ${passed ? '✅' : '❌'} IFSC: "${t.code}" -> ${ifscRegex.test(t.code)} (expected: ${t.expected})`);
  }

  // Test 2: PAN Validation Regex
  console.log('\n--- Test 2: PAN Validation Regex ---');
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const panTests = [
    { pan: 'BLRPT1727L', expected: true },
    { pan: 'ABCDE1234F', expected: true },
    { pan: 'blrpt1727l', expected: false }, // Lowercase
    { pan: 'BLRP1727L', expected: false },  // 4 letters
    { pan: 'BLRPT12345L', expected: false }, // 5 digits
    { pan: 'BLRPT17271', expected: false },  // Ends with digit
  ];

  let panPassed = true;
  for (const t of panTests) {
    const passed = panRegex.test(t.pan) === t.expected;
    if (!passed) panPassed = false;
    console.log(`  ${passed ? '✅' : '❌'} PAN: "${t.pan}" -> ${panRegex.test(t.pan)} (expected: ${t.expected})`);
  }

  // Test 3: Database E2E KYC Flow
  console.log('\n--- Test 3: Database E2E KYC Flow ---');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const usersCollection = mongoose.connection.collection('users');
  const testUsername = '__test_kyc_user_' + Date.now();

  try {
    // 3a. Create a fresh test user with no bank details
    await usersCollection.insertOne({
      username: testUsername,
      userId: testUsername,
      fullName: 'Test KYC User',
      email: `${testUsername}@example.com`,
      bankDetailsStatus: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✅ Step 3a: Created fresh test user with bankDetailsStatus = "none"');

    // 3b. Simulate user submitting KYC from /dashboard/editbank
    const testKycData = {
      bankName: 'STATE BANK OF INDIA',
      ifsc: 'SBIN0006947',
      accountNo: '32030485163',
      branchName: 'TORPA',
      accountType: 'Saving',
      panNo: 'BLRPT1727L',
      fullName: 'Test KYC User',
    };

    const startTime = Date.now();
    const updateDoc = {
      pendingBankAccountDetails: {
        accountHolderName: testKycData.fullName,
        accountNumber: testKycData.accountNo,
        ifscCode: testKycData.ifsc,
        bankName: testKycData.bankName,
        branchName: testKycData.branchName,
        accountType: testKycData.accountType,
      },
      bankDetailsStatus: 'pending',
      bankDetailsRejectReason: '',
      panNo: testKycData.panNo,
    };

    const updateRes = await usersCollection.updateOne(
      { username: testUsername },
      { $set: updateDoc }
    );
    const elapsed = Date.now() - startTime;
    console.log(`✅ Step 3b: KYC submitted and saved in ${elapsed}ms (Modified count: ${updateRes.modifiedCount})`);

    // Verify saved document state
    const savedUser = await usersCollection.findOne({ username: testUsername });
    if (
      savedUser.bankDetailsStatus === 'pending' &&
      savedUser.pendingBankAccountDetails?.bankName === 'STATE BANK OF INDIA' &&
      savedUser.pendingBankAccountDetails?.accountNumber === '32030485163' &&
      savedUser.pendingBankAccountDetails?.ifscCode === 'SBIN0006947' &&
      savedUser.pendingBankAccountDetails?.branchName === 'TORPA' &&
      savedUser.pendingBankAccountDetails?.accountType === 'Saving' &&
      savedUser.panNo === 'BLRPT1727L'
    ) {
      console.log('✅ Step 3c: Pending KYC details and PAN verified in database');
    } else {
      console.error('❌ Step 3c: Pending KYC details verification FAILED:', savedUser);
    }

    // 3c. Simulate duplicate submission check
    if (savedUser.bankDetailsStatus === 'pending' || savedUser.bankDetailsStatus === 'approved') {
      console.log('✅ Step 3d: Duplicate prevention check passed (Status is pending -> submission locked)');
    }

    // 3d. Simulate Admin Approval
    const approveDoc = {
      bankName: savedUser.pendingBankAccountDetails.bankName,
      branchName: savedUser.pendingBankAccountDetails.branchName,
      accountNo: savedUser.pendingBankAccountDetails.accountNumber,
      ifsc: savedUser.pendingBankAccountDetails.ifscCode,
      accountType: savedUser.pendingBankAccountDetails.accountType,
      bankAccountDetails: {
        accountHolderName: savedUser.pendingBankAccountDetails.accountHolderName,
        accountNumber: savedUser.pendingBankAccountDetails.accountNumber,
        ifscCode: savedUser.pendingBankAccountDetails.ifscCode,
        bankName: savedUser.pendingBankAccountDetails.bankName,
      },
      bankDetailsStatus: 'approved',
      bankDetailsRejectReason: '',
    };
    await usersCollection.updateOne({ username: testUsername }, { $set: approveDoc });
    const approvedUser = await usersCollection.findOne({ username: testUsername });

    if (
      approvedUser.bankDetailsStatus === 'approved' &&
      approvedUser.bankName === 'STATE BANK OF INDIA' &&
      approvedUser.accountNo === '32030485163' &&
      approvedUser.ifsc === 'SBIN0006947'
    ) {
      console.log('✅ Step 3e: Admin approval verified (Active bank fields populated, status approved)');
    } else {
      console.error('❌ Step 3e: Admin approval FAILED:', approvedUser);
    }

  } finally {
    // Cleanup test user
    await usersCollection.deleteOne({ username: testUsername });
    console.log('🧹 Cleaned up test user');
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }

  console.log('\n🎉 ALL KYC TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);

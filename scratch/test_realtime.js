
const mongoose = require('mongoose');
const User = require('../models/User').default || require('../models/User');
const { updateTeamCounts } = require('../lib/teamUtils');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const rootId = 'RT_ROOT';
    const leftId = 'RT_LEFT';
    const rightId = 'RT_RIGHT';
    const password = 'change123';

    // 1. Setup
    await User.deleteMany({ username: { $regex: /RT_/ } });
    
    console.log('Creating users...');
    await new User({ username: rootId, userId: rootId, password, transactionPassword: password, isBooster: true, basicRank: 'Booster', registeredPackage: 'BASIC_PLAN', lastSessionType: 'morning', lastSessionDate: new Date() }).save();
    await new User({ username: leftId, userId: leftId, password, transactionPassword: password, placementId: rootId, placementPosition: 'left', isBooster: true, basicRank: 'Booster', registeredPackage: 'BASIC_PLAN' }).save();
    await new User({ username: rightId, userId: rightId, password, transactionPassword: password, placementId: rootId, placementPosition: 'right', isBooster: true, basicRank: 'Booster', registeredPackage: 'BASIC_PLAN' }).save();

    // 2. Add ONE pair under ROOT
    console.log('Adding 1 booster on Left side...');
    const b1 = 'RT_B1';
    await new User({ username: b1, userId: b1, password, placementId: leftId, placementPosition: 'left', isBooster: true }).save();
    await updateTeamCounts(leftId, 'left', 1);

    console.log('Adding 1 booster on Right side...');
    const b2 = 'RT_B2';
    await new User({ username: b2, userId: b2, password, placementId: rightId, placementPosition: 'right', isBooster: true }).save();
    await updateTeamCounts(rightId, 'right', 1);

    // 3. Check ROOT income
    const root = await User.findOne({ username: rootId });
    console.log(`ROOT Income: ₹${root.boosterMatchingIncome}`);
    console.log(`ROOT Carry Forward: L:${root.boosterPairsCarryForward.left}, R:${root.boosterPairsCarryForward.right}`);

    // 4. Add another 11 pairs (Total 12 pairs in this session)
    console.log('Adding 11 more pairs to test capping...');
    for (let i = 3; i <= 13; i++) {
      const uL = `RT_L_${i}`;
      const uR = `RT_R_${i}`;
      await new User({ username: uL, userId: uL, password, placementId: leftId, placementPosition: 'left', isBooster: true }).save();
      await updateTeamCounts(leftId, 'left', 1);
      await new User({ username: uR, userId: uR, password, placementId: rightId, placementPosition: 'right', isBooster: true }).save();
      await updateTeamCounts(rightId, 'right', 1);
    }

    const finalRoot = await User.findOne({ username: rootId });
    console.log(`FINAL ROOT Income: ₹${finalRoot.boosterMatchingIncome} (Expected 10000)`);
    console.log(`FINAL ROOT Records: ${finalRoot.boosterMatchingRecords.length}`);
    if (finalRoot.boosterMatchingRecords[0]) {
        const r = finalRoot.boosterMatchingRecords[0];
        console.log(`Record[0]: Matched=${r.pairsMatched}, Paid=${r.paidPairs}, Flashed=${r.flashedPairs}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

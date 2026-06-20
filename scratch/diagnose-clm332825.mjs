import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function diagnose() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  // Fetch the user
  const user = await users.findOne({ $or: [{ username: 'CLM332825' }, { userId: 'CLM332825' }] });

  if (!user) {
    console.log('❌ User CLM332825 not found!');
    process.exit(1);
  }

  console.log('\n===== USER BASIC INFO =====');
  console.log('Username:', user.username);
  console.log('UserId:', user.userId);
  console.log('Full Name:', user.fullName);
  console.log('isBooster:', user.isBooster);
  console.log('Joining Date:', user.joiningDate);
  console.log('Placement ID:', user.placementId);
  console.log('Placement Position:', user.placementPosition);
  console.log('Left Child:', user.leftChild);
  console.log('Right Child:', user.rightChild);
  console.log('Last Session Date:', user.lastSessionDate);
  console.log('Last Session Type:', user.lastSessionType);

  console.log('\n===== TEAM COUNTS =====');
  console.log('Total Team:', JSON.stringify(user.totalTeam));
  console.log('Session Team:', JSON.stringify(user.sessionTeam));
  console.log('Basic Pairs:', user.basicPairs);
  console.log('Basic Income:', user.basicIncome);

  console.log('\n===== SESSION BASED INCOME (Raw) =====');
  if (user.sessionBasedIncome && user.sessionBasedIncome.length > 0) {
    user.sessionBasedIncome.forEach((s, i) => {
      console.log(`  Session #${i + 1}:`, JSON.stringify({
        date: s.date || s.sessionDate,
        sessionType: s.sessionType,
        pairs: s.pairs,
        netIncome: s.netIncome,
        description: s.description,
        processed: s.processed
      }));
    });
  } else {
    console.log('  (none)');
  }

  console.log('\n===== BASIC INCOME RECORDS (Display) =====');
  if (user.basicIncomeRecords && user.basicIncomeRecords.length > 0) {
    user.basicIncomeRecords.forEach((r) => {
      console.log(`  #${r.srNo}:`, JSON.stringify({
        amount: r.amount,
        date: r.date,
        description: r.description,
        status: r.status
      }));
    });
  } else {
    console.log('  (none)');
  }

  // Now find ALL direct children placed under CLM332825
  console.log('\n===== DIRECT CHILDREN PLACED UNDER CLM332825 =====');
  const children = await users.find({ placementId: 'CLM332825' }).toArray();
  console.log('Total children placed under CLM332825:', children.length);
  children.forEach((c) => {
    console.log(`  ${c.username} | Position: ${c.placementPosition} | JoiningDate: ${c.joiningDate} | SessionType: ${c.lastSessionType} | CreatedAt: ${c.createdAt}`);
  });

  // Check the full downline (left and right branches)
  console.log('\n===== FULL DOWNLINE (graph lookup) =====');
  const downlineResult = await users.aggregate([
    { $match: { username: 'CLM332825' } },
    {
      $graphLookup: {
        from: 'users',
        startWith: '$username',
        connectFromField: 'username',
        connectToField: 'placementId',
        as: 'descendants',
        depthField: 'depth'
      }
    }
  ]).toArray();

  if (downlineResult.length > 0) {
    const descendants = downlineResult[0].descendants || [];
    console.log('Total descendants:', descendants.length);
    descendants.sort((a, b) => a.depth - b.depth).forEach((d) => {
      console.log(`  Depth ${d.depth}: ${d.username} | Position: ${d.placementPosition} | JoiningDate: ${d.joiningDate} | SessionType: ${d.lastSessionType} | CreatedAt: ${d.createdAt}`);
    });
  }

  // Key diagnosis: What was the sessionIndex for each income entry?
  console.log('\n===== SESSION INDEX ANALYSIS (CUT RULE) =====');
  console.log('Cut occurs at sessions: 3, 6, 9, 12');
  if (user.sessionBasedIncome) {
    user.sessionBasedIncome.forEach((s, i) => {
      const sessionIndex = i + 1;
      const cutLevels = [3, 6, 9, 12];
      const isCut = cutLevels.includes(sessionIndex);
      console.log(`  Session #${sessionIndex}: ${isCut ? '✂️ CUT SESSION' : '✅ Normal'} | Income: ₹${s.netIncome} | Pairs: ${s.pairs} | Date: ${s.date || s.sessionDate} | Type: ${s.sessionType}`);
    });
  }

  // CRITICAL: Check if there was a DUPLICATE session record for the same day/session
  console.log('\n===== DUPLICATE SESSION CHECK =====');
  if (user.sessionBasedIncome && user.sessionBasedIncome.length > 0) {
    const seen = new Map();
    let hasDuplicate = false;
    user.sessionBasedIncome.forEach((s, i) => {
      const dateStr = s.date || s.sessionDate;
      const key = `${new Date(dateStr).toDateString()}_${s.sessionType}`;
      if (seen.has(key)) {
        console.log(`  ⚠️ DUPLICATE DETECTED at index ${i} (session #${i+1}): ${key} already seen at index ${seen.get(key)}`);
        hasDuplicate = true;
      } else {
        seen.set(key, i);
      }
    });
    if (!hasDuplicate) {
      console.log('  ✅ No duplicates found');
    }
  }

  // CRITICAL: Check if sessionBasedIncome has entries with pairs=0/undefined (phantom sessions)
  console.log('\n===== PHANTOM/EMPTY SESSION CHECK =====');
  if (user.sessionBasedIncome && user.sessionBasedIncome.length > 0) {
    let hasPhantom = false;
    user.sessionBasedIncome.forEach((s, i) => {
      if (!s.pairs && !s.netIncome && !s.pairCount) {
        console.log(`  ⚠️ PHANTOM SESSION at index ${i} (session #${i+1}): pairs=${s.pairs}, netIncome=${s.netIncome}, date=${s.date || s.sessionDate}`);
        hasPhantom = true;
      }
    });
    if (!hasPhantom) {
      console.log('  ✅ No phantom sessions found');
    }
  }

  await mongoose.disconnect();
  console.log('\n✅ Done.');
}

diagnose().catch(e => { console.error(e); process.exit(1); });

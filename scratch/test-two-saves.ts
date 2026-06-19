import { connectDB } from '../lib/database';
import User from '../models/User';

async function run() {
  await connectDB();
  
  // 1. Reset user first
  console.log('Resetting user CLM949879...');
  await User.updateOne(
    { username: 'CLM949879' },
    {
      $set: {
        basicIncome: 0,
        basicPairs: 0,
        sessionBasedIncome: [],
        sessionTeam: { left: 0, right: 0 },
        lastSessionDate: null,
        lastSessionType: null
      }
    }
  );

  const user = await User.findOne({ username: 'CLM949879' });
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }

  // 2. Perform Save 1 (representing first load, Null -> current session)
  console.log('\n--- PERFORMING SAVE 1 ---');
  user.totalTeam = { left: 1, right: 1 };
  await user.save();
  console.log('Save 1 complete. basicIncome =', user.basicIncome, 'sessionTeam =', user.sessionTeam);

  // 3. Perform Save 2 (representing next session transition)
  console.log('\n--- PERFORMING SAVE 2 (with session change) ---');
  // Force session type to change to trigger the transition block
  user.lastSessionType = user.lastSessionType === 'evening' ? 'morning' : 'evening';
  await user.save();
  console.log('Save 2 complete. basicIncome =', user.basicIncome, 'sessionTeam =', user.sessionTeam);

  process.exit(0);
}

run();

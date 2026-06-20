import mongoose from 'mongoose';
import User from '../models/User';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function traceTree() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const root = await User.findOne({ username: 'CLM332825' });
  if (!root) {
    console.error('Root user CLM332825 not found');
    process.exit(1);
  }

  // Trace all descendants using graphLookup
  const result = await User.aggregate([
    { $match: { username: 'CLM332825' } },
    {
      $graphLookup: {
        from: 'users',
        startWith: '$username',
        connectFromField: 'username',
        connectToField: 'placementId',
        as: 'descendants'
      }
    }
  ]);

  const descendants = result[0]?.descendants || [];
  console.log(`Total descendants found under CLM332825: ${descendants.length}`);

  // We want to reconstruct the tree and path to classify them as Left or Right branch descendants of CLM332825
  const leftBranch = new Set<string>();
  const rightBranch = new Set<string>();

  if (root.leftChild) leftBranch.add(root.leftChild);
  if (root.rightChild) rightBranch.add(root.rightChild);

  // Keep resolving until no new members are added to branches
  let changed = true;
  while (changed) {
    changed = false;
    for (const d of descendants) {
      if (d.placementId) {
        if (leftBranch.has(d.placementId) && !leftBranch.has(d.username)) {
          leftBranch.add(d.username);
          changed = true;
        }
        if (rightBranch.has(d.placementId) && !rightBranch.has(d.username)) {
          rightBranch.add(d.username);
          changed = true;
        }
      }
    }
  }

  console.log(`\n--- LEFT BRANCH DESCENDANTS (${leftBranch.size}) ---`);
  for (const d of descendants) {
    if (leftBranch.has(d.username)) {
      console.log(`Username: ${d.username} | Name: ${d.fullName} | Placement: ${d.placementId} (${d.placementPosition}) | Sponsor: ${d.sponsorId} | joiningDate: ${d.joiningDate} | createdAt: ${d.createdAt}`);
    }
  }

  console.log(`\n--- RIGHT BRANCH DESCENDANTS (${rightBranch.size}) ---`);
  for (const d of descendants) {
    if (rightBranch.has(d.username)) {
      console.log(`Username: ${d.username} | Name: ${d.fullName} | Placement: ${d.placementId} (${d.placementPosition}) | Sponsor: ${d.sponsorId} | joiningDate: ${d.joiningDate} | createdAt: ${d.createdAt}`);
    }
  }

  await mongoose.disconnect();
}

traceTree().catch(err => {
  console.error(err);
  process.exit(1);
});

import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function checkDownline() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const users = db.collection('users');

  const root = await users.findOne({ username: 'CLM821812' });
  if (!root) {
    console.log('User not found');
    process.exit(1);
  }

  async function getSubtree(username) {
    const subtree = [];
    const queue = [username];
    while (queue.length > 0) {
      const current = queue.shift();
      const user = await users.findOne({ username: current });
      if (!user) continue;
      
      if (user.leftChild) {
        queue.push(user.leftChild);
        subtree.push({ username: user.leftChild, side: 'left', parent: current });
      }
      if (user.rightChild) {
        queue.push(user.rightChild);
        subtree.push({ username: user.rightChild, side: 'right', parent: current });
      }
    }
    return subtree;
  }

  let leftTree = [];
  if (root.leftChild) {
    leftTree = [{ username: root.leftChild, side: 'left', parent: root.username }];
    const sub = await getSubtree(root.leftChild);
    leftTree = leftTree.concat(sub);
  }

  let rightTree = [];
  if (root.rightChild) {
    rightTree = [{ username: root.rightChild, side: 'right', parent: root.username }];
    const sub = await getSubtree(root.rightChild);
    rightTree = rightTree.concat(sub);
  }

  const leftUsers = await users.find({ username: { $in: leftTree.map(u => u.username) } }).toArray();
  const rightUsers = await users.find({ username: { $in: rightTree.map(u => u.username) } }).toArray();

  const leftDates = leftUsers.map(u => ({ username: u.username, date: u.joiningDate })).sort((a,b) => a.date - b.date);
  const rightDates = rightUsers.map(u => ({ username: u.username, date: u.joiningDate })).sort((a,b) => a.date - b.date);

  console.log(`Left Tree Count: ${leftUsers.length}`);
  console.log(`Right Tree Count: ${rightUsers.length}`);

  function getSession(date) {
    const d = new Date(date);
    const tzOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(d.getTime() + tzOffset);
    const hour = ist.getUTCHours();
    return {
      dateStr: ist.toISOString().split('T')[0],
      type: hour < 12 ? 'morning' : 'evening'
    };
  }

  const sessions = {};
  for (const u of leftUsers) {
    if (!u.joiningDate) continue;
    const s = getSession(u.joiningDate);
    const key = `${s.dateStr}-${s.type}`;
    if (!sessions[key]) sessions[key] = { left: 0, right: 0 };
    sessions[key].left++;
  }
  for (const u of rightUsers) {
    if (!u.joiningDate) continue;
    const s = getSession(u.joiningDate);
    const key = `${s.dateStr}-${s.type}`;
    if (!sessions[key]) sessions[key] = { left: 0, right: 0 };
    sessions[key].right++;
  }

  console.log('\nSessions with joins:');
  let totalPairs = 0;
  for (const [key, data] of Object.entries(sessions)) {
    const pairs = Math.min(data.left, data.right);
    if (data.left > 0 || data.right > 0) {
      console.log(`${key}: Left=${data.left}, Right=${data.right} => Pairs matched in session: ${pairs}`);
    }
    if (pairs > 0) totalPairs++; // Max 1 pair per session
  }

  console.log(`\nTotal Matched Sessions (capped at 1 per session): ${totalPairs}`);

  await mongoose.disconnect();
}

checkDownline().catch(console.error);

import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function traceTree() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  const root = await users.findOne({ username: 'CLM332825' });
  if (!root) {
    console.log('User CLM332825 not found');
    process.exit(1);
  }

  // Recursive function to get full tree with sides relative to CLM332825
  async function buildTree(username, side = null) {
    const user = await users.findOne({ username });
    if (!user) return null;

    const left = user.leftChild ? await buildTree(user.leftChild, side || 'left') : null;
    const right = user.rightChild ? await buildTree(user.rightChild, side || 'right') : null;

    return {
      username: user.username,
      joiningDate: user.joiningDate,
      createdAt: user.createdAt,
      lastSessionDate: user.lastSessionDate,
      lastSessionType: user.lastSessionType,
      side,
      left,
      right
    };
  }

  const tree = {
    username: root.username,
    left: root.leftChild ? await buildTree(root.leftChild, 'left') : null,
    right: root.rightChild ? await buildTree(root.rightChild, 'right') : null
  };

  // Flatten the tree to a list of members with their relative side
  const members = [];
  function flatten(node) {
    if (!node) return;
    members.push({
      username: node.username,
      side: node.side,
      joiningDate: node.joiningDate,
      lastSessionType: node.lastSessionType,
      createdAt: node.createdAt,
      lastSessionDate: node.lastSessionDate
    });
    flatten(node.left);
    flatten(node.right);
  }
  flatten(tree.left);
  flatten(tree.right);

  console.log('\n===== MEMBERS AND THEIR SIDES =====');
  members.forEach(m => {
    console.log(`User: ${m.username} | Side: ${m.side?.toUpperCase()} | JoiningDate: ${m.joiningDate} | lastSessionType: ${m.lastSessionType} | CreatedAt: ${m.createdAt}`);
  });

  // Group members by session key: (date of creation/joining, session)
  const sessionGroups = {};
  members.forEach(m => {
    // Determine the actual session date and type when they joined
    const date = new Date(m.createdAt);
    const dateStr = date.toISOString().split('T')[0];
    const hour = date.getHours();
    const sessionType = hour < 12 ? 'morning' : 'evening';
    const key = `${dateStr}_${sessionType}`;

    if (!sessionGroups[key]) {
      sessionGroups[key] = { left: [], right: [] };
    }
    if (m.side === 'left') {
      sessionGroups[key].left.push(m.username);
    } else if (m.side === 'right') {
      sessionGroups[key].right.push(m.username);
    }
  });

  console.log('\n===== SESSIONS AND DETECTED PAIRS =====');
  Object.keys(sessionGroups).sort().forEach(key => {
    const group = sessionGroups[key];
    const pairs = Math.min(group.left.length, group.right.length);
    console.log(`Session ${key}:`);
    console.log(`  Left  (${group.left.length}):`, group.left.join(', '));
    console.log(`  Right (${group.right.length}):`, group.right.join(', '));
    console.log(`  Pairs: ${pairs}`);
  });

  await mongoose.disconnect();
}

traceTree().catch(e => { console.error(e); process.exit(1); });

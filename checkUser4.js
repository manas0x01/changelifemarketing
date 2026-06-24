const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({ userId: 'CLM507060' });
  if (!user) { process.exit(0); }
  const downline = await db.collection('users').find({ 'ancestors.username': user.username }).toArray();
  let left = 0; let right = 0;
  downline.forEach(d => {
     const anc = d.ancestors.find(a => a.username === user.username);
     if (anc) {
         if (anc.position.toLowerCase() === 'left') left++;
         else right++;
     }
  });
  console.log('Downline Left:', left, 'Right:', right);
  
  // also check if any cut session is in the DB
  const cuts = user.sessionBasedIncome.filter(s => s.netIncome === 0 && s.pairs > 0);
  console.log('Cut Sessions Found in DB:', cuts.length);
  
  // Let's create the cut session manually if it's missing (3 pairs!)
  if (Math.min(left, right) >= 3 && user.basicPairs < 3) {
      console.log('User has >=3 pairs but basicPairs is', user.basicPairs, '- MISSING CUT!');
  }
  
  process.exit(0);
}
run().catch(console.error);

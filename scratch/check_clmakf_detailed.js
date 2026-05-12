
const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0";

async function checkClmakfRecords() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const user = await User.findOne({ username: "CLMAKF" });
  
  console.log(`User: ${user.username}`);
  console.log(`Basic Pairs: ${user.basicPairs}`);
  console.log(`Basic Income: ${user.basicIncome}`);
  
  console.log("\n--- sessionBasedIncome (Detailed) ---");
  user.sessionBasedIncome.forEach((s, i) => {
    console.log(`${i+1}. Date: ${s.date}, Session: ${s.sessionType}, Net: ${s.netIncome}, Pairs: ${s.pairs}, Desc: ${s.description}`);
  });

  process.exit(0);
}
checkClmakfRecords();

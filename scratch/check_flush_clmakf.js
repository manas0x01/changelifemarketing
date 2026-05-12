
const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0";

async function checkUserFlushHistory() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const user = await User.findOne({ username: "CLMAKF" });
  
  console.log(`User: ${user.username}`);
  console.log(`Total Income: ${user.totalIncome}`);
  
  console.log("\n--- basicFlushHistory ---");
  if (user.basicFlushHistory && user.basicFlushHistory.length > 0) {
    user.basicFlushHistory.forEach((h, i) => {
      console.log(`${i+1}. Date: ${h.date}, Reason: ${h.reason}, Left: ${h.left}, Right: ${h.right}`);
    });
  } else {
    console.log("No flush history.");
  }

  console.log("\n--- sessionBasedIncome ---");
  if (user.sessionBasedIncome && user.sessionBasedIncome.length > 0) {
    user.sessionBasedIncome.forEach((s, i) => {
      console.log(`${i+1}. Date: ${s.date}, Session: ${s.sessionType}, Net: ${s.netIncome}`);
    });
  }

  process.exit(0);
}
checkUserFlushHistory();

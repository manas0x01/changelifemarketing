
const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0";

async function checkFlushHistory() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const user = await User.findOne({ username: "CLMPP" });
  
  console.log(`User: ${user.username}`);
  console.log("\n--- basicFlushHistory (Today) ---");
  if (user.basicFlushHistory) {
    user.basicFlushHistory.forEach((h, i) => {
      if (new Date(h.date).toDateString() === new Date("2026-05-12").toDateString()) {
        console.log(`${i+1}. Date: ${h.date}, Reason: ${h.reason}`);
      }
    });
  }
  process.exit(0);
}
checkFlushHistory();

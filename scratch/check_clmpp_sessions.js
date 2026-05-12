
const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0";

async function checkPioneer() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const user = await User.findOne({ username: "CLMPP" });
  
  console.log(`User: ${user.username}`);
  console.log("\n--- sessionBasedIncome ---");
  user.sessionBasedIncome.forEach((s, i) => {
    if (new Date(s.date).toDateString() === new Date("2026-05-12").toDateString()) {
        console.log(`${i+1}. Date: ${s.date}, Session: ${s.sessionType}, Net: ${s.netIncome}`);
    }
  });
  process.exit(0);
}
checkPioneer();

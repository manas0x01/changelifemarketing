
const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0";

async function checkAllTransitions() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const users = await User.find({ "sessionBasedIncome.date": { $gte: new Date("2026-05-12T00:00:00Z") } });
  
  const allTimestamps = [];
  users.forEach(u => {
    u.sessionBasedIncome.forEach(s => {
      if (new Date(s.date).toDateString() === new Date("2026-05-12").toDateString()) {
        allTimestamps.push({
          user: u.username,
          date: new Date(s.date),
          session: s.sessionType,
          net: s.netIncome
        });
      }
    });
  });

  // Sort by date
  allTimestamps.sort((a, b) => a.date - b.date);

  console.log("All session income events today:");
  allTimestamps.forEach(t => {
    console.log(`${t.date.toLocaleTimeString()} | ${t.session} | ${t.user} | Net: ${t.net}`);
  });

  process.exit(0);
}
checkAllTransitions();

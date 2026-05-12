
const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0";

async function checkAllUsers() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const users = await User.find({ "sessionBasedIncome.date": { $gte: new Date("2026-05-12T00:00:00Z") } });
  
  console.log(`Checking ${users.length} users with activity today...`);
  users.forEach(u => {
    const todayRecords = u.sessionBasedIncome.filter(s => new Date(s.date).toDateString() === new Date("2026-05-12").toDateString());
    if (todayRecords.length >= 2) {
      console.log(`User: ${u.username} - Records: ${todayRecords.length}`);
      todayRecords.forEach(r => console.log(`  - ${r.date} | ${r.sessionType} | Net: ${r.netIncome}`));
    }
  });
  process.exit(0);
}
checkAllUsers();

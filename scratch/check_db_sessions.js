
const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0";

async function checkCollections() {
  await mongoose.connect(MONGODB_URI);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));
  
  // Check if there is a 'sessions' collection
  const Session = mongoose.model('Session', new mongoose.Schema({}, { strict: false }), 'sessions');
  const sessions = await Session.find({}).sort({ createdAt: -1 }).limit(10);
  console.log("\n--- Recent Sessions (from 'sessions' collection if exists) ---");
  console.log(sessions);

  process.exit(0);
}
checkCollections();

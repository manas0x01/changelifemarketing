
const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0";

async function checkDownline() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const downline = await User.find({ placementId: "CLMAKF" }).sort({ createdAt: 1 });
  console.log(`Downline of CLMAKF: ${downline.length} members`);
  downline.forEach(u => {
    console.log(`- ${u.username} | ${u.fullName} | Created: ${u.createdAt} | Pos: ${u.placementPosition}`);
  });

  // Check their descendants too
  const allDescendants = await User.aggregate([
    { $match: { username: "CLMAKF" } },
    {
      $graphLookup: {
        from: "users",
        startWith: "$username",
        connectFromField: "username",
        connectToField: "placementId",
        as: "descendants"
      }
    }
  ]);
  
  const descendants = allDescendants[0].descendants;
  console.log(`\nTotal Descendants: ${descendants.length}`);
  descendants.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  descendants.forEach(u => {
    console.log(`- ${u.username} | Created: ${u.createdAt} | Pos: ${u.placementPosition} | PlacementId: ${u.placementId}`);
  });

  process.exit(0);
}
checkDownline();

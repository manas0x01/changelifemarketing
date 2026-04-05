const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function checkDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✓ Connected to MongoDB Atlas');

    const db = client.db('changelifemarketing');

    // ===== CHECK USERS COLLECTION =====
    console.log('\n📋 === USERS COLLECTION ===');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ username: 'CLM674643' });

    if (!user) {
      console.log('❌ User CLM674643 not found');
      return;
    }

    console.log(`✓ Found user: ${user.fullName || user.username}`);
    console.log(`\n📌 User Details:`);
    console.log(`   _id (MongoDB): ${user._id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Full Name: ${user.fullName}`);
    console.log(`   Has Transaction Password: ${!!user.transactionPassword}`);
    
    console.log(`\n💾 E-Pins (${user.ePins?.length || 0} total):`);
    if (!user.ePins || user.ePins.length === 0) {
      console.log('   ❌ No E-pins found');
    } else {
      user.ePins.forEach((pin, idx) => {
        console.log(`   [${idx + 1}] ${pin.pin} - ${pin.packageName} (Used: ${pin.usedDate ? '✓' : '✗'})`);
      });
    }

    // ===== CHECK SESSIONS COLLECTION =====
    console.log('\n\n📋 === SESSIONS COLLECTION ===');
    const sessionsCollection = db.collection('sessions');
    const sessions = await sessionsCollection.find({ userId: user._id.toString() }).toArray();
    
    console.log(`Found ${sessions.length} active session(s) for this user:`);
    sessions.forEach((sess, idx) => {
      console.log(`\n   Session ${idx + 1}:`);
      console.log(`   - sessionToken: ${sess.sessionToken?.substring(0, 20)}...`);
      console.log(`   - expires: ${new Date(sess.expires).toLocaleString()}`);
    });

    // ===== CHECK ACCOUNTS COLLECTION =====
    console.log('\n\n📋 === ACCOUNTS COLLECTION ===');
    const accountsCollection = db.collection('accounts');
    const account = await accountsCollection.findOne({ userId: user._id.toString() });
    
    if (account) {
      console.log('✓ Account found:');
      console.log(`   - type: ${account.type}`);
      console.log(`   - provider: ${account.provider}`);
    } else {
      console.log('❌ No account found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✓ Database connection closed');
  }
}

checkDatabase();

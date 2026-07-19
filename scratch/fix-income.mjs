import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';

async function fixIncome() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('changelifemarketing');
    const users = db.collection('users');

    const u = await users.findOne({ username: 'CLM114511' });
    if (u) {
      // If already fixed, skip
      if (u.basicIncome >= 2000) {
        console.log('✅ Already fixed (basicIncome >= 2000)');
        return;
      }

      u.basicIncome = (u.basicIncome || 0) + 1000;
      u.totalIncome = (u.totalIncome || 0) + 1000;
      u.basicPairs = (u.basicPairs || 0) + 1;
      
      const newSession = {
        date: '2026-07-19',
        sessionDate: new Date('2026-07-19T06:00:00Z'), // ~11:30 AM IST
        sessionType: 'morning',
        pairs: 1,
        grossIncome: 1000,
        netIncome: 1000,
        description: 'Binary Income'
      };
      
      u.sessionBasedIncome = u.sessionBasedIncome || [];
      u.sessionBasedIncome.push(newSession);
      
      u.basicIncomeRecords = u.basicIncomeRecords || [];
      u.basicIncomeRecords.push({
        srNo: u.sessionBasedIncome.length,
        amount: 1000,
        pairCount: 1,
        date: '2026-07-19',
        description: 'Binary Income',
        status: 'Completed'
      });
      
      await users.updateOne({ username: 'CLM114511' }, { 
        $set: { 
          basicIncome: u.basicIncome, 
          totalIncome: u.totalIncome, 
          basicPairs: u.basicPairs,
          sessionBasedIncome: u.sessionBasedIncome,
          basicIncomeRecords: u.basicIncomeRecords
        }
      });
      console.log('✅ Corrected income for CLM114511: Added 1000 for 19th July Morning session.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

fixIncome();

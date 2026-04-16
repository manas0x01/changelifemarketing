import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { connectDB } from "@/lib/database";

interface BoosterCountingRow {
  srNo: number;
  rbv: number;
  lbv: number;
  rCarry: number;
  lCarry: number;
  matching: number;
  date: string;
  fromMemberId: string;
  product: string;
  description: string;
}

export async function GET(req: Request) {
  try {
    console.log('\n📊 [BOOSTER-COUNTING-RECORDS] GET request received');
    
    console.log('  🔐 Retrieving server session...');
    const session = await getServerSession(authOptions);
    console.log(`  ${session ? '✅' : '❌'} Session found: ${session ? 'Yes' : 'No'}`);

    if (!session?.user?.username) {
      console.error('  ❌ NOT AUTHENTICATED - No session or username');
      return Response.json({ 
        success: false,
        error: "Not authenticated",
        data: []
      }, { status: 401 });
    }
    console.log(`  ✅ Username from session: "${session.user.username}"`);

    console.log('  📂 Connecting to MongoDB...');
    await connectDB();
    console.log('  ✅ Database connected');

    console.log(`  👤 Querying user data for username: "${session.user.username}"...`);
    const user = await User.findOne({ username: session.user.username }).select("boosterCounting");
    console.log(`  ${user ? '✅' : '❌'} User lookup result: ${user ? 'Found' : 'Not found'}`);

    if (!user) {
      console.error('  ❌ User not found - Returning 404');
      return Response.json({ 
        success: false,
        error: "User not found",
        data: []
      }, { status: 404 });
    }

    console.log('  📋 Extracting booster counting records...');
    // ✅ Use actual boosterCounting records from database, not mock data
    const records = (user.boosterCounting || []);
    console.log(`    - Raw records count: ${records.length}`);

    console.log('  🔄 Formatting records with date conversion (to DD/MM/YYYY)...');
    // ✅ Format records with proper date format (DD/MM/YYYY for consistency)
    const boosterCountingRecords: BoosterCountingRow[] = records.map((record: any, idx: number) => {
      const formattedDate = record.date ? new Date(record.date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }) : '--';
      
      const formatted = {
        srNo: record.srNo || 0,
        rbv: record.RBV || 0,
        lbv: record.LBV || 0,
        rCarry: record.RCarry || 0,
        lCarry: record.LCarry || 0,
        matching: record.matching || 0,
        date: formattedDate,
        fromMemberId: record.fromMemberId || 'N/A',
        product: record.product || 'N/A',
        description: record.description || 'Booster Counting'
      };
      
      console.log(`    📌 Record ${idx + 1}: SrNo=${formatted.srNo}, RBV=${formatted.rbv}, LBV=${formatted.lbv}, Matching=${formatted.matching}, Date=${formatted.date}`);
      return formatted;
    });
    console.log(`  ✅ All records formatted: ${boosterCountingRecords.length} records`);

    console.log('  📤 Preparing response...');
    const responseData = {
      success: true, 
      data: boosterCountingRecords,
      totalRecords: boosterCountingRecords.length,
      message: boosterCountingRecords.length === 0 ? "No booster counting records found" : "Records fetched successfully"
    };
    
    console.log(`  ✅ Response ready:`);
    console.log(`    - Success: ${responseData.success}`);
    console.log(`    - Total records: ${responseData.totalRecords}`);
    console.log(`    - Message: ${responseData.message}`);
    console.log(`  ✅ Returning success response\n`);
    
    return Response.json(responseData);
  } catch (error) {
    console.error(`  💥 ERROR caught in try-catch`);
    console.error(`    - Error type: ${error instanceof Error ? error.name : typeof error}`);
    console.error(`    - Error message: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`  ❌ Returning 500 error response\n`);
    
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error fetching booster counting records",
        data: []
      },
      { status: 500 }
    );
  }
}

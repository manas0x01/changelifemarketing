import { connectDB } from "@/lib/database";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionPassword } = await req.json();

    await connectDB();

    // Get current user
    const user = await User.findById(session.user.id).select("+transactionPassword");
    
    console.log("🔍 Verify Transaction Password Debug:");
    console.log(`   Session User ID: ${session.user.id}`);
    console.log(`   Session Username: ${session.user.username}`);
    console.log(`   Found User: ${user?.username || 'NOT FOUND'}`);
    console.log(`   Available Pins: ${user?.ePins?.length || 0}`);
    
    if (!user) {
      console.log("❌ User not found in database");
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Verify transaction password
    const isPasswordValid = await user.compareTransactionPassword(transactionPassword);
    if (!isPasswordValid) {
      console.log("❌ Invalid transaction password");
      return Response.json({ 
        error: "Invalid transaction password",
        verified: false 
      }, { status: 400 });
    }

    // Check available E-Pins
    const availablePins = user.ePins?.filter((pin: any) => !pin.usedDate) || [];
    
    console.log(`✓ Transaction password verified`);
    console.log(`✓ Available pins: ${availablePins.length}`);
    
    if (availablePins.length === 0) {
      console.log("❌ No pins available");
      return Response.json({ 
        error: "No PIN available. First Buy The PIN",
        verified: false,
        pinsAvailable: false
      }, { status: 400 });
    }

    return Response.json({ 
      success: true,
      verified: true,
      pinsAvailable: true,
      availablePinsCount: availablePins.length,
      pins: availablePins.map((pin: any) => ({
        pin: pin.pin,
        packageName: pin.packageName
      }))
    });

  } catch (error) {
    console.error("Transaction verification error:", error);
    return Response.json({ 
      error: "An error occurred during verification" 
    }, { status: 500 });
  }
}

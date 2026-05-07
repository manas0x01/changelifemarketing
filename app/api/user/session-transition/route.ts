import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";
import { calculateBasicIncome } from "@/lib/calculateBasicIncome";
import { calculateBoosterIncome } from "@/lib/calculateBoosterIncome";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if current time is during transition period (11:50 - 12:00)
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const isTransitionPeriod = (currentHour === 11 && currentMinute >= 50) || 
                                (currentHour === 23 && currentMinute >= 50);
    
    const force = req.nextUrl.searchParams.get("force") === "true";

    if (!isTransitionPeriod && !force) {
      return NextResponse.json(
        { success: false, error: "Session transition can only be processed during 11:50-12:00 period. Use ?force=true to override." },
        { status: 400 }
      );
    }

    await connectDB();

    // Determine current session type based on 12 AM / 12 PM boundaries
    const currentSessionType: "morning" | "evening" = currentHour < 12 ? "morning" : "evening";
    const nextSessionType: "morning" | "evening" = currentSessionType === "morning" ? "evening" : "morning";

    console.log(`[SESSION TRANSITION] Processing transition from ${currentSessionType} to ${nextSessionType} (Time: ${currentHour}:${currentMinute})`);

    // Get all users
    const users = await User.find({});

    let totalUsersProcessed = 0;
    let totalIncomeAdded = 0;
    let totalPairsFlushed = 0;

    for (const user of users) {
      console.log(`[SESSION TRANSITION] Processing user: ${user.username} (${user.isBooster ? 'Booster' : 'Basic'})`);
      
      if (user.isBooster) {
        // BOOSTER LOGIC: Per-pair matching with Carry-Forward
        // Note: calculateBoosterIncome handles income, wallet update, and carry-forward calculation
        const boosterResult = await calculateBoosterIncome(user, currentSessionType);
        if (boosterResult.success) {
          totalIncomeAdded += boosterResult.income || 0;
          console.log(`[SESSION TRANSITION] Booster ${user.username} earned ₹${boosterResult.income}`);
        }
      } else {
        // BASIC LOGIC: 1 pair per session with Flush-Out
        await calculateBasicIncome(user, currentSessionType);
        
        // Note: TotalTeam is a lifetime count and should NOT be flushed.
        // SessionTeam is the one that resets (flashes out) at the end of the session.
        console.log(`[SESSION TRANSITION] Basic ${user.username}: Income processed for ${currentSessionType}`);
      }

      // Reset session team counts for everyone
      user.sessionTeam = { left: 0, right: 0 };
      user.lastSessionType = nextSessionType;
      user.lastSessionDate = new Date();

      await user.save();
      totalUsersProcessed++;
    }

    console.log(`[SESSION TRANSITION] Completed: ${totalUsersProcessed} users, ₹${totalIncomeAdded} income added, ${totalPairsFlushed} pairs flushed`);

    return NextResponse.json({
      success: true,
      message: "Session transition completed successfully",
      summary: {
        usersProcessed: totalUsersProcessed,
        totalIncomeAdded: totalIncomeAdded,
        totalPairsFlushed: totalPairsFlushed,
        fromSession: currentSessionType,
        toSession: nextSessionType,
      },
    });

  } catch (error: any) {
    console.error("Error processing session transition:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process session transition" },
      { status: 500 }
    );
  }
}

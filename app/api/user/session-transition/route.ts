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

    // Check if current time is during transition period (12:00 - 12:10 IST)
    const now = new Date();
    const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const istHour = istDate.getUTCHours();
    const istMinute = istDate.getUTCMinutes();
    
    const isTransitionPeriod = (istHour === 12 && istMinute >= 0 && istMinute < 10) || 
                                (istHour === 0 && istMinute >= 0 && istMinute < 10);
    
    const force = req.nextUrl.searchParams.get("force") === "true";

    if (!isTransitionPeriod && !force) {
      return NextResponse.json(
        { success: false, error: "Session transition can only be processed during 12:00-12:10 period. Use ?force=true to override." },
        { status: 400 }
      );
    }

    await connectDB();

    // Determine session type to process: 
    // If it's 12 PM (hour 12 IST), we process the session that just finished: "morning"
    // If it's 12 AM (hour 0 IST), we process the session that just finished: "evening"
    // For anything between 1 AM and 11 AM, we assume it's a delayed "evening" transition for YESTERDAY
    // For anything between 1 PM and 11 PM, we assume it's a delayed "morning" transition for TODAY
    const sessionToProcess: "morning" | "evening" = (istHour >= 0 && istHour < 12) ? "evening" : "morning";
    const nextSessionType: "morning" | "evening" = sessionToProcess === "morning" ? "evening" : "morning";

    console.log(`[SESSION TRANSITION] Processing ${sessionToProcess} session (Time IST: ${istHour}:${istMinute})`);

    // Get all users
    const users = await User.find({});

    let totalUsersProcessed = 0;
    let totalIncomeAdded = 0;
    let totalPairsFlushed = 0;

    const sessionDate = new Date();
    // If we are processing "evening" session during early morning hours (0-11 AM IST), it belongs to YESTERDAY
    if (sessionToProcess === "evening" && istHour < 12) {
      sessionDate.setDate(sessionDate.getDate() - 1);
    }

    for (const user of users) {
      console.log(`[SESSION TRANSITION] Processing user: ${user.username} (${user.isBooster ? 'Booster' : 'Basic'})`);
      
      if (user.isBooster) {
        // BOOSTER LOGIC: Per-pair matching with Carry-Forward
        const boosterResult = await calculateBoosterIncome(user, sessionToProcess, sessionDate);
        if (boosterResult.success) {
          totalIncomeAdded += boosterResult.income || 0;
          console.log(`[SESSION TRANSITION] Booster ${user.username} earned ₹${boosterResult.income}`);
        }
      } else {
        // BASIC LOGIC: 1 pair per session with Flush-Out
        await calculateBasicIncome(user, sessionToProcess, sessionDate);
        
        // Note: TotalTeam is a lifetime count and should NOT be flushed.
        // SessionTeam is the one that resets (flashes out) at the end of the session.
        console.log(`[SESSION TRANSITION] Basic ${user.username}: Income processed for ${sessionToProcess} on ${sessionDate.toDateString()}`);
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
        fromSession: sessionToProcess,
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

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

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
    
    if (!isTransitionPeriod) {
      return NextResponse.json(
        { success: false, error: "Session transition can only be processed during 11:50-12:00 period" },
        { status: 400 }
      );
    }

    await connectDB();

    // Determine current session type
    const currentSessionType: "morning" | "evening" = currentHour < 12 ? "morning" : "evening";
    const nextSessionType: "morning" | "evening" = currentSessionType === "morning" ? "evening" : "morning";

    console.log(`[SESSION TRANSITION] Processing transition from ${currentSessionType} to ${nextSessionType}`);

    // Get all users
    const users = await User.find({});

    let totalUsersProcessed = 0;
    let totalIncomeAdded = 0;
    let totalPairsFlushed = 0;

    for (const user of users) {
      let userIncomeAdded = 0;
      let userPairsFlushed = 0;

      // Get session-based income records for current session
      const sessionIncomeRecords = user.sessionBasedIncome?.filter(
        (record: any) => record.sessionType === currentSessionType
      ) || [];

      // Add income for completed pairs in this session
      for (const record of sessionIncomeRecords) {
        if (record.status === "Completed") {
          const incomeAmount = record.netIncome || 1000;
          
          // Add to basic income
          user.basicIncome = (user.basicIncome || 0) + incomeAmount;
          
          // Add to basic income records
          const incomeRecord = {
            srNo: (user.basicIncomeRecords?.length || 0) + 1,
            amount: incomeAmount,
            pairCount: record.pairs || 1,
            date: new Date(),
            description: `Pair completed in ${currentSessionType} session`,
            status: "Paid",
          };
          
          user.basicIncomeRecords = user.basicIncomeRecords || [];
          user.basicIncomeRecords.push(incomeRecord);
          
          // Add to total income
          user.totalIncome = (user.totalIncome || 0) + incomeAmount;
          
          userIncomeAdded += incomeAmount;
          console.log(`[SESSION TRANSITION] Added ₹${incomeAmount} to user ${user.userId} for completed pairs`);
        }
      }

      // Flush out unpaired pairs from current session
      const leftPairs = user.totalTeam?.left || 0;
      const rightPairs = user.totalTeam?.right || 0;
      
      if (leftPairs !== rightPairs) {
        const pairsToFlush = Math.abs(leftPairs - rightPairs);
        const sideToFlush = leftPairs > rightPairs ? "left" : "right";
        
        // Update flush history
        const flushRecord = {
          date: new Date(),
          left: leftPairs,
          right: rightPairs,
          reason: `Unpaired ${sideToFlush} positions flushed during ${currentSessionType} to ${nextSessionType} transition`,
        };
        
        user.basicFlushHistory = user.basicFlushHistory || [];
        user.basicFlushHistory.push(flushRecord);
        
        // Reset the unpaired side
        if (sideToFlush === "left") {
          user.totalTeam = user.totalTeam || { left: 0, right: 0 };
          user.totalTeam.left = rightPairs;
        } else {
          user.totalTeam = user.totalTeam || { left: 0, right: 0 };
          user.totalTeam.right = leftPairs;
        }
        
        userPairsFlushed = pairsToFlush;
        console.log(`[SESSION TRANSITION] Flushed ${pairsToFlush} unpaired ${sideToFlush} pairs for user ${user.userId}`);
      }

      // Update last session info
      user.lastSessionType = nextSessionType;
      user.lastSessionDate = new Date();

      // Clear session-based income records for the current session
      if (user.sessionBasedIncome) {
        user.sessionBasedIncome = user.sessionBasedIncome.filter(
          (record: any) => record.sessionType !== currentSessionType
        );
      }

      await user.save();

      totalUsersProcessed++;
      totalIncomeAdded += userIncomeAdded;
      totalPairsFlushed += userPairsFlushed;
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

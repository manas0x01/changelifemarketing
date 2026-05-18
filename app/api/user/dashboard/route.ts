import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { connectDB } from "../../../../lib/database";
import User from "../../../../models/User";
import { calculateBasicIncome } from "../../../../lib/calculateBasicIncome";
import { countDetailedTree } from "../../../../lib/teamUtils";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('[DASHBOARD] session.user:', { username: session?.user?.username ?? null, id: session?.user?.id ?? session?.user?.userId ?? null });
    if (!session?.user?.username) {
      console.log('[DASHBOARD] unauthorized - no session user');
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    await connectDB();
    console.log('[DASHBOARD] DB connected');
    const user = await User.findOne({ username: session.user.username });
    if (!user) {
      console.log('[DASHBOARD] user not found for username:', session.user.username);
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    console.log('[DASHBOARD] db user found:', { username: user.username, userId: user.userId });
    console.log('[DASHBOARD DEBUG] sessionBasedIncome:', JSON.stringify(user.sessionBasedIncome, null, 2));
    
    // 1. RECURSIVE SYNC: Count entire tree depth and trigger self-healing
    const detailedStats = await countDetailedTree(user);
    console.log(`[DASHBOARD SYNC] ${user.username} Detailed Tree Stats:`, detailedStats);

    try {
      user.totalTeam = {
        left: detailedStats.leftTotal,
        right: detailedStats.rightTotal
      };
      // Explicitly saving triggers the "Self-Healing" pre-save hook in User.ts
      await user.save();
    } catch (saveError) {
      console.log('[DASHBOARD SYNC] Concurrent save detected, skipping manual save');
    }

    // 2. ALLOCATION ENGINE: No longer needed here as basicIncome is event-driven
    // Self-healing is handled by the pre-save hook in User.ts.

    console.log('[DASHBOARD] After sync - basicIncome:', user.basicIncome);
    
    const totalTeam = {
      left: (user.totalTeam && typeof user.totalTeam.left === 'number') ? user.totalTeam.left : 0,
      right: (user.totalTeam && typeof user.totalTeam.right === 'number') ? user.totalTeam.right : 0,
    };
    // Calculate Total and Active Direct Stats (Left/Right)
    const { totalDirect, totalActiveDirect } = await (async () => {
      const stats = {
        totalDirect: { left: 0, right: 0 },
        totalActiveDirect: { left: 0, right: 0 }
      };

      if (Array.isArray(user.directMembers) && user.directMembers.length > 0) {
        const directIds = user.directMembers.map((m: any) => m.memberId);
        const directDocs = await User.find({ 
          $or: [{ userId: { $in: directIds } }, { username: { $in: directIds } }] 
        });
        
        user.directMembers.forEach((m: any) => {
          const isLeft = (m.position || '').toLowerCase() === 'left';
          const isRight = (m.position || '').toLowerCase() === 'right';
          
          if (isLeft) stats.totalDirect.left++;
          else if (isRight) stats.totalDirect.right++;

          const doc = directDocs.find(d => d.username === m.memberId || d.userId === m.memberId);
          const isActive = doc && (doc.registeredPackage || doc.joiningDate);
          
          if (isActive) {
            if (isLeft) stats.totalActiveDirect.left++;
            else if (isRight) stats.totalActiveDirect.right++;
          }
        });
      }
      return stats;
    })();
    
    // Use the pre-calculated basicIncome from the User model
    // The pre-save hook in User.ts correctly calculates this from basicIncomeRecords
    const basicIncome = user.basicIncome || 0;
    
    console.log('[DASHBOARD] basicIncome from user model:', basicIncome);
    
    // Booster Income Logic
    const boosterMatchingIncome = user.boosterMatchingIncome || 0;
    const boosterCarryForward = user.boosterPairsCarryForward || { left: 0, right: 0 };
    
    const boosterIncome = {
      amount: boosterMatchingIncome,
      carryForward: boosterCarryForward,
      isBooster: user.isBooster || false,
      totalMatching: (user.boosterMatchingRecords || []).reduce((acc: number, curr: any) => acc + (Number(curr.paidPairs || curr.pairs) || 0), 0),
      LG: user.boosterCount?.left || 0,
      RG: user.boosterCount?.right || 0,
    };

    const totalIncome = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);

    const totalPins = {
      active: user.activePins || 0,
      used: user.usedPins || 0,
      total: user.totalPins || 0,
    };
    const userProfile = {
      fullName: user.fullName || "N/A",
      userId: user.userId || "N/A",
      username: user.username || "N/A",
      mobileNo: user.mobileNo || "N/A",
      email: user.email || "N/A",
      joiningDate: user.joiningDate || user.createdAt || "N/A",
    };
    const bankDetails = {
      accountHolderName: user.bankAccountDetails?.accountHolderName || user.fullName || "",
      accountNumber: user.bankAccountDetails?.accountNumber || user.accountNo || "",
      ifscCode: user.bankAccountDetails?.ifscCode || user.ifsc || "",
      bankName: user.bankAccountDetails?.bankName || user.bankName || "",
    };

    const respData = {
      totalTeam,
      totalDirect,
      totalActiveDirect,
      totalLeftBasicUser: detailedStats.leftBasic,
      totalRightBasicUser: detailedStats.rightBasic,
      totalLeftBoosterUser: detailedStats.leftBooster,
      totalRightBoosterUser: detailedStats.rightBooster,
      basicIncome,
      boosterIncome,
      boosterIncomeAmount: boosterIncome.amount,
      isBooster: boosterIncome.isBooster,
      totalIncome,
      totalPins,
      userProfile,
      bankDetails,
    };
    console.log('[DASHBOARD] responding with:', { basicIncome, boosterIncome, totalIncome, isBooster: boosterIncome.isBooster });
    return NextResponse.json({ success: true, data: respData });

  } catch (error: any) {
    console.error("❌ Dashboard API Error:", error.message);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
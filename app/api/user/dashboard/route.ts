import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { connectDB } from "../../../../lib/database";
import User from "../../../../models/User";
import { calculateBasicIncome } from "../../../../lib/calculateBasicIncome";
import { countActualChildren } from "../../../../lib/teamUtils";

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
    
    // 1. RECURSIVE SYNC: Count entire tree depth to ensure accurate income
    const actualCounts = await countActualChildren(user);
    console.log(`[DASHBOARD SYNC] ${user.username} Actual Tree:`, actualCounts);

    let updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { 
        $set: { 
          "totalTeam.left": actualCounts.left,
          "totalTeam.right": actualCounts.right
        } 
      },
      { new: true, returnDocument: 'after' }
    ) || user;

    // 2. ALLOCATION ENGINE: Sync basicIncome based on total tree state
    await calculateBasicIncome(updatedUser);

    if (updatedUser) {
      // Trigger one save to ensure pre-save income logic runs, but handle the version error gracefully
      try {
        await updatedUser.save();
        user.basicIncome = updatedUser.basicIncome;
        user.totalTeam = updatedUser.totalTeam;
      } catch (saveError) {
        // If parallel request already saved it, we just ignore the error and use the latest data
        const latestUser = await User.findById(user._id);
        if (latestUser) {
           user.basicIncome = latestUser.basicIncome;
           user.totalTeam = latestUser.totalTeam;
        }
      }
    }

    console.log('[DASHBOARD] After sync - basicIncome:', user.basicIncome);
    
    const totalTeam = {
      left: (user.totalTeam && typeof user.totalTeam.left === 'number') ? user.totalTeam.left : 0,
      right: (user.totalTeam && typeof user.totalTeam.right === 'number') ? user.totalTeam.right : 0,
    };
    // Prefer `directMembers` as the source of truth for direct counts.
    const totalDirect = (() => {
      if (Array.isArray(user.directMembers) && user.directMembers.length > 0) {
        const left = user.directMembers.filter((m: any) => (m.position || '').toString().toLowerCase() === 'left').length;
        const right = user.directMembers.filter((m: any) => (m.position || '').toString().toLowerCase() === 'right').length;
        return { left, right };
      }
      // Fallback for legacy single-slot fields (`leftChild` / `rightChild`)
      return {
        left: user.leftChild && user.leftChild.trim() !== "" ? 1 : 0,
        right: user.rightChild && user.rightChild.trim() !== "" ? 1 : 0,
      };
    })();

    console.log('[DASHBOARD] totalDirect (directMembers counts):', totalDirect);
    
    // Use the pre-calculated basicIncome from the User model
    // The pre-save hook in User.ts correctly calculates this from basicIncomeRecords
    const basicIncome = user.basicIncome || 0;
    
    console.log('[DASHBOARD] basicIncome from user model:', basicIncome);
    const schemaBooster: any = user.boosterIncome || {};
    const boosterIncomeAmount = typeof (user as any).boosterIncomeAmount === 'number'
      ? (user as any).boosterIncomeAmount
      : schemaBooster.amount ?? 0;
    const boosterIncome = {
      amount: boosterIncomeAmount,
      LG: schemaBooster.LG ?? 0,
      RG: schemaBooster.RG ?? 0,
      totalMatching: schemaBooster.totalMatching ?? schemaBooster.totalBoosterMatching ?? 0,
    };
    const totalIncome = user.totalIncome || 0;
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
      joiningDate: user.joiningDate || "N/A",
    };
    const respData = {
      totalTeam,
      totalDirect,
      basicIncome,
      boosterIncome,
      boosterIncomeAmount,
      totalIncome,
      totalPins,
      userProfile,
    };
    console.log('[DASHBOARD] responding with:', { basicIncome, boosterIncome, totalIncome });
    return NextResponse.json({ success: true, data: respData });

  } catch (error: any) {
    console.error("❌ Dashboard API Error:", error.message);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
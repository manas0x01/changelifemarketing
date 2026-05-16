import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ username: session.user.username })
      .select("username isBooster boosterCount boosterCountUsedForRank awardRankStatus awardRankRecords");

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        isBooster: !!user.isBooster,
        boosterCount: user.boosterCount || { left: 0, right: 0 },
        boosterCountUsedForRank: user.boosterCountUsedForRank || { left: 0, right: 0 },
        awardRankStatus: user.awardRankStatus || { rank: 0, rankName: "Member" },
        awardRankRecords: user.awardRankRecords || []
      }
    });

  } catch (error: any) {
    console.error("❌ GET BOOSTER REWARDS ERROR:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

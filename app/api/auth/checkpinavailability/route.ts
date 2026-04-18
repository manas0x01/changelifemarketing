import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('[CHECK-PIN] session.user:', { username: session?.user?.username ?? null, id: session?.user?.id ?? session?.user?.userId ?? null });
    if (!session?.user?.username) {
      console.log('[CHECK-PIN] unauthorized - no session');
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }
    await connectDB();
    console.log('[CHECK-PIN] DB connected');
    const user = await User.findOne({
      username: session.user.username,
    }).select("ePins");

    if (!user) {
      console.log('[CHECK-PIN] user not found for session user');
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }
    const validPins =
      user.ePins?.filter((pin: any) => {
        return (
          pin &&
          pin.pin &&
          !pin.used &&
          pin.status !== "used"
        );
      }) || [];
    console.log('[CHECK-PIN] validPins count:', validPins.length);

    const resp = {
      success: true,
      hasPins: validPins.length > 0,
      totalPins: validPins.length,
      pins: validPins.map((p: any) => ({
        pin: p.pin,
        amount: p.amount,
        createdAt: p.createdAt,
      })),
    };
    console.log('[CHECK-PIN] responding:', { hasPins: resp.hasPins, totalPins: resp.totalPins });
    return NextResponse.json(resp);
  } catch (error: any) {
    console.error("❌ PIN CHECK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to check pin availability",
      },
      { status: 500 }
    );
  }
}
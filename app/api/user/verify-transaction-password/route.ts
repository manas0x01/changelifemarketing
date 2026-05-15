import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { transactionPassword } = body;

    if (!transactionPassword) {
      return NextResponse.json({ success: false, error: "Transaction password is required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ username: session.user.username }).select("+transactionPassword ePins");

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (!user.transactionPassword) {
      return NextResponse.json({ success: false, error: "Transaction password not set. Please set it in profile." }, { status: 400 });
    }

    // Verify password using the model helper
    const isValid = await (user as any).compareTransactionPassword(transactionPassword);

    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid transaction password" }, { status: 400 });
    }

    // Filter available pins for transfer
    const availablePins = (user.ePins || [])
      .filter((pin: any) => pin.status === "Active" || !pin.status)
      .map((pin: any) => ({
        pin: pin.pin,
        packageName: pin.packageName
      }));

    return NextResponse.json({
      success: true,
      message: "Password verified",
      pins: availablePins
    });

  } catch (error) {
    console.error("❌ VERIFY TRANSACTION PASSWORD ERROR:", error);
    return NextResponse.json({ success: false, error: "An error occurred. Please try again." }, { status: 500 });
  }
}

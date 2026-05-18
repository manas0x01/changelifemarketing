import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const userId = session?.user?.id ?? session?.user?.userId ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { oldTransactionPassword, newTransactionPassword } = body;

    if (!newTransactionPassword) {
      return NextResponse.json({ error: "New transaction password is required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(userId).select("+transactionPassword");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If the user already has a transaction password, verify it
    if (user.transactionPassword) {
      if (!oldTransactionPassword) {
        return NextResponse.json({ error: "Old transaction password is required" }, { status: 400 });
      }
      const isValid = await user.compareTransactionPassword(oldTransactionPassword);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid old transaction password" }, { status: 400 });
      }
    }

    user.transactionPassword = newTransactionPassword;
    await user.save();

    return NextResponse.json({ success: true, message: "Transaction password updated successfully" });
  } catch (error: any) {
    console.error("❌ CHANGE TRANSACTION PASSWORD ERROR:", error);
    return NextResponse.json({ error: "Failed to change transaction password" }, { status: 500 });
  }
}

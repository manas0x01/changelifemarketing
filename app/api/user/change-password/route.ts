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
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "Old and new passwords are required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await user.comparePassword(oldPassword);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid old password" }, { status: 400 });
    }

    user.password = newPassword;
    await user.save();

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    console.error("❌ CHANGE PASSWORD ERROR:", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}

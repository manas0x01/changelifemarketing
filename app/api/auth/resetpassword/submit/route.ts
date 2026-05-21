import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, message: "Missing reset token." }, { status: 400 });
    }

    if (!password || password.length < 5) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 5 characters long." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Password reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    // Set the new password. This triggers the pre-save hook to hash it and update plainPassword
    user.password = password;

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    console.log(`✅ [PASSWORD RESET] Password successfully reset for user: ${user.username}`);

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset. You can now login with your new password.",
    });
  } catch (err: any) {
    console.error("❌ Error resetting password:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.username) {
            return Response.json({ success: false, error: "Unauthorized - Please login" }, { status: 401 });
        }
        const { oldPassword, newPassword } = await req.json();
        if (!oldPassword || !newPassword) {
            return Response.json({ success: false, error: "Old password and new password are required" }, { status: 400 });
        }
        if (newPassword.length < 6) {
            return Response.json({ success: false, error: "New password must be at least 6 characters" }, { status: 400 });
        }
        if (oldPassword === newPassword) {
            return Response.json({ success: false, error: "New password must be different from old password" }, { status: 400 });
        }
        await connectDB();
        const user = await User.findOne({ username: session.user.username }).select("+password");
        if (!user) {
            return Response.json({ success: false, error: "User not found" }, { status: 404 });
        }
        const isOldPasswordValid = await user.comparePassword(oldPassword);
        if (!isOldPasswordValid) {
            return Response.json({ success: false, error: "Old password is incorrect" }, { status: 400 });
        }
        user.password = newPassword;
        await user.save();
        return Response.json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        return Response.json({ success: false, error: "Failed to change password" }, { status: 500 });
    }
}

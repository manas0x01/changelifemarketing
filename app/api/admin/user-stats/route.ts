import { connectDB } from "@/lib/database";
import { authOptions, verifyAdminPermission } from "@/lib/auth";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const auth = await verifyAdminPermission('users');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.message },
        { status: auth.status }
      );
    }
    await connectDB();
    const totalUsers = await User.countDocuments();
    const usersWithEmail = await User.countDocuments({ email: { $exists: true, $ne: null } });
    const usersWithFullName = await User.countDocuments({ fullName: { $exists: true, $ne: null } });
    const usersWithPhone = await User.countDocuments({ mobileNo: { $exists: true, $ne: null } });
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    return Response.json({
      success: true,
      statistics: {
        totalUsers,
        usersWithEmail,
        usersWithFullName,
        usersWithPhone,
        recentUsersLast7Days: recentUsers,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch statistics"
      },
      { status: 500 }
    );
  }
}

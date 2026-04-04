import { connectDB } from "@/lib/database";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // Optional: Check if user is admin (you can customize this)
    const session = await getServerSession(authOptions);
    
    console.log('🔵 [UserStats] Analytics request');

    await connectDB();

    // Get various user statistics
    const totalUsers = await User.countDocuments();
    const usersWithEmail = await User.countDocuments({ email: { $exists: true, $ne: null } });
    const usersWithFullName = await User.countDocuments({ fullName: { $exists: true, $ne: null } });
    const usersWithPhone = await User.countDocuments({ mobileNo: { $exists: true, $ne: null } });

    // Get users registered in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    console.log(`✅ [UserStats] Total users: ${totalUsers}`);

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
    console.error("❌ Error fetching user statistics:", error);
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch statistics" 
      },
      { status: 500 }
    );
  }
}

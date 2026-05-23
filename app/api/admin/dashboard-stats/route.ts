import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPermission } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";
import Order from "@/models/Order";
import WithdrawRequest from "@/models/WithdrawRequest";
import Achiever from "@/models/Achiever";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('dashboard');

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.message },
        { status: auth.status }
      );
    }

    await connectDB();

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch counts and aggregates in parallel
    const [
      totalUsers,
      totalOrders,
      pendingWithdrawals,
      activeAchieversCount,
      totalAchieversCount,
      pendingOrdersCount,
      newUsersToday,
      recentOrders,
      recentWithdrawals,
      topAchieversRaw,
      revenueTodayResult,
      monthlyRevenueResult,
      withdrawPendingAmountResult
    ] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      WithdrawRequest.countDocuments({ status: "Pending" }),
      Achiever.countDocuments({ isVisible: true }),
      Achiever.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      User.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.find().sort({ createdAt: -1 }).limit(5).lean(),
      WithdrawRequest.find().sort({ createdAt: -1 }).limit(4).lean(),
      User.find({ totalIncome: { $gt: 0 } }).sort({ totalIncome: -1 }).limit(3).lean(),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfDay }, status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      WithdrawRequest.aggregate([
        { $match: { status: "Pending" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    const revenueToday = revenueTodayResult[0]?.total || 0;
    const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;
    const withdrawPendingAmount = withdrawPendingAmountResult[0]?.total || 0;

    // Format top achievers
    const topAchievers = topAchieversRaw.map((u, i) => ({
      rank: i + 1,
      name: u.fullName || u.username || "Unknown",
      level: u.basicRank || "Member",
      earnings: `₹${(u.totalIncome || 0).toLocaleString("en-IN")}`
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalUsers.toLocaleString("en-IN"),
        totalOrders: totalOrders.toLocaleString("en-IN"),
        withdrawPending: `₹${withdrawPendingAmount.toLocaleString("en-IN")}`,
        activeAchievers: activeAchieversCount.toLocaleString("en-IN"),
        pinRequests: pendingOrdersCount.toString(), // Using pending orders as proxy for PIN requests if not specified
        pendingOrders: pendingOrdersCount.toString(),
        newUsersToday: newUsersToday.toString(),
        revenueToday: `₹${revenueToday.toLocaleString("en-IN")}`,
        pendingWithdrawals: pendingWithdrawals.toString(),
        totalAchievers: totalAchieversCount.toString(),
        monthlyRevenue: `₹${monthlyRevenue.toLocaleString("en-IN")}`
      },
      recentOrders: recentOrders.map(o => ({
        id: `#ORD-${o._id.toString().slice(-4).toUpperCase()}`,
        user: o.name || o.username || "Unknown",
        product: o.productName || o.packName || "Unknown Product",
        amount: `₹${(o.amount || 0).toLocaleString("en-IN")}`,
        status: o.status.charAt(0).toUpperCase() + o.status.slice(1)
      })),
      recentWithdrawals: recentWithdrawals.map(w => ({
        user: w.userFullName || w.userName || "Unknown",
        amount: `₹${(w.amount || 0).toLocaleString("en-IN")}`,
        bank: `${w.bankDetails?.bankName || "Bank"} •••• ${w.bankDetails?.accountNumber?.slice(-4) || "0000"}`,
        date: new Date(w.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
        status: w.status
      })),
      topAchievers
    });
  } catch (error: any) {
    console.error("❌ DASHBOARD STATS ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}

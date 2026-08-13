import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPermission } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import Order from "@/models/Order";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission("orders");
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.message },
        { status: auth.status }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);

    // Default: current month
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const fromDate = fromParam ? new Date(fromParam + "T00:00:00.000Z") : defaultFrom;
    const toDate = toParam ? new Date(toParam + "T23:59:59.999Z") : defaultTo;

    // Fetch orders in range (all statuses)
    const orders = await Order.find({
      createdAt: { $gte: fromDate, $lte: toDate },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch users who joined in this range (joining sales via registeredPackage)
    const joinedUsers = await User.find({
      createdAt: { $gte: fromDate, $lte: toDate },
      registeredPackage: { $exists: true, $nin: [null, ""] },
    })
      .select("userId fullName username phone mobileNo city district state pincode registeredPackage createdAt joiningDate")
      .lean();

    // Build rows from orders
    const orderRows = orders.map((o: any) => ({
      date: o.createdAt
        ? new Date(o.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—",
      dateRaw: o.createdAt ? new Date(o.createdAt).toISOString() : "",
      name: o.name || o.username || "Unknown",
      username: o.username || "—",
      userId: o.userId || "—",
      mobile: o.mobileNumber || "—",
      location: "—", // Order model has no location; join via userId below
      amount: o.amount || o.productPrice || o.packPrice || 0,
      status: o.status
        ? o.status.charAt(0).toUpperCase() + o.status.slice(1)
        : "Pending",
      type: o.orderType === "pack" ? "Pack" : "Product",
      detail: o.productName || o.packName || "Purchase",
    }));

    // For orders that have a userId, fetch the user's location
    const userIds = [...new Set(orderRows.filter((r) => r.userId !== "—").map((r) => r.userId as string))];
    let userLocationMap: Record<string, { location: string; pincode: string; mobile: string }> = {};
    if (userIds.length > 0) {
      const usersForLocation = await User.find({ userId: { $in: userIds } })
        .select("userId city district state pincode mobileNo phone")
        .lean();
      usersForLocation.forEach((u: any) => {
        const loc = [u.city, u.district, u.state].filter(Boolean).join(", ");
        userLocationMap[u.userId] = {
          location: loc || "—",
          pincode: u.pincode || "—",
          mobile: u.mobileNo || u.phone || "—",
        };
      });
    }

    // Enrich order rows with location, pincode, mobile
    const enrichedOrderRows = orderRows.map((r) => ({
      ...r,
      location: r.userId !== "—" ? userLocationMap[r.userId]?.location || "—" : "—",
      pincode: r.userId !== "—" ? userLocationMap[r.userId]?.pincode || "—" : "—",
      mobile: r.mobile !== "—" ? r.mobile : (r.userId !== "—" ? userLocationMap[r.userId]?.mobile || "—" : "—"),
    }));

    // Build rows from joining users (registeredPackage = joining sale)
    const joiningRows = joinedUsers.map((u: any) => {
      const loc = [u.city, u.district, u.state].filter(Boolean).join(", ");
      return {
        date: u.createdAt
          ? new Date(u.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
        dateRaw: u.createdAt ? new Date(u.createdAt).toISOString() : "",
        name: u.fullName || u.username || "Unknown",
        username: u.username || "—",
        userId: u.userId || "—",
        mobile: u.mobileNo || u.phone || "—",
        pincode: u.pincode || "—",
        location: loc || "—",
        amount: 1299, // Joining amount
        status: "Confirmed",
        type: "Joining",
        detail: u.registeredPackage || "Joining Package",
      };
    });

    // Merge and sort by date desc
    const allRows = [...enrichedOrderRows, ...joiningRows].sort(
      (a, b) => new Date(b.dateRaw).getTime() - new Date(a.dateRaw).getTime()
    );

    // Summary from orders only (authoritative sales data)
    const confirmedOrders = orders.filter(
      (o: any) => o.status !== "cancelled"
    );
    const totalRevenue = confirmedOrders.reduce(
      (sum: number, o: any) => sum + (o.amount || o.productPrice || o.packPrice || 0),
      0
    );
    const joiningRevenue = joiningRows.reduce((sum, r) => sum + r.amount, 0);

    const summary = {
      totalRevenue: totalRevenue + joiningRevenue,
      totalOrders: orders.length + joiningRows.length,
      confirmed: orders.filter((o: any) => o.status === "confirmed" || o.status === "completed").length + joiningRows.length,
      pending: orders.filter((o: any) => o.status === "pending").length,
      cancelled: orders.filter((o: any) => o.status === "cancelled").length,
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
    };

    return NextResponse.json({
      success: true,
      summary,
      rows: allRows.map(({ dateRaw: _dr, ...rest }) => rest),
    });
  } catch (error: any) {
    console.error("❌ SALES REPORT ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sales report" },
      { status: 500 }
    );
  }
}

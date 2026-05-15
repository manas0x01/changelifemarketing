import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import Order from "@/models/Order";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 [API] GET /api/user/get-pin-requests hit");
    const session = await getServerSession(authOptions);
    console.log("🔍 [API] Session:", session ? "Found" : "Not Found", "User:", session?.user?.username);

    if (!session?.user?.username) {
      console.log("⚠️ [API] Unauthorized access attempt");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Fetch user for their specific pinRequests array
    const user = await User.findOne({ username: session.user.username }).select("pinRequests fullName");

    // Fetch orders for this user from global Orders collection
    const orders = await Order.find({
      $or: [
        { username: session.user.username },
        { userId: session.user.username }
      ]
    }).sort({ createdAt: -1 });

    // Combine both sources
    const combinedRequests: any[] = [];

    // Add orders from Order collection
    orders.forEach((order, index) => {
      combinedRequests.push({
        srNo: 0, // Will recalculate
        requestNo: order._id.toString().slice(-8).toUpperCase(),
        dateISO: order.createdAt,
        memberId: order.username || order.userId || "N/A",
        name: order.name || user?.fullName || "N/A",
        totalPins: order.quantity || 1,
        totalAmount: `₹${(order.amount || 0).toLocaleString("en-IN")}`,
        description: order.transactionDetails || "E-Pin Purchase",
        type: "Credit",
        status: order.status
      });
    });

    // Add requests from User model (if any unique ones exist)
    if (user?.pinRequests) {
      user.pinRequests.forEach((req: any) => {
        // Check if already added via Order (simple check by description or date)
        const exists = combinedRequests.find(r => r.description === req.description && 
          new Date(r.dateISO).getTime() === new Date(req.date).getTime());
        
        if (!exists) {
          combinedRequests.push({
            srNo: 0,
            requestNo: req.requestNo,
            dateISO: req.date,
            memberId: req.memberId,
            name: req.name,
            totalPins: req.totalPins,
            totalAmount: req.totalAmount,
            description: req.description,
            type: req.type,
            status: "Completed" // Assuming historical requests in user model are completed
          });
        }
      });
    }

    // Sort combined by date
    combinedRequests.sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());

    // Map to final format with proper Sr.No
    const requests = combinedRequests.map((r, index) => ({
      ...r,
      srNo: index + 1,
      date: new Date(r.dateISO).toLocaleString("en-GB", { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }));

    return NextResponse.json({
      success: true,
      requests
    });

  } catch (error) {
    console.error("❌ GET PIN REQUESTS ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch requests" }, { status: 500 });
  }
}

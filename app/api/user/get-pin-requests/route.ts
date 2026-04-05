import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const requests: any[] = [];
    let requestNo = 1;

    // Get all transactions for this user
    const allUsers = await User.find({}).select("_id username userId fullName ePins");

    // 1. Credit transactions: Pins received by this user
    (user.ePins || []).forEach((pin: any) => {
      if (pin.transferredFrom) {
        // This pin was received from someone
        requests.push({
          srNo: requests.length + 1,
          requestNo: `REQ${String(requestNo++).padStart(5, "0")}`,
          date: pin.transferDate ? new Date(pin.transferDate).toLocaleDateString("en-IN") : "--",
          memberId: pin.transferredFrom || "--",
          name: pin.transferredFromName || "--",
          totalPins: 1,
          totalAmount: `₹1,000`, // Placeholder, would need package pricing
          description: `${pin.packageName} - Received`,
          type: "Credit" as const,
        });
      }
    });

    // 2. Debit transactions: Pins sent by this user to others
    // Search through all other users' pins to find what this user sent
    for (const otherUser of allUsers) {
      if (otherUser._id.toString() === user._id.toString()) continue;

      (otherUser.ePins || []).forEach((pin: any) => {
        if (pin.transferredFrom === user.username) {
          // This user sent this pin to otherUser
          requests.push({
            srNo: requests.length + 1,
            requestNo: `REQ${String(requestNo++).padStart(5, "0")}`,
            date: pin.transferDate ? new Date(pin.transferDate).toLocaleDateString("en-IN") : "--",
            memberId: otherUser.userId || otherUser.username,
            name: otherUser.fullName || otherUser.username,
            totalPins: 1,
            totalAmount: `₹1,000`, // Placeholder
            description: `${pin.packageName} - Transferred`,
            type: "Debit" as const,
          });
        }
      });
    }

    // Sort by most recent first
    requests.sort((a, b) => {
      const dateA = new Date(a.date === "--" ? 0 : a.date).getTime();
      const dateB = new Date(b.date === "--" ? 0 : b.date).getTime();
      return dateB - dateA;
    });

    // Add serial numbers
    requests.forEach((req, index) => {
      req.srNo = index + 1;
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching pin requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

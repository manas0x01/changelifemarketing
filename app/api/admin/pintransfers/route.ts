import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    await connectDB();

    // Aggregate all transfers from the user collection's transferredEpins array
    const transfers = await User.aggregate([
      { $match: { "transferredEpins.0": { $exists: true } } },
      { $unwind: "$transferredEpins" },
      {
        $project: {
          senderUsername: "$username",
          senderFullName: "$fullName",
          senderUserId: "$userId",
          ePin: "$transferredEpins.ePin",
          package: "$transferredEpins.package",
          transferredTo: "$transferredEpins.transferredTo",
          transferredToName: "$transferredEpins.transferredToName",
          date: "$transferredEpins.date",
          time: "$transferredEpins.time",
          status: "$transferredEpins.status",
          remark: "$transferredEpins.remark"
        }
      }
    ]);

    // Fetch all users to resolve Member IDs (userIds) for recipient and sender
    const users = await User.find({}).select("username userId fullName").lean();
    const userMap = new Map();
    users.forEach((u) => {
      userMap.set(u.username, u);
      if (u.userId) {
        userMap.set(u.userId, u);
      }
    });

    const formattedTransfers = transfers.map((t) => {
      const sender = userMap.get(t.senderUsername) || null;
      const recipient = userMap.get(t.transferredTo) || null;
      return {
        ePin: t.ePin,
        package: t.package || "EPIN",
        senderId: sender?.userId || t.senderUserId || t.senderUsername,
        senderName: sender?.fullName || t.senderFullName || "N/A",
        recipientId: recipient?.userId || t.transferredTo,
        recipientName: recipient?.fullName || t.transferredToName || "N/A",
        date: t.date,
        time: t.time || "N/A",
        status: t.status || "Success",
        remark: t.remark || "N/A"
      };
    });

    // Sort by date (descending)
    formattedTransfers.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ success: true, data: formattedTransfers });
  } catch (err: any) {
    console.error("Error fetching PIN transfers:", err);
    return NextResponse.json({ success: false, message: err.message || "Internal server error." }, { status: 500 });
  }
}

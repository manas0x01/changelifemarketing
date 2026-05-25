import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Select transferredEpins — this holds the actual outgoing transfer details
    // (date, time, ePin, transferredTo, etc.) that the Transfer History table displays
    const user = await User.findOne({ username: session.user.username }).select("transferredEpins");

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const transferredEpins = (user as any).transferredEpins || [];
    
    // Fetch recipient user records to resolve their userIds dynamically
    const recipientUsernames: string[] = Array.from(new Set(transferredEpins.map((t: any) => t.transferredTo).filter(Boolean))) as string[];
    const recipients = await User.find({ username: { $in: recipientUsernames } }).select("username userId fullName").lean();
    const recipientMap = new Map(recipients.map((r: any) => [r.username, r]));

    // Map transferredEpins to the Transfer interface expected by the frontend
    const transfers = transferredEpins
      .slice()
      .reverse() // Show most recent first
      .map((t: any) => {
        const recipient = recipientMap.get(t.transferredTo);
        const dateObj = t.date ? new Date(t.date) : null;
        return {
          date: dateObj
            ? dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            : "N/A",
          dateISO: t.date || null,
          time: t.time || (dateObj ? dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "N/A"),
          ePin: t.ePin || "N/A",
          package: t.package || "N/A",
          transferredTo: t.transferredTo || "N/A",
          transferredToUserId: recipient?.userId || t.transferredTo || "N/A",
          transferredToName: recipient?.fullName || t.transferredToName || t.transferredTo || "N/A",
          status: t.status || "Success",
          remark: t.remark || "—",
        };
      });

    return NextResponse.json({
      success: true,
      transfers
    });

  } catch (error) {
    console.error("❌ GET TRANSFER HISTORY ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch transfer history" }, { status: 500 });
  }
}

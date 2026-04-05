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

    const transfers: any[] = [];

    // Get all transfers sent by this user (where transferredTo/transferredToName is set)
    (user.ePins || []).forEach((pin: any) => {
      if (pin.transferredTo && pin.transferDate) {
        transfers.push({
          date: new Date(pin.transferDate).toLocaleDateString("en-IN"),
          time: new Date(pin.transferDate).toLocaleTimeString("en-IN"),
          ePin: pin.pin,
          package: pin.packageName,
          transferredTo: pin.transferredTo,
          transferredToName: pin.transferredToName,
          status: "Success",
          remark: pin.remark || "--",
        });
      }
    });

    // Sort by most recent first
    transfers.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`).getTime();
      const dateB = new Date(`${b.date} ${b.time}`).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ transfers });
  } catch (error) {
    console.error("Error fetching transfer history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

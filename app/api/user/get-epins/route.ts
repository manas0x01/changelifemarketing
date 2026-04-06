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

    // Map E-Pins with status and transfer information
    const ePins = (user.ePins || []).map((pin: any, index: number) => ({
      srNo: index + 1,
      ePin: pin.pin,
      package: pin.packageName,
      status: pin.usedDate ? "Used" : (pin.transferDate ? "Transferred" : "Active"),
      transferredTo: pin.transferredTo || "--",
      transferredToName: pin.transferredToName || "--",
      transferredDate: pin.transferDate ? new Date(pin.transferDate).toLocaleDateString("en-IN") : "--",
      usedDate: pin.usedDate,
      transferDate: pin.transferDate,
      remark: pin.remark || "",
    }));

    return NextResponse.json({ ePins });
  } catch (error) {
    console.error("Error fetching E-Pins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


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
    const ePins = (user.ePins || []).map((pin: any, index: number) => {
      let displayTo = "--";
      let displayToName = "--";
      let displayDate = "--";

      if (pin.usedDate) {
        // For Used E-Pins, show the date it was used
        displayDate = new Date(pin.usedDate).toLocaleDateString("en-IN");
      } else if (pin.transferDate) {
        // For Transferred E-Pins, show transfer details
        displayTo = pin.transferredTo || "--";
        displayToName = pin.transferredToName || "--";
        displayDate = new Date(pin.transferDate).toLocaleDateString("en-IN");
      }

      return {
        srNo: index + 1,
        ePin: pin.pin,
        package: pin.packageName,
        status: pin.usedDate ? "Used" : (pin.transferDate ? "Transferred" : "Active"),
        transferredTo: displayTo,
        transferredToName: displayToName,
        transferredDate: displayDate,
        usedDate: pin.usedDate,
        transferDate: pin.transferDate,
        remark: pin.remark || "",
      };
    });

    return NextResponse.json({ ePins });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


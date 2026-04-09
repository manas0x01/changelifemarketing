import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ username: session.user.username });

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

      // Use actual status from database
      const actualStatus = pin.status || "Active";

      if (pin.transferDate) {
        // For Transferred E-Pins, show transfer details
        displayTo = pin.transferredTo || "--";
        displayToName = pin.transferredToName || "--";
        displayDate = new Date(pin.transferDate).toLocaleDateString("en-IN");
      } else if (pin.usedDate) {
        // For Used E-Pins, show the date it was used
        displayDate = new Date(pin.usedDate).toLocaleDateString("en-IN");
      }

      return {
        srNo: index + 1,
        ePin: pin.pin,
        package: pin.packageName,
        status: actualStatus,
        transferredTo: displayTo,
        transferredToName: displayToName,
        transferredDate: displayDate,
        transferDate: pin.transferDate ? new Date(pin.transferDate).toISOString() : null,
        usedDate: pin.usedDate ? new Date(pin.usedDate).toISOString() : null,
        remark: pin.remark || "",
      };
    });

    return NextResponse.json({ 
      success: true,
      ePins,
      totalRecords: ePins.length,
      message: "E-Pins fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching E-Pins:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}


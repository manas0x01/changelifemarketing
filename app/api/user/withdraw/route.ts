import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); 

    let filter: any = {};
    if (status) {
      filter = { "withdrawRequests.status": status };
    }

    const users = await User.find(filter)
      .select("username fullName withdrawRequests")
      .lean();

    const allRequests: any[] = [];

    users.forEach((user: any) => {
      user.withdrawRequests?.forEach((req: any) => {
        if (!status || req.status === status) {
          allRequests.push({
            username: user.username,
            fullName: user.fullName,
            ...req,
          });
        }
      });
    });

    return NextResponse.json({
      success: true,
      data: allRequests,
    });
  } catch (error: any) {
    console.error("❌ Withdraw GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch withdraw requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      username,
      requestNo,
      status, 
      utrNumber,
      adminRemark,
      paymentMode,
    } = body;

    if (!username || !requestNo || !status) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const withdrawRequestsArray = Array.isArray(user.withdrawRequests) ? user.withdrawRequests : [];
    const withdrawRequest = withdrawRequestsArray.find((req: any) => req.requestNo === requestNo);

    if (!withdrawRequest) {
      return NextResponse.json(
        { success: false, message: "Request not found" },
        { status: 404 }
      );
    }
    if (withdrawRequest.status !== "Pending") {
      return NextResponse.json(
        { success: false, message: "Already processed" },
        { status: 400 }
      );
    }
    withdrawRequest.status = status;
    withdrawRequest.processedDate = new Date();
    withdrawRequest.adminRemark = adminRemark || "";
    withdrawRequest.utrNumber = utrNumber || "";
    withdrawRequest.paymentMode = paymentMode || "";
    await user.save();
    return NextResponse.json({
      success: true,
      message: `Withdraw ${status} successfully`,
    });
  } catch (error: any) {
    console.error("❌ Withdraw POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process withdraw request" },
      { status: 500 }
    );
  }
}
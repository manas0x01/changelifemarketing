import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }
    await connectDB();
    const user = await User.findOne({
      username: session.user.username,
    }).select(
      "fullName username userId email mobileNo role createdAt joiningDate registeredPackage address city state pincode panNo bankName branchName accountNo ifsc accountType bankDetailsStatus bankDetailsRejectReason pendingBankAccountDetails"
    );
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      user: {
        fullName: user.fullName || "",
        username: user.username,
        userId: user.userId,
        email: user.email || "",
        mobileNo: user.mobileNo || "",
        role: user.role || "user",
        joiningDate: user.joiningDate || user.createdAt,
        createdAt: user.createdAt,
        registeredPackage: user.registeredPackage || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || "",
        panNo: user.panNo || "",
        bankDetailsStatus: user.bankDetailsStatus || "none",
        bankDetailsRejectReason: (user as any).bankDetailsRejectReason || "",
        pendingBankAccountDetails: (user as any).pendingBankAccountDetails || null,
        bankName: user.bankDetailsStatus === 'approved' ? ((user as any).bankName || "") : "",
        branchName: user.bankDetailsStatus === 'approved' ? ((user as any).branchName || "") : "",
        accountNo: user.bankDetailsStatus === 'approved' ? ((user as any).accountNo || "") : "",
        ifsc: user.bankDetailsStatus === 'approved' ? ((user as any).ifsc || "") : "",
        accountType: user.bankDetailsStatus === 'approved' ? ((user as any).accountType || "") : "",
      },
    });

  } catch (error: any) {
    console.error("❌ GET PROFILE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch profile",
      },
      { status: 500 }
    );
  }
}
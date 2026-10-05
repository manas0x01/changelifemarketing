import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPermission } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('bank-approvals');

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    await connectDB();

    // Fetch users with pending bank details
    const users = await User.find({ bankDetailsStatus: "pending" })
      .select(
        "username userId fullName email mobileNo role bankDetailsStatus pendingBankAccountDetails createdAt updatedAt"
      )
      .lean();

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error("❌ GET admin/bank-approvals error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bank approvals." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('bank-approvals');

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const { userId, action, rejectReason } = await req.json();

    if (!userId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid payload. Provide userId and valid action ('approve' or 'reject')." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({
      $or: [{ _id: userId }, { userId }, { username: userId }],
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    if (user.bankDetailsStatus !== "pending") {
      return NextResponse.json(
        { success: false, message: "No pending bank approval request found for this user." },
        { status: 400 }
      );
    }

    const updateDoc: any = {};
    if (action === "approve") {
      const pending = (user as any).pendingBankAccountDetails || {};

      updateDoc.bankName = pending.bankName || "";
      updateDoc.branchName = pending.branchName || "";
      updateDoc.accountNo = pending.accountNumber || "";
      updateDoc.ifsc = pending.ifscCode || "";
      updateDoc.accountType = pending.accountType || "";

      updateDoc.bankAccountDetails = {
        accountHolderName: pending.accountHolderName || user.fullName || "",
        accountNumber: pending.accountNumber || "",
        ifscCode: pending.ifscCode || "",
        bankName: pending.bankName || "",
      };

      updateDoc.bankDetailsStatus = "approved";
      updateDoc.bankDetailsRejectReason = "";
    } else {
      updateDoc.bankDetailsStatus = "rejected";
      updateDoc.bankDetailsRejectReason = rejectReason || "Rejected by Admin";
    }

    await User.updateOne({ _id: user._id }, { $set: updateDoc });

    return NextResponse.json({
      success: true,
      message: `Bank details request ${action === "approve" ? "approved" : "rejected"} successfully.`,
    });
  } catch (error: any) {
    console.error("❌ POST admin/bank-approvals error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process bank approval." },
      { status: 500 }
    );
  }
}

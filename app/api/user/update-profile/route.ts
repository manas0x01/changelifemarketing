import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

const ALLOWED_UPDATE_FIELDS = [
  "gender",
  "email",
  "mobileNo",
  "panNo",
  "dateOfBirth",
  "state",
  "district",
  "city",
  "address",
  "pincode",
  "nomineeName",
  "nomineeRelation",
  "joiningDate",
  "sponsorId",
  "sponsorName",
  "placementId",
  "placementName",
  "placementPosition",
  "bankName",
  "branchName",
  "accountNo",
  "ifsc",
  "accountType",
  "upiId",
];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const userId = session?.user?.id ?? session?.user?.userId ?? null;
    const username = session?.user?.username ?? null;

    if (!userId && !username) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = userId
      ? await User.findById(userId).select(
          "fullName username userId email mobileNo phone role createdAt dateOfBirth panNo state district city address pincode nomineeName nomineeRelation joiningDate sponsorId sponsorName placementId placementName placementPosition bankName branchName accountNo ifsc accountType bankDetailsStatus bankDetailsRejectReason pendingBankAccountDetails upiId"
        )
      : await User.findOne({ username }).select(
          "fullName username userId email mobileNo phone role createdAt dateOfBirth panNo state district city address pincode nomineeName nomineeRelation joiningDate sponsorId sponsorName placementId placementName placementPosition bankName branchName accountNo ifsc accountType bankDetailsStatus bankDetailsRejectReason pendingBankAccountDetails upiId"
        );

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Determine the values to return for the edit bank form based on status
    const status = user.bankDetailsStatus || "none";
    let bankName = "";
    let branchName = "";
    let accountNo = "";
    let ifsc = "";
    let accountType = "";

    if (status === "approved") {
      bankName = (user as any).bankName || "";
      branchName = (user as any).branchName || "";
      accountNo = (user as any).accountNo || "";
      ifsc = (user as any).ifsc || "";
      accountType = (user as any).accountType || "";
    } else if (status === "pending" || status === "rejected") {
      const pending = (user as any).pendingBankAccountDetails || {};
      bankName = pending.bankName || "";
      branchName = pending.branchName || "";
      accountNo = pending.accountNumber || "";
      ifsc = pending.ifscCode || "";
      accountType = pending.accountType || "";
    }

    return NextResponse.json({
      success: true,
      data: {
        fullName: user.fullName || "",
        username: user.username || "",
        userId: user.userId || (user as any)._id?.toString?.() || "",
        email: user.email || "",
        mobileNo: user.mobileNo || user.phone || "",
        role: user.role || "user",
        createdAt: user.createdAt,
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString() : undefined,
        panNo: user.panNo || "",
        state: user.state || "",
        district: user.district || "",
        city: user.city || "",
        address: user.address || "",
        pincode: user.pincode || "",
        nomineeName: user.nomineeName || "",
        nomineeRelation: user.nomineeRelation || "",
        joiningDate: user.createdAt || user.joiningDate || "",
        sponsorId: user.sponsorId || "",
        sponsorName: user.sponsorName || "",
        placementId: user.placementId || "",
        placementName: user.placementName || "",
        placementPosition: user.placementPosition || "",
        bankName,
        branchName,
        accountNo,
        ifsc,
        accountType,
        upiId: user.upiId || "",
        bankDetailsStatus: status,
        bankDetailsRejectReason: (user as any).bankDetailsRejectReason || "",
      },
    });
  } catch (error: any) {
    console.error("❌ GET update-profile error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let session: any;
    if (process.env.NODE_ENV === "test" && (global as any).mockSession) {
      session = (global as any).mockSession;
    } else {
      session = await getServerSession(authOptions);
    }

    const userId = session?.user?.id ?? session?.user?.userId ?? null;
    const username = session?.user?.username ?? null;

    if (!userId && !username) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ username });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const body = await req.json();

    // Check if bank details are being submitted/edited
    const hasBankFields = ["bankName", "branchName", "accountNo", "ifsc", "accountType"].some(
      (key) => Object.prototype.hasOwnProperty.call(body, key)
    );

    // 🔹 DUPLICATE ACCOUNT DETECTION REMOVED

    const currentStatus = user.bankDetailsStatus || "none";

    if (hasBankFields) {
      // If user has already submitted (pending or approved), they cannot edit
      if (currentStatus === "pending" || currentStatus === "approved") {
        return NextResponse.json(
          {
            success: false,
            message: "Bank details have already been submitted or approved. You can only fill them once.",
          },
          { status: 400 }
        );
      }

      // Save under pendingBankAccountDetails instead of updating direct bank fields
      user.pendingBankAccountDetails = {
        accountHolderName: body.fullName || user.fullName || "",
        accountNumber: body.accountNo || "",
        ifscCode: body.ifsc || "",
        bankName: body.bankName || "",
        branchName: body.branchName || "",
        accountType: body.accountType || "",
      };
      user.bankDetailsStatus = "pending";
      (user as any).bankDetailsRejectReason = ""; // Clear previous reject reason
    }

    // Build update object with allowed fields, excluding direct bank fields
    const update: any = {};
    for (const key of ALLOWED_UPDATE_FIELDS) {
      // Skip direct updates to bank details for users (handled above via pending)
      if (["bankName", "branchName", "accountNo", "ifsc", "accountType"].includes(key)) {
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        update[key] = body[key];
      }
    }

    // Basic validations
    if (update.mobileNo && !/^\d{10}$/.test(String(update.mobileNo))) {
      return NextResponse.json({ success: false, message: "Mobile number must be 10 digits" }, { status: 400 });
    }

    if (update.panNo) {
      update.panNo = String(update.panNo).toUpperCase().trim();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(update.panNo)) {
        return NextResponse.json({ success: false, message: "Invalid PAN number format (e.g., ABCDE1234F)" }, { status: 400 });
      }
    }

    // Normalize dateOfBirth if provided
    if (update.dateOfBirth) {
      const d = new Date(update.dateOfBirth);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ success: false, message: "Invalid dateOfBirth" }, { status: 400 });
      }
      update.dateOfBirth = d;
    }

    // Apply updates
    (user as any).set(update);
    await user.save();

    return NextResponse.json({
      success: true,
      message: hasBankFields
        ? "Bank details submitted and pending Admin approval."
        : "Profile updated successfully.",
    });
  } catch (error: any) {
    console.error("❌ POST update-profile error:", error);
    return NextResponse.json({ success: false, message: "Failed to update profile" }, { status: 500 });
  }
}

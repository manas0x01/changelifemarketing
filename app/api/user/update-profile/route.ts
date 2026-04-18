import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

const ALLOWED_UPDATE_FIELDS = [
  "fullName",
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
          "fullName username userId email mobileNo phone role createdAt dateOfBirth panNo state district city address pincode nomineeName nomineeRelation joiningDate sponsorId sponsorName placementId placementName placementPosition bankName branchName accountNo ifsc accountType"
        )
      : await User.findOne({ username }).select(
          "fullName username userId email mobileNo phone role createdAt dateOfBirth panNo state district city address pincode nomineeName nomineeRelation joiningDate sponsorId sponsorName placementId placementName placementPosition bankName branchName accountNo ifsc accountType"
        );

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
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
        joiningDate: user.joiningDate || "",
        sponsorId: user.sponsorId || "",
        sponsorName: user.sponsorName || "",
        placementId: user.placementId || "",
        placementName: user.placementName || "",
        placementPosition: user.placementPosition || "",
        bankName: (user as any).bankName || "",
        branchName: (user as any).branchName || "",
        accountNo: (user as any).accountNo || "",
        ifsc: (user as any).ifsc || "",
        accountType: (user as any).accountType || "",
      },
    });
  } catch (error: any) {
    console.error("❌ GET update-profile error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const userId = session?.user?.id ?? session?.user?.userId ?? null;
    const username = session?.user?.username ?? null;

    if (!userId && !username) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Build update object with allowed fields only
    const update: any = {};
    for (const key of ALLOWED_UPDATE_FIELDS) {
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
        return NextResponse.json({ success: false, message: "Invalid PAN number format" }, { status: 400 });
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

    await connectDB();

    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ username });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Apply updates
    (user as any).set(update);
    await user.save();

    return NextResponse.json({ success: true, message: "Profile updated" });
  } catch (error: any) {
    console.error("❌ POST update-profile error:", error);
    return NextResponse.json({ success: false, message: "Failed to update profile" }, { status: 500 });
  }
}

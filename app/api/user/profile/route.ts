import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/database";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    console.log('🔐 Profile API - Getting session...');
    
    // Get NextAuth session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.username) {
      console.error('❌ No valid session found');
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    console.log('✅ Session verified, username:', session.user.username);
    }
    
    await dbConnect();
    let user;
    
    // Try to find user by email first
    if (email) {
      user = await User.findOne({ email }).select("-password -otp -otpExpiry");
    }
    // Fall back to username if no email
    else if (decodedToken?.username) {
      user = await User.findOne({ username: decodedToken.username }).select("-password -otp -otpExpiry");
    }
    // Fall back to email from Authorization header
    else if (authHeader?.startsWith("Bearer ")) {
      const headerEmail = authHeader.slice(7);
      user = await User.findOne({ email: headerEmail }).select("-password -otp -otpExpiry");
    }
    
    if (!user) {
      console.error("❌ User not found for email:", email);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    console.log("✅ User found, returning profile data for:", email);
    const profileData = {
      personalDetails: [
        { label: "Full Name", value: user.fullName || "N/A" },
        { label: "Gender", value: user.gender || "N/A" },
        { label: "Date of Birth", value: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "N/A" },
        { label: "Mobile No.", value: user.phone || user.mobileNo || "N/A" },
        { label: "Pan No.", value: user.panNo || "N/A" },
        { label: "Email", value: user.email || "N/A" },
        { label: "State", value: user.state || "N/A" },
        { label: "District", value: user.district || "N/A" },
        { label: "City", value: user.city || "N/A" },
        { label: "Address", value: user.address || "N/A" },
        { label: "Pincode", value: user.pincode || "N/A" },
      ],
      bankDetails: [
        { label: "Bank Name", value: user.bankName || "N/A" },
        { label: "Branch Name", value: user.branchName || "N/A" },
        { label: "Account No.", value: user.accountNo || "N/A" },
        { label: "IFSC", value: user.ifsc || "N/A" },
        { label: "Account Type", value: user.accountType || "N/A" },
      ],
      username: user.fullName || user.username || "User",
      userId: user.username || user._id.toString(),
      avatar: "/images/user.png",
    };

    return NextResponse.json(profileData, { status: 200 });
  } catch (error) {
    console.error("❌ Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

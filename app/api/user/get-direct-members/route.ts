import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find all users sponsored by this user
    const directMembers = await User.find({ sponsorId: session.user.username })
      .select("username userId fullName joiningDate mobileNo totalDirect createdAt")
      .sort({ createdAt: -1 });

    const formattedMembers = directMembers.map((member, index) => {
      // Handle joiningDate which can be a string or we use createdAt
      let dateStr = "N/A";
      if (member.joiningDate) {
        dateStr = member.joiningDate; // assuming DD/MM/YYYY from other parts of the app
      } else if (member.createdAt) {
        const d = new Date(member.createdAt);
        dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      }

      return {
        srNo: index + 1,
        memberId: member.username || member.userId || "N/A",
        name: member.fullName || member.username || "N/A",
        directs: member.totalDirect || 0,
        joiningDate: dateStr,
        mobileNo: member.mobileNo || "N/A"
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedMembers
    });

  } catch (error) {
    console.error("❌ GET DIRECT MEMBERS ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch direct members" }, { status: 500 });
  }
}

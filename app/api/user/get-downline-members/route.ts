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

    const currentUser = await User.findOne({ username: session.user.username }).select("username userId leftChild rightChild");

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Function to get all descendants for a branch
    const getDescendants = async (startUsername: string, position: "Left" | "Right") => {
      if (!startUsername) return [];

      const descendants = await User.aggregate([
        { $match: { username: startUsername } },
        {
          $graphLookup: {
            from: "users",
            startWith: "$username",
            connectFromField: "username",
            connectToField: "placementId",
            as: "downline"
          }
        }
      ]);

      if (descendants.length === 0) return [];

      const list = descendants[0].downline || [];
      return list.map((member: any) => {
        let dateStr = "N/A";
        let dateISO = null;
        if (member.joiningDate) {
          dateStr = member.joiningDate;
        } else if (member.createdAt) {
          const d = new Date(member.createdAt);
          dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
          dateISO = member.createdAt;
        }

        return {
          memberId: member.username || member.userId || "N/A",
          name: member.fullName || member.username || "N/A",
          sponsorId: member.sponsorId || "N/A",
          placementId: member.placementId || "N/A",
          joiningDate: dateStr,
          joiningDateISO: dateISO || member.createdAt,
          position: position
        };
      });
    };

    // Fetch left and right branches separately
    const leftTree = await getDescendants(currentUser.leftChild!, "Left");
    const rightTree = await getDescendants(currentUser.rightChild!, "Right");

    const allMembers = [...leftTree, ...rightTree];

    // Sort by date descending
    allMembers.sort((a, b) => new Date(b.joiningDateISO).getTime() - new Date(a.joiningDateISO).getTime());

    // Add Sr.No
    const data = allMembers.map((m, i) => ({
      ...m,
      srNo: i + 1
    }));

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error("❌ GET DOWNLINE MEMBERS ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch team network members" }, { status: 500 });
  }
}

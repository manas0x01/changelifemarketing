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

    const currentUser = await User.findOne({ username: session.user.username }).select("username userId isBooster leftChild rightChild");

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // If not a booster, they might not see any booster downline
    // (Though they might have descendants who became boosters even if they aren't one yet? 
    // In MLM, usually you can't match booster income if you aren't one, but you can see them).
    // The UI handles the 'Not qualified' message if the response is 400 with specific message.

    // Function to get booster descendants for a branch
    const getBoosterDescendants = async (startUsername: string, position: "Left" | "Right") => {
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
        },
        {
          $project: {
            downline: {
              $filter: {
                input: "$downline",
                as: "member",
                cond: { $eq: ["$$member.isBooster", true] }
              }
            }
          }
        }
      ]);

      if (descendants.length === 0) return [];

      const list = descendants[0].downline || [];
      return list.map((member: any) => {
        let dateStr = "N/A";
        if (member.boosterAchievedAt) {
          const d = new Date(member.boosterAchievedAt);
          dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        } else if (member.createdAt) {
          const d = new Date(member.createdAt);
          dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        }

        return {
          memberId: member.username || member.userId || "N/A",
          name: member.fullName || member.username || "N/A",
          date: dateStr,
          position: position,
          achievedAt: member.boosterAchievedAt || member.createdAt
        };
      });
    };

    const leftBoosters = await getBoosterDescendants(currentUser.leftChild!, "Left");
    const rightBoosters = await getBoosterDescendants(currentUser.rightChild!, "Right");

    const allBoosters = [...leftBoosters, ...rightBoosters];

    // Sort by achieved date descending
    allBoosters.sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime());

    const data = allBoosters.map((m, i) => ({
      srNo: i + 1,
      memberId: m.memberId,
      name: m.name,
      date: m.date,
      position: m.position
    }));

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error("❌ GET BOOSTER DOWNLINE ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch booster members" }, { status: 500 });
  }
}

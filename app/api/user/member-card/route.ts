import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        await connectDB();

        const { userId } = await req.json();

        if (!userId) {
            return Response.json({ error: "User ID required" }, { status: 400 });
        }

        // Fetch the user
        const user = await User.findOne({
            $or: [
                { username: userId },
                { userId: userId },
            ]
        });

        if (!user) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }

        // Count direct left and right members
        const leftCount = user.directMembers?.filter((m: any) => m.position === 'left').length || 0;
        const rightCount = user.directMembers?.filter((m: any) => m.position === 'right').length || 0;
        const totalCount = leftCount + rightCount;

        // Count downline members
        const leftDownline = user.boosterDownlineMembers?.filter((m: any) => m.position === 'left').length || 0;
        const rightDownline = user.boosterDownlineMembers?.filter((m: any) => m.position === 'right').length || 0;

        return Response.json({
            success: true,
            card: {
                id: user.userId || user.username,
                name: user.fullName || user.username || "N/A",
                type: user.basicRank === "booster" ? "booster" : "active",
                sponsorId: user.sponsorId || "—",
                joiningDate: user.joiningDate || "—",
                package: user.registeredPackage || "—",
                leftId: user.leftChild || "—",
                rightId: user.rightChild || "—",
                leftCount: Math.max(leftCount, leftDownline),
                rightCount: Math.max(rightCount, rightDownline),
                totalCount: totalCount || (leftDownline + rightDownline),
                totalDirect: {
                    left: Math.max(leftCount, leftDownline),
                    right: Math.max(rightCount, rightDownline),
                }
            }
        });
    } catch (error) {
        console.error("Member card fetch error:", error);
        return Response.json({ 
            error: error instanceof Error ? error.message : "Failed to fetch member card" 
        }, { status: 500 });
    }
}

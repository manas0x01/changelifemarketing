import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();
        if (!userId || !userId.trim()) {
            return Response.json({ error: "User ID is required" }, { status: 400 });
        }
        await connectDB();
        const user = await User.findOne({
            $or: [
                { userId: userId.trim() },
                { username: userId.trim() }
            ]
        }).select("fullName username userId");
        if (!user) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }
        return Response.json({
            success: true,
            name: user.fullName || user.username || userId,
            userId: user.userId,
            username: user.username
        });
    } catch (error) {
        return Response.json({ 
            error: error instanceof Error ? error.message : "Failed to fetch user name",
        }, { status: 500 });
    }
}

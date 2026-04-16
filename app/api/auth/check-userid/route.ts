import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();
        if (!userId || !userId.trim()) {
            return Response.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }
        await connectDB();
        const existingUser = await User.findOne({ username: userId.trim() });
        if (existingUser) {
            return Response.json(
                { error: "This User ID is already taken. Please choose another one." },
                { status: 409 }
            );
        }
        return Response.json({
            success: true,
            message: "User ID is available",
            userId: userId.trim(),
        });
    } catch (error) {
        return Response.json(
            { error: "Error checking User ID availability" },
            { status: 500 }
        );
    }
}

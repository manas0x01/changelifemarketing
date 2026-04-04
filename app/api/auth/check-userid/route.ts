import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        console.log("🔍 /api/auth/check-userid called");
        console.log(`   User ID received: ${userId}`);

        if (!userId || !userId.trim()) {
            return Response.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if User ID already exists
        const existingUser = await User.findOne({ username: userId.trim() });

        if (existingUser) {
            console.log(`❌ User ID already exists: ${userId}`);
            return Response.json(
                { error: "This User ID is already taken. Please choose another one." },
                { status: 409 }
            );
        }

        console.log(`✅ User ID is available: ${userId}`);

        return Response.json({
            success: true,
            message: "User ID is available",
            userId: userId.trim(),
        });
    } catch (error) {
        console.error("❌ Error checking User ID:", error);
        return Response.json(
            { error: "Error checking User ID availability" },
            { status: 500 }
        );
    }
}

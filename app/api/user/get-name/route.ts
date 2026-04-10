import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        console.log('🔍 [API] GET USER NAME - Starting...');
        const { userId } = await req.json();
        console.log('📝 User ID received:', userId);
        
        if (!userId || !userId.trim()) {
            console.log('❌ User ID is empty');
            return Response.json({ error: "User ID is required" }, { status: 400 });
        }
        
        await connectDB();
        console.log('🔍 Searching for user in database...');
        
        const user = await User.findOne({
            $or: [
                { userId: userId.trim() },
                { username: userId.trim() }
            ]
        }).select("fullName username userId");
        
        if (!user) {
            console.log('❌ User not found:', userId);
            return Response.json({ error: "User not found" }, { status: 404 });
        }
        
        const userName = user.fullName || user.username || userId;
        console.log('✅ User found:', userName);
        
        return Response.json({
            success: true,
            name: userName,
            userId: user.userId,
            username: user.username
        });
    } catch (error) {
        console.error('❌ Error fetching user name:', error);
        return Response.json({ 
            error: error instanceof Error ? error.message : "Failed to fetch user name",
        }, { status: 500 });
    }
}

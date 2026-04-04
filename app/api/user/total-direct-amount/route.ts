import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return Response.json({ success: true, totalDirectAmount: 0 });
        }

        await connectDB();
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return Response.json({ success: true, totalDirectAmount: 0 });
        }

        return Response.json({
            success: true,
            totalDirectAmount: user.totalDirectAmount || 0,
        });
    } catch (error) {
        console.error("Error fetching totalDirectAmount:", error);
        return Response.json({ success: true, totalDirectAmount: 0 });
    }
}

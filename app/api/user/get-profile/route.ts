import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return Response.json({ success: true, user: null });
        }

        await connectDB();
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return Response.json({ success: true, user: null });
        }

        return Response.json({
            success: true,
            user: {
                fullName: user.fullName || "N/A",
                username: user.username || "N/A",
                mobileNo: user.mobileNo || user.phone || "N/A",
                email: user.email || "N/A",
                joiningDate: user.joiningDate || "N/A",
                userId: user._id.toString(),
            },
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return Response.json({ success: true, user: null });
    }
}

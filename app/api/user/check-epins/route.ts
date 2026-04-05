import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const { sponsorId } = await req.json();
        if (!sponsorId || !sponsorId.trim()) {
            return Response.json(
                { error: "Sponsor ID is required" },
                { status: 400 }
            );
        }
        await connectDB();
        const sponsor = await User.findOne({ 
            $or: [
                { username: sponsorId },
                { userId: sponsorId },
                { sponsorId: sponsorId }
            ]
        });
        if (!sponsor) {
            return Response.json(
                { error: "Sponsor ID not found" },
                { status: 404 }
            );
        }
        const availableEPins = sponsor.ePins?.filter((ePin: any) => !ePin.usedDate) || [];
        if (availableEPins.length === 0) {
            return Response.json({
                success: true,
                sponsorName: sponsor.fullName || sponsor.username,
                availableEPins: [],
                message: "No available E-Pins. Please purchase E-Pins first.",
            });
        }
        const response = {
            success: true,
            sponsorName: sponsor.fullName || sponsor.username,
            userId: sponsor._id,
            availableEPins: availableEPins.map((ePin: any) => {
                return {
                    pin: ePin.pin,
                    packageName: ePin.packageName,
                };
            }),
            totalEPins: availableEPins.length,
        };
        return Response.json(response);
    } catch (error) {
        return Response.json(
            { error: "Error checking E-Pins availability" },
            { status: 500 }
        );
    }
}

import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const { sponsorId } = await req.json();

        console.log("🔍 /api/user/check-epins called");
        console.log(`   Sponsor ID received: ${sponsorId}`);

        if (!sponsorId || !sponsorId.trim()) {
            return Response.json(
                { error: "Sponsor ID is required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Find sponsor by username (sponsorId)
        const sponsor = await User.findOne({ 
            $or: [
                { username: sponsorId },
                { userId: sponsorId },
                { sponsorId: sponsorId }
            ]
        });

        console.log(`   Sponsor found: ${sponsor ? sponsor.username : "NOT FOUND"}`);

        if (!sponsor) {
            console.log(`❌ Sponsor not found: ${sponsorId}`);
            return Response.json(
                { error: "Sponsor ID not found" },
                { status: 404 }
            );
        }

        // Check available E-Pins (those without usedDate)
        const availableEPins = sponsor.ePins?.filter((ePin: any) => !ePin.usedDate) || [];
        console.log(`   Available E-Pins count: ${availableEPins.length}`);

        if (availableEPins.length === 0) {
            console.log(`⚠️ No available E-Pins for sponsor: ${sponsor.username}`);
            return Response.json({
                success: true,
                sponsorName: sponsor.fullName || sponsor.username,
                availableEPins: [],
                message: "No available E-Pins. Please purchase E-Pins first.",
            });
        }

        console.log(`✅ Found ${availableEPins.length} available E-Pin(s) for sponsor: ${sponsor.username}`);
        
        const response = {
            success: true,
            sponsorName: sponsor.fullName || sponsor.username,
            userId: sponsor._id,
            availableEPins: availableEPins.map((ePin: any) => {
                console.log(`   📌 E-Pin: ${ePin.pin}, Package: ${ePin.packageName}`);
                return {
                    pin: ePin.pin,
                    packageName: ePin.packageName,
                };
            }),
            totalEPins: availableEPins.length,
        };
        
        console.log("📤 API Response:", response);
        return Response.json(response);
    } catch (error) {
        console.error("❌ Error checking E-Pins:", error);
        return Response.json(
            { error: "Error checking E-Pins availability" },
            { status: 500 }
        );
    }
}

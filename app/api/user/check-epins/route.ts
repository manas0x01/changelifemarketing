import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        console.log('🔍 [API] CHECK E-PINS - Starting...');
        const { sponsorId } = await req.json();
        console.log('📝 Sponsor ID received:', sponsorId);
        
        if (!sponsorId || !sponsorId.trim()) {
            console.log('❌ Sponsor ID is empty');
            return Response.json(
                { error: "Sponsor ID is required" },
                { status: 400 }
            );
        }
        
        await connectDB();
        console.log('🔍 Searching for sponsor in database...');
        
        const sponsor = await User.findOne({ 
            $or: [
                { username: sponsorId },
                { userId: sponsorId },
                { sponsorId: sponsorId }
            ]
        });
        
        if (!sponsor) {
            console.log('❌ Sponsor not found:', sponsorId);
            return Response.json(
                { error: "Sponsor ID not found" },
                { status: 404 }
            );
        }
        
        console.log('✅ Sponsor found:', sponsor.username || sponsor.userId);
        const availableEPins = sponsor.ePins?.filter((ePin: any) => !ePin.usedDate) || [];
        console.log('✅ Total E-Pins:', sponsor.ePins?.length || 0, '| Available:', availableEPins.length);
        
        if (availableEPins.length === 0) {
            console.log('⚠️ No available E-Pins for this sponsor');
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
        console.log('✅ E-PINS check completed successfully:', availableEPins.length, 'pins available');
        return Response.json(response);
    } catch (error) {
        console.error('❌ Error checking E-Pins:', error);
        return Response.json(
            { error: "Error checking E-Pins availability" },
            { status: 500 }
        );
    }
}

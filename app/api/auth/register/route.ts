import { connectDB } from "@/lib/database";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { calculateAndUpdateUserMetrics } from "@/lib/calculateMetrics";
import { autoCalculateBasicIncome } from "@/lib/autoCalculateBasicIncome";

export async function POST(req: Request) {
    try {
        const registrationData = await req.json();

        const {
            userId,
            sponsorId,
            position,
            package: packageName,
            epin,
            fullName,
            gender,
            mobileNo,
            email,
            dateOfBirth,
            panNo,
            state,
            district,
            city,
            address,
            pincode,
            nomineeName,
            nomineeRelation,
            bankName,
            branchName,
            accountNo,
            ifsc,
            accountType,
            password,
        } = registrationData;
        if (!fullName?.trim()) {
            return Response.json({ error: "Full name is required" }, { status: 400 });
        }
        if (!mobileNo?.trim()) {
            return Response.json({ error: "Mobile number is required" }, { status: 400 });
        }
        if (!password?.trim()) {
            return Response.json({ error: "Password is required" }, { status: 400 });
        }
        await connectDB();
        const existingUser = await User.findOne({ mobileNo });
        if (existingUser) {
            return Response.json({ error: "Mobile number already registered" }, { status: 400 });
        }
        const sponsor = await User.findOne({
            $or: [
                { username: sponsorId },
                { userId: sponsorId },
            ]
        });
        if (!sponsor) {
            return Response.json({ error: "Sponsor ID not found" }, { status: 404 });
        }
        const availableEPin = sponsor.ePins?.find((pin: any) => pin.pin === epin && !pin.usedDate);
        if (!availableEPin) {
            return Response.json({ error: "E-Pin not available or already used" }, { status: 400 });
        }

        // 🔄 GET AUTOMATIC PLACEMENT from sponsor's network
        let placementId: string;
        let finalPosition = position.toLowerCase();
        try {
            const autoPlacementResponse = await fetch("http://localhost:3000/api/user/auto-placement", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sponsorId: sponsor.userId || sponsor.username,
                    position: position.toLowerCase(),
                }),
            });

            if (!autoPlacementResponse.ok) {
                console.error("Auto-placement API failed:", autoPlacementResponse.statusText);
                return Response.json(
                    { error: "Could not determine placement position" },
                    { status: 500 }
                );
            }

            const autoPlacementData = await autoPlacementResponse.json();
            placementId = autoPlacementData.placementId;
            finalPosition = autoPlacementData.placementPosition || finalPosition;

            console.log("✅ AUTO-PLACEMENT DETERMINED:", {
                sponsorId: sponsor.userId || sponsor.username,
                requestedPosition: position.toLowerCase(),
                placementId,
                finalPosition,
            });
        } catch (error) {
            console.error("Auto-placement fetch error:", error);
            return Response.json(
                { error: "Failed to determine placement" },
                { status: 500 }
            );
        }

        const lastUser = await User.findOne({ userId: /^CLM2026/ }).sort({ userId: -1 });
        let nextSequence = 1;
        
        if (lastUser?.userId) {
            const match = lastUser.userId.match(/CLM2026(\d+)/);
            if (match) {
                nextSequence = parseInt(match[1]) + 1;
            }
        }
        const autoUserId = `CLM2026${nextSequence}`;
        const finalUserId = userId && userId !== "CLM" ? userId : autoUserId;
        const username = finalUserId; // Username is same as userId
        const existingUserId = await User.findOne({ userId: finalUserId });
        if (existingUserId) {
            return Response.json({ error: "User ID already exists" }, { status: 400 });
        }

        const newUser = new User({
            username,
            userId: finalUserId,
            password,
            fullName,
            gender,
            mobileNo,
            email,
            dateOfBirth,
            panNo,
            state,
            district,
            city,
            address,
            pincode,
            nomineeName,
            nomineeRelation,
            bankName,
            branchName,
            accountNo,
            ifsc,
            accountType,
            sponsorId,
            placementId,
            placementPosition: finalPosition,
            role: "user",
            basicRank: "basic", // Default rank for new users
            joiningDate: new Date().toISOString().split("T")[0],
        });

        console.log("\n🔵 REGISTRATION - USER CREATED:", {
            userId: finalUserId,
            username,
            basicRank: "basic",
            placementId,
            position: finalPosition,
            email,
        });

        await newUser.save();
        console.log("✅ User saved to database:", finalUserId);

        // Mark E-Pin as used
        const pinIndex = sponsor.ePins!.findIndex((pin: any) => pin.pin === epin);
        if (pinIndex !== -1) {
            sponsor.ePins![pinIndex].usedDate = new Date();
            sponsor.ePins![pinIndex].status = 'Used';
            sponsor.ePins![pinIndex].usedByUsername = newUser.username;
            sponsor.ePins![pinIndex].usedByName = fullName;
            
            console.log("✅ E-PIN MARKED AS USED:", {
                ePin: epin,
                usedDate: sponsor.ePins![pinIndex].usedDate,
                usedByUsername: sponsor.ePins![pinIndex].usedByUsername,
                usedByName: sponsor.ePins![pinIndex].usedByName,
                status: sponsor.ePins![pinIndex].status,
            });
            
            await sponsor.save();
            
            console.log("✅ Sponsor user saved. Verifying E-Pin data:");
            const updatedSponsor = await User.findOne({ username: sponsor.username });
            const verifyPin = updatedSponsor?.ePins?.find((p: any) => p.pin === epin);
            console.log("✅ Verified E-Pin from DB:", {
                ePin: verifyPin?.pin,
                usedDate: verifyPin?.usedDate,
                usedByUsername: verifyPin?.usedByUsername,
                usedByName: verifyPin?.usedByName,
            });
        }

        // ✅ ADD NEW MEMBER TO PLACEMENT PARENT'S boosterDownlineMembers & directMembers ARRAYS
        if (placementId) {
            const placementParent = await User.findOne({
                $or: [
                    { username: placementId },
                    { userId: placementId }
                ]
            });

            if (placementParent) {
                console.log("\n🟡 ADDING MEMBER TO PARENT:", {
                    parentId: placementId,
                    newMemberId: newUser.userId,
                    position: finalPosition,
                });

                // ── Add to boosterDownlineMembers ──
                const boosterMemberRecord = {
                    srNo: (placementParent.boosterDownlineMembers?.length || 0) + 1,
                    memberId: newUser.userId || newUser.username || newUser._id.toString(),
                    name: newUser.fullName || newUser.username || 'N/A',
                    date: newUser.joiningDate || new Date().toISOString().split('T')[0],
                    position: (finalPosition === 'left' ? 'left' : 'right') as 'left' | 'right'
                };

                if (!placementParent.boosterDownlineMembers) {
                    placementParent.boosterDownlineMembers = [];
                }
                placementParent.boosterDownlineMembers.push(boosterMemberRecord);
                console.log("✅ Added to boosterDownlineMembers");

                // ── Add to directMembers (for basic income validation) ──
                // ✅ CRITICAL FOR POINTS 3-5 VALIDATION
                const directMemberRecord = {
                    memberId: newUser.userId || newUser.username || newUser._id.toString(),
                    name: newUser.fullName || newUser.username || 'N/A',
                    joinDate: new Date(),  // Current timestamp - MUST include hours/minutes for session detection
                    position: (finalPosition === 'left' ? 'left' : 'right') as 'left' | 'right'
                };

                if (!placementParent.directMembers) {
                    placementParent.directMembers = [];
                }
                placementParent.directMembers.push(directMemberRecord);
                console.log("✅ Added to directMembers:", {
                    totalLeft: placementParent.directMembers.filter(m => m.position === 'left').length,
                    totalRight: placementParent.directMembers.filter(m => m.position === 'right').length,
                    joinDate: directMemberRecord.joinDate,
                });

                await placementParent.save();
                console.log("✅ Parent user updated in database");
            }
        }

        // ── AUTO-CALCULATE METRICS ──
        // Update metrics for all affected users
        try {
            // 1. Calculate basic income for placement parent (if pair is formed)
            if (placementId) {
                console.log("\n🟣 CALLING AUTO-CALCULATE BASIC INCOME:");
                const placementParent = await User.findOne({
                    $or: [
                        { username: placementId },
                        { userId: placementId }
                    ]
                });
                if (placementParent) {
                    console.log("📊 Parent details:", {
                        userId: placementParent.userId,
                        basicRank: placementParent.basicRank,
                        currentBasicIncome: placementParent.basicIncome || 0,
                    });
                    // Auto-calculate basic income if pair is complete in same session
                    const autoCalcResult = await autoCalculateBasicIncome(placementParent._id);
                    console.log("📤 Auto-calc result:", autoCalcResult);
                }
            }

            // 2. Calculate metrics for new user
            await calculateAndUpdateUserMetrics(newUser._id);

            // 3. Calculate metrics for placement parent (to update their team count & income)
            if (placementId) {
                const placementParent = await User.findOne({
                    $or: [
                        { username: placementId },
                        { userId: placementId }
                    ]
                });
                if (placementParent) {
                    await calculateAndUpdateUserMetrics(placementParent._id);
                }
            }

            // 4. Calculate metrics for sponsor
            await calculateAndUpdateUserMetrics(sponsor._id);
        } catch (calcError) {
            console.error('Error calculating metrics after registration:', calcError);
            // Don't fail registration if metrics calculation fails
        }

        return Response.json({
            success: true,
            message: "Registration successful",
            user: {
                id: newUser._id,
                userId: finalUserId,
                username,
                fullName,
            },
        });
    } catch (error) {
        // Handle specific error cases
        if (error instanceof Error) {
            
            if (error.message.includes("password")) {
                return Response.json({ error: "Password hashing failed" }, { status: 500 });
            }
            
            if (error.message.includes("duplicate")) {
                return Response.json({ error: "User already exists" }, { status: 400 });
            }
        }
        
        return Response.json({ 
            error: error instanceof Error ? error.message : "Registration failed",
            details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        }, { status: 500 });
    }
}

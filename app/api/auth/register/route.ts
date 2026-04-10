import { connectDB } from "@/lib/database";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { calculateAndUpdateUserMetrics } from "@/lib/calculateMetrics";
import { autoCalculateBasicIncome } from "@/lib/autoCalculateBasicIncome";

export async function POST(req: Request) {
    try {
        console.log('\n🚀 [API] REGISTRATION - Starting new member registration...');
        const registrationData = await req.json();
        console.log('📋 Registration data received');

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
        
        console.log('📝 Validating required fields...');
        if (!fullName?.trim()) {
            console.log('❌ Full name is required');
            return Response.json({ error: "Full name is required" }, { status: 400 });
        }
        if (!mobileNo?.trim()) {
            console.log('❌ Mobile number is required');
            return Response.json({ error: "Mobile number is required" }, { status: 400 });
        }
        if (!password?.trim()) {
            console.log('❌ Password is required');
            return Response.json({ error: "Password is required" }, { status: 400 });
        }
        console.log('✅ All required fields validated');
        
        await connectDB();
        console.log('✅ Database connected');
        console.log('🔍 Checking for existing user with mobile:', mobileNo);
        const existingUser = await User.findOne({ mobileNo });
        if (existingUser) {
            console.log('❌ Mobile number already registered:', mobileNo);
            return Response.json({ error: "Mobile number already registered" }, { status: 400 });
        }
        console.log('✅ Mobile number is unique');
        
        console.log('🔍 Searching for sponsor:', sponsorId);
        const sponsor = await User.findOne({
            $or: [
                { username: sponsorId },
                { userId: sponsorId },
            ]
        });
        if (!sponsor) {
            console.log('❌ Sponsor not found:', sponsorId);
            return Response.json({ error: "Sponsor ID not found" }, { status: 404 });
        }
        console.log('✅ Sponsor found:', sponsor.username || sponsor.userId);
        
        console.log('🔍 Checking E-PIN availability:', epin);
        const availableEPin = sponsor.ePins?.find((pin: any) => pin.pin === epin && !pin.usedDate);
        if (!availableEPin) {
            console.log('❌ E-Pin not available or already used:', epin);
            return Response.json({ error: "E-Pin not available or already used" }, { status: 400 });
        }
        console.log('✅ E-PIN is available and valid');

        // 🔄 GET AUTOMATIC PLACEMENT from sponsor's network
        console.log('🔍 Determining automatic placement...');
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
                console.error("❌ Auto-placement API failed:", autoPlacementResponse.statusText);
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
            console.error("❌ Auto-placement fetch error:", error);
            return Response.json(
                { error: "Failed to determine placement" },
                { status: 500 }
            );
        }

        console.log('🔍 Generating User ID...');
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
        const username = finalUserId;
        console.log('📝 Generated User ID:', finalUserId);
        
        console.log('🔍 Checking if User ID already exists...');
        const existingUserId = await User.findOne({ userId: finalUserId });
        if (existingUserId) {
            console.log('❌ User ID already exists:', finalUserId);
            return Response.json({ error: "User ID already exists" }, { status: 400 });
        }
        console.log('✅ User ID is unique');
        console.log('🔍 Creating new user object...');
        const cleanEnumField = (value: string | undefined) => {
            if (!value) return undefined;
            const trimmed = value.trim();
  
            if (!trimmed || trimmed === "-- Select --" || trimmed === "-- Select Package --") {
                return undefined;
            }
            return trimmed;
        };

        const cleanedGender = cleanEnumField(gender);
        const cleanedNomineeRelation = cleanEnumField(nomineeRelation);
        const cleanedAccountType = cleanEnumField(accountType);

        console.log('📋 Cleaned enum fields:', {
            gender: cleanedGender,
            nomineeRelation: cleanedNomineeRelation,
            accountType: cleanedAccountType,
        });
        
        // ✅ Build userData object with only valid values
        const userData: any = {
            username,
            userId: finalUserId,
            password,
            fullName,
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
            bankName,
            branchName,
            accountNo,
            ifsc,
            sponsorId,
            placementId,
            placementPosition: finalPosition,
            role: "user",
            basicRank: "basic",
            joiningDate: new Date().toISOString().split("T")[0],
        };

        if (cleanedGender) userData.gender = cleanedGender;
        if (cleanedNomineeRelation) userData.nomineeRelation = cleanedNomineeRelation;
        if (cleanedAccountType) userData.accountType = cleanedAccountType;

        // ✅ FIX: Omitted enum fields must be removed from userData and NOT added to the document
        // This prevents Mongoose from initializing them with defaults
        if (!userData.gender) delete userData.gender;
        if (!userData.nomineeRelation) delete userData.nomineeRelation;
        if (!userData.accountType) delete userData.accountType;

        console.log('📋 Final userData for User creation - enum fields:', { gender: userData.gender, nomineeRelation: userData.nomineeRelation, accountType: userData.accountType });
        const newUser = new User(userData);

        console.log("\n🔵 REGISTRATION - USER CREATED:", {
            userId: finalUserId,
            username,
            basicRank: "basic",
            placementId,
            position: finalPosition,
            email,
        });

        // ✅ Save and handle enum validation errors for optional fields
        try {
            await newUser.save();
            console.log("✅ User saved to database:", finalUserId);
        } catch (saveError: any) {
            // If error is ONLY about missing optional enum fields, retry without validation
            if (saveError.name === 'ValidationError') {
                const enumFieldErrors = Object.keys(saveError.errors || {}).filter(
                    key => ['gender', 'nomineeRelation', 'accountType'].includes(key)
                );
                const otherErrors = Object.keys(saveError.errors || {}).filter(
                    key => !['gender', 'nomineeRelation', 'accountType'].includes(key)
                );
                
                if (enumFieldErrors.length > 0 && otherErrors.length === 0) {
                    // Only optional enum field errors - remove them and retry
                    console.log('⚠️ Optional enum fields failing validation, removing and retrying...', enumFieldErrors);
                    newUser.gender = undefined as any;
                    newUser.nomineeRelation = undefined as any;
                    newUser.accountType = undefined as any;
                    await newUser.save();
                    console.log("✅ User saved to database after removing enum fields:", finalUserId);
                } else {
                    // Real validation error - throw it
                    throw saveError;
                }
            } else {
                throw saveError;
            }
        }

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
            
            // ✅ Save sponsor with same enum field error handling
            try {
                await sponsor.save();
            } catch (sponsorError: any) {
                if (sponsorError.name === 'ValidationError') {
                    const enumFieldErrors = Object.keys(sponsorError.errors || {}).filter(
                        key => ['gender', 'nomineeRelation', 'accountType'].includes(key)
                    );
                    const otherErrors = Object.keys(sponsorError.errors || {}).filter(
                        key => !['gender', 'nomineeRelation', 'accountType'].includes(key)
                    );
                    
                    if (enumFieldErrors.length > 0 && otherErrors.length === 0) {
                        console.log('⚠️ Sponsor enum fields failing validation, removing and retrying...', enumFieldErrors);
                        sponsor.gender = undefined as any;
                        sponsor.nomineeRelation = undefined as any;
                        sponsor.accountType = undefined as any;
                        await sponsor.save();
                    } else {
                        throw sponsorError;
                    }
                } else {
                    throw sponsorError;
                }
            }
            
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
                    newMemberId: newUser.username,
                    position: finalPosition,
                });

                // ── Add to boosterDownlineMembers ──
                const boosterMemberRecord = {
                    srNo: (placementParent.boosterDownlineMembers?.length || 0) + 1,
                    memberId: newUser.username || newUser._id.toString(),
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
                    memberId: newUser.username || newUser._id.toString(),
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

        console.log('🎉 [API] REGISTRATION COMPLETED SUCCESSFULLY!');
        console.log('📋 New User Summary:', {
            userId: finalUserId,
            email,
            mobileNo,
            sponsorId,
            placementId,
        });
        
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
        console.error('❌ [API] REGISTRATION FAILED:');
        
        if (error instanceof Error) {
            console.error('Error Message:', error.message);
            console.error('Error Stack:', error.stack);
            
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

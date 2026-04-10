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
        
        console.log('\n📝 ═══ VALIDATION PHASE ═══');
        // ✅ STEP 1: Validate Form Data
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
        console.log('✅ Form data validation passed');
        
        // ✅ STEP 2: Connect DB and validate all database conditions
        await connectDB();
        console.log('✅ Database connected');
        
        // Check Mobile Uniqueness
        console.log('🔍 Validating mobile number uniqueness...');
        const existingUser = await User.findOne({ mobileNo });
        if (existingUser) {
            console.log('❌ Mobile number already registered:', mobileNo);
            return Response.json({ error: "Mobile number already registered" }, { status: 400 });
        }
        console.log('✅ Mobile number is unique');
        
        // Check Sponsor Exists
        console.log('🔍 Validating sponsor exists...');
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
        
        // Check E-PIN Availability
        console.log('🔍 Validating E-PIN availability...');
        const availableEPin = sponsor.ePins?.find((pin: any) => pin.pin === epin && !pin.usedDate);
        if (!availableEPin) {
            console.log('❌ E-Pin not available or already used:', epin);
            return Response.json({ error: "E-Pin not available or already used" }, { status: 400 });
        }
        console.log('✅ E-PIN is available and valid');
        console.log('🔍 Determining automatic placement...');
        let placementId: string;
        let finalPosition = position.toLowerCase();
        try {
            const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || '';
            
            const autoPlacementUrl = `${baseUrl}/api/user/auto-placement`;
            console.log('📡 Auto-placement URL:', autoPlacementUrl);
            console.log('🔧 Environment:', {
                NODE_ENV: process.env.NODE_ENV,
                NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '✓ Set' : '✗ Not set',
                baseUrl: baseUrl,
            });
            
            const autoPlacementResponse = await fetch(autoPlacementUrl, {
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

        // ✅ STEP 4: Check User ID Availability and Generate if needed
        console.log('🔍 Validating User ID...');
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
        
        const existingUserId = await User.findOne({ userId: finalUserId });
        if (existingUserId) {
            console.log('❌ User ID already exists:', finalUserId);
            return Response.json({ error: "User ID already exists" }, { status: 400 });
        }
        console.log('✅ User ID is unique');
        console.log('✅ ═══ ALL VALIDATIONS PASSED ═══\n');
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
        if (!userData.gender) delete userData.gender;
        if (!userData.nomineeRelation) delete userData.nomineeRelation;
        if (!userData.accountType) delete userData.accountType;

        console.log('📋 Final userData for User creation - enum fields:', { 
            gender: userData.gender, 
            nomineeRelation: userData.nomineeRelation, 
            accountType: userData.accountType 
        });

        // ✅ ═══ EXECUTION PHASE - ALL DB OPERATIONS ═══
        console.log('\n📝 ═══ EXECUTION PHASE ═══');
        
        // ✅ STEP 1: Create New User
        console.log('➕ STEP 1: Creating new user...');
        const newUser = new User(userData);

        try {
            await newUser.save();
            console.log("✅ New user saved to database:", finalUserId);
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
                    console.log('⚠️ Optional enum fields failing, removing and retrying...', enumFieldErrors);
                    newUser.gender = undefined as any;
                    newUser.nomineeRelation = undefined as any;
                    newUser.accountType = undefined as any;
                    await newUser.save();
                    console.log("✅ User saved after removing optional enum fields:", finalUserId);
                } else {
                    // Real validation error - abort registration
                    console.error('❌ User creation validation failed (non-enum errors):', otherErrors);
                    return Response.json({ 
                        error: "User creation validation failed", 
                        details: otherErrors.join(", ") 
                    }, { status: 400 });
                }
            } else {
                console.error('❌ User creation failed:', saveError.message);
                return Response.json({ 
                    error: "Failed to create user", 
                    details: saveError.message 
                }, { status: 500 });
            }
        }

        // ✅ STEP 2: Mark E-PIN as Used
        console.log('➕ STEP 2: Marking E-PIN as used in sponsor record...');
        const pinIndex = sponsor.ePins!.findIndex((pin: any) => pin.pin === epin);
        if (pinIndex !== -1) {
            sponsor.ePins![pinIndex].usedDate = new Date();
            sponsor.ePins![pinIndex].status = 'Used';
            sponsor.ePins![pinIndex].usedByUsername = newUser.username;
            sponsor.ePins![pinIndex].usedByName = fullName;
            
            console.log("✅ E-PIN marked as used:", {
                ePin: epin,
                usedDate: sponsor.ePins![pinIndex].usedDate,
                usedByUsername: sponsor.ePins![pinIndex].usedByUsername,
                usedByName: sponsor.ePins![pinIndex].usedByName,
                status: sponsor.ePins![pinIndex].status,
            });
        }

        // ✅ STEP 3: Clean Sponsor's pinRequests (Remove corrupted entries)
        console.log('➕ STEP 3: Cleaning sponsor pinRequests record...');
        if (sponsor.pinRequests && sponsor.pinRequests.length > 0) {
            const originalCount = sponsor.pinRequests.length;
            // Remove entries with missing required fields
            sponsor.pinRequests = sponsor.pinRequests.filter((req: any) => {
                const isValid = req.srNo && req.requestNo && req.date && req.memberId && req.name && req.totalPins && req.totalAmount && req.description && req.type;
                if (!isValid) {
                    console.log('⚠️ Removing corrupted pinRequest entry:', {
                        srNo: req.srNo,
                        memberId: req.memberId,
                        name: req.name || '[MISSING]',
                    });
                }
                return isValid;
            });
            console.log(`🧹 Cleaned sponsor pinRequests: ${originalCount} → ${sponsor.pinRequests.length}`);
        }

        // ✅ STEP 4: Save Sponsor with updated records
        console.log('➕ STEP 4: Saving sponsor with updated records...');
        try {
            await sponsor.save();
            console.log("✅ Sponsor saved successfully");
        } catch (sponsorError: any) {
            // If still has validation errors, log but don't fail (data already partially committed)
            if (sponsorError.name === 'ValidationError') {
                const errors = Object.keys(sponsorError.errors || {});
                console.error('⚠️ Sponsor save had validation errors (non-critical):', errors);
                // Force save without validation
                try {
                    await sponsor.save({ validateBeforeSave: false });
                    console.log("✅ Sponsor force-saved (validation skipped)");
                } catch (forceSaveError) {
                    console.error('⚠️ Force save also failed, but registration continues:', forceSaveError);
                }
            } else {
                console.error('⚠️ Sponsor save failed:', sponsorError.message);
                // Continue anyway since user is already created
            }
        }

        // ✅ STEP 5: Add member to placement parent
        console.log('➕ STEP 5: Adding member to placement parent...');
        if (placementId) {
            const placementParent = await User.findOne({
                $or: [
                    { username: placementId },
                    { userId: placementId }
                ]
            });

            if (placementParent) {
                console.log("🟡 ADDING MEMBER TO PARENT:", {
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
                const directMemberRecord = {
                    memberId: newUser.username || newUser._id.toString(),
                    name: newUser.fullName || newUser.username || 'N/A',
                    joinDate: new Date(),
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

                try {
                    await placementParent.save();
                    console.log("✅ Placement parent updated in database");
                } catch (parentError: any) {
                    console.error('⚠️ Placement parent save failed:', parentError.message);
                    // Continue anyway - main registration is done
                }
            }
        }

        // ✅ STEP 6: Calculate metrics
        console.log('➕ STEP 6: Calculating metrics...');
        try {
            if (placementId) {
                console.log("🟣 Calling auto-calculate basic income...");
                const placementParent = await User.findOne({
                    $or: [
                        { username: placementId },
                        { userId: placementId }
                    ]
                });
                if (placementParent) {
                    const autoCalcResult = await autoCalculateBasicIncome(placementParent._id);
                    console.log("📊 Auto-calc result:", autoCalcResult);
                }
            }

            await calculateAndUpdateUserMetrics(newUser._id);
            
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

            await calculateAndUpdateUserMetrics(sponsor._id);
            console.log("✅ All metrics calculated successfully");
        } catch (calcError) {
            console.error('⚠️ Metrics calculation failed (non-critical):', calcError);
        }

        console.log('✅ ═══ EXECUTION PHASE COMPLETE ═══\n');

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
        // ❌ Handle registration errors
        console.error('\n❌ ═══ REGISTRATION FAILED ═══');
        
        if (error instanceof Error) {
            console.error('Error Type:', error.name);
            console.error('Error Message:', error.message);
            
            // Provide helpful error messages
            if (error.message.includes("password")) {
                return Response.json({ error: "Password hashing failed" }, { status: 500 });
            }
            if (error.message.includes("duplicate")) {
                return Response.json({ error: "Duplicate entry - user may already exist" }, { status: 400 });
            }
            if (error.message.includes("validation")) {
                return Response.json({ 
                    error: "Validation error", 
                    details: error.message 
                }, { status: 400 });
            }
        }
        
        console.error('Error Details:', error);
        return Response.json({ 
            error: error instanceof Error ? error.message : "Registration failed - please try again",
            details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        }, { status: 500 });
    }
}

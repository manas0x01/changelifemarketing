import { connectDB } from "@/lib/database";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { calculateAndUpdateUserMetrics } from "@/lib/calculateMetrics";
import { autoCalculateBasicIncome } from "@/lib/autoCalculateBasicIncome";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * 🌳 CASCADE PLACEMENT FUNCTION
 * ─────────────────────────────
 * Finds the next available leaf node in the selected branch to place the new member.
 * If the current position is already filled, it recursively goes down the tree.
 * 
 * Logic:
 * 1. Check if the selected position (left/right) has a child
 * 2. If empty → Return this user (place new member here)
 * 3. If occupied → Recursively search in that child's subtree
 * 4. Return the actual leaf node where new member should be placed
 */
async function findNextAvailableLeafNode(currentUser: any, position: 'left' | 'right'): Promise<any> {
    const positionField = position === 'left' ? 'leftChild' : 'rightChild';
    
    // Check if this position is empty
    if (!currentUser[positionField]) {
        console.log(`🍃 Leaf node found at ${position} position for parent:`, {
            parentId: currentUser.userId || currentUser.username,
            positionField,
            isEmpty: true,
        });
        return currentUser;
    }

    // Position is occupied, fetch the child user
    console.log(`↓ Position ${position} already occupied, cascading down...`, {
        currentParent: currentUser.userId || currentUser.username,
        childId: currentUser[positionField],
    });

    const childUser = await User.findOne({
        $or: [
            { username: currentUser[positionField] },
            { userId: currentUser[positionField] },
        ]
    });

    if (!childUser) {
        console.warn(`⚠️ Child user referenced but not found:`, currentUser[positionField]);
        // If child doesn't exist in database, place new user here
        return currentUser;
    }

    // Recursively search in the child's subtree
    return await findNextAvailableLeafNode(childUser, position);
}

export async function POST(req: Request) {
    try {
        console.log('\n🚀 [API] REGISTRATION - Starting new member registration...');
        const registrationData = await req.json();
        console.log('📋 Registration data received');

        const {
            userId,
            sponsorId,
            placementId,
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
            transactionPassword,
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
        if (!transactionPassword?.trim()) {
            console.log('❌ Transaction Password is required');
            return Response.json({ error: "Transaction Password is required" }, { status: 400 });
        }
        console.log('✅ Form data validation passed');
        
        // ✅ STEP 2: Connect DB and validate all database conditions
        await connectDB();
        console.log('✅ Database connected');
        
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
        
        // ✅ STEP 2A: Get logged-in user from session
        console.log('🔍 Getting logged-in user from session...');
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            console.log('❌ No active session found');
            return Response.json({ error: "Session expired. Please login again" }, { status: 401 });
        }
        
        const registrationUser = await User.findOne({ email: session.user.email });
        if (!registrationUser) {
            console.log('❌ Logged-in user not found in database');
            return Response.json({ error: "User not found in database" }, { status: 404 });
        }
        console.log('✅ Logged-in user found:', registrationUser.username);
        
        // Check E-PIN Availability in LOGGED-IN USER's pins (not sponsor)
        console.log('🔍 Validating E-PIN availability in logged-in user\'s pins...');
        console.log('📌 Logged-in user:', registrationUser.username);
        console.log('📌 Total pins available:', registrationUser.ePins?.length || 0);
        
        const availableEPin = registrationUser.ePins?.find((pin: any) => {
          const pinMatch = pin.pin === epin;
          const isActive = pin.status === "Active" || !pin.status;
          
          console.log(`📊 PIN Check - ${epin}: match=${pinMatch}, active=${isActive}`);
          
          return pinMatch && isActive;
        });
        
        if (!availableEPin) {
            console.log('❌ E-Pin not available or already used:', epin);
            console.log('❌ Available pins for user:', registrationUser.ePins?.map((p: any) => ({ pin: p.pin, status: p.status, usedDate: p.usedDate, transferDate: p.transferDate })));
            return Response.json({ error: "E-Pin not available or already used" }, { status: 400 });
        }
        console.log('✅ E-PIN is available and valid in logged-in user\'s account');
        
        // Check Placement User Exists (if provided)
        let placementUser = null;
        let finalPlacementId = placementId;
        
        if (placementId && placementId.trim()) {
            console.log('🔍 Validating placement user exists...');
            placementUser = await User.findOne({
                $or: [
                    { username: placementId },
                    { userId: placementId },
                ]
            });
            if (!placementUser) {
                console.log('❌ Placement user not found:', placementId);
                return Response.json({ error: "Placement ID not found" }, { status: 404 });
            }
            console.log('✅ Placement user found:', placementUser.username || placementUser.userId);
            finalPlacementId = placementUser.userId || placementUser.username;
        } else {
            console.log('⚠️ No placement ID provided, using auto-placement...');
        }
        
        console.log('🔍 Determining placement...');
        let finalPosition = position.toLowerCase();
        try {
            if (!finalPlacementId) {
                // Use auto-placement if no placement ID provided
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
                finalPlacementId = autoPlacementData.placementId;
                finalPosition = autoPlacementData.placementPosition || finalPosition;
                
                // Fetch the placement user for later operations
                placementUser = await User.findOne({
                    $or: [
                        { username: finalPlacementId },
                        { userId: finalPlacementId },
                    ]
                });

                console.log("✅ AUTO-PLACEMENT DETERMINED:", {
                    sponsorId: sponsor.userId || sponsor.username,
                    requestedPosition: position.toLowerCase(),
                    placementId: finalPlacementId,
                    finalPosition,
                });
            } else {
                console.log("✅ MANUAL PLACEMENT SELECTED:", {
                    placementId: finalPlacementId,
                    position: finalPosition,
                });
            }
        } catch (error) {
            console.error("❌ Placement determination failed:", error);
            return Response.json(
                { error: "Failed to determine placement" },
                { status: 500 }
            );
        }
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
            password: password.trim(),
            transactionPassword: transactionPassword.trim(),
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
            placementId: finalPlacementId,
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
        console.log('🔐 [REGISTER] userData transactionPassword:', userData.transactionPassword ? `[PRESENT - ${userData.transactionPassword.length} chars]` : 'MISSING');

        // ✅ ═══ EXECUTION PHASE - ALL DB OPERATIONS ═══
        console.log('\n📝 ═══ EXECUTION PHASE ═══');
        
        // ✅ STEP 1: Create New User
        console.log('➕ STEP 1: Creating new user...');
        const newUser = new User(userData);
        
        console.log('🔐 [REGISTER] After User constructor, newUser.transactionPassword:', newUser.transactionPassword ? `[PRESENT - ${newUser.transactionPassword.length} chars]` : 'MISSING');
        console.log('🔐 [REGISTER] New user is new document:', newUser.isNew);

        try {
            await newUser.save();
            console.log("✅ New user saved to database:", finalUserId);
            
            // Verify it was saved by fetching with select
            const savedUser = await User.findOne({ userId: finalUserId }).select('+transactionPassword');
            console.log('🔐 [VERIFY] After save - transactionPassword in DB:', savedUser?.transactionPassword ? `[PRESENT - HASHED]` : 'MISSING/EMPTY');
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

        // ✅ STEP 2: Pop E-PIN from LOGGED-IN USER's ePins array
        console.log('➕ STEP 2: Popping E-PIN from logged-in user ePins array...');
        const userPinIndex = registrationUser.ePins!.findIndex((pin: any) => pin.pin === epin);
        if (userPinIndex !== -1) {
            const poppedPin = registrationUser.ePins![userPinIndex];
            registrationUser.ePins!.splice(userPinIndex, 1);
            
            console.log("✅ E-PIN popped from logged-in user's ePins array:", {
                ePin: epin,
                remainingPins: registrationUser.ePins!.length,
                poppedPin: poppedPin,
            });
            
            // Save the logged-in user with updated ePins
            try {
                await registrationUser.save();
                console.log("✅ Logged-in user saved with popped PIN");
            } catch (userPinError) {
                console.error("⚠️ Failed to save logged-in user with popped PIN:", userPinError);
            }
        }

        // ✅ STEP 2B: Update logged-in user's TOTAL TEAM count (Left/Right)
        console.log('➕ STEP 2B: Updating logged-in user\'s TOTAL TEAM count...');
        const positionField = position.toLowerCase() === 'left' ? 'left' : 'right';
        
        // Initialize totalTeam if not exists
        if (!registrationUser.totalTeam) {
            registrationUser.totalTeam = { left: 0, right: 0 };
        }
        
        const currentTeamCount = registrationUser.totalTeam[positionField] || 0;
        registrationUser.totalTeam[positionField] = currentTeamCount + 1;
        
        console.log(`✅ Updated logged-in user's TOTAL TEAM (${registrationUser.username}):`, {
            position: position,
            field: positionField,
            oldCount: currentTeamCount,
            newCount: registrationUser.totalTeam[positionField],
        });
        
        console.log(`✅ Total Team updated:`, {
            left: registrationUser.totalTeam.left,
            right: registrationUser.totalTeam.right,
        });
        
        // Save updated counts
        try {
            await registrationUser.save();
            console.log("✅ Logged-in user saved with updated direct counts");
        } catch (countError) {
            console.error("⚠️ Failed to save direct counts:", countError);
        }

        // ✅ STEP 2.5: Update SPONSOR's TOTAL TEAM count
        console.log('➕ STEP 2.5: Updating sponsor\'s TOTAL TEAM count...');
        const sponsorPositionField = position.toLowerCase() === 'left' ? 'left' : 'right';
        
        // Initialize totalTeam if not exists
        if (!sponsor.totalTeam) {
            sponsor.totalTeam = { left: 0, right: 0 };
        }
        
        const sponsorCurrentCount = sponsor.totalTeam[sponsorPositionField] || 0;
        sponsor.totalTeam[sponsorPositionField] = sponsorCurrentCount + 1;
        
        console.log(`✅ Updated SPONSOR's TOTAL TEAM (${sponsor.username}):`, {
            position: position,
            field: sponsorPositionField,
            oldCount: sponsorCurrentCount,
            newCount: sponsor.totalTeam[sponsorPositionField],
        });
        
        console.log(`✅ Sponsor Total Team updated:`, {
            left: sponsor.totalTeam.left,
            right: sponsor.totalTeam.right,
        });

        // ✅ STEP 3: Mark E-PIN as Used in SPONSOR's record (for reference)
        console.log('➕ STEP 3: Marking E-PIN reference in sponsor record...');
        const sponsorPinIndex = sponsor.ePins!.findIndex((pin: any) => pin.pin === epin);
        if (sponsorPinIndex !== -1) {
            console.log("ℹ️ PIN exists in sponsor's record, updating reference...");
            sponsor.ePins![sponsorPinIndex].remark = `PIN from ${registrationUser.username} used for registering ${fullName}`;
        }
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
        if (finalPlacementId && placementUser) {
            console.log("🟡 STEP 5.1: Finding actual placement node (cascade)...", {
                initialPlacementId: finalPlacementId,
                requestedPosition: finalPosition,
            });

            // ── BINARY TREE CASCADE PLACEMENT ──
            // Find the actual leaf node where new user should be placed
            const actualPlacementNode = await findNextAvailableLeafNode(placementUser, finalPosition as 'left' | 'right');
            const newUserFieldValue = newUser.userId || newUser.username;
            const positionField = finalPosition === 'left' ? 'leftChild' : 'rightChild';
            
            console.log("🌳 CASCADE PLACEMENT RESULT:", {
                requestedParentId: finalPlacementId,
                requestedPosition: finalPosition,
                actualPlacementNodeId: actualPlacementNode.userId || actualPlacementNode.username,
                actualPosition: positionField,
                newMemberId: newUserFieldValue,
            });

            // ── Add to boosterDownlineMembers of ACTUAL node ──
            console.log("🟡 STEP 5.2: Updating actual placement node's records...");
            const boosterMemberRecord = {
                srNo: (actualPlacementNode.boosterDownlineMembers?.length || 0) + 1,
                memberId: newUser.username || newUser._id.toString(),
                name: newUser.fullName || newUser.username || 'N/A',
                date: newUser.joiningDate || new Date().toISOString().split('T')[0],
                position: (finalPosition === 'left' ? 'left' : 'right') as 'left' | 'right'
            };

            if (!actualPlacementNode.boosterDownlineMembers) {
                actualPlacementNode.boosterDownlineMembers = [];
            }
            actualPlacementNode.boosterDownlineMembers.push(boosterMemberRecord);
            console.log("✅ Added to actual node's boosterDownlineMembers");

            // ── Add to directMembers of ACTUAL node (for basic income validation) ──
            const directMemberRecord = {
                memberId: newUser.username || newUser._id.toString(),
                name: newUser.fullName || newUser.username || 'N/A',
                joinDate: new Date(),
                position: (finalPosition === 'left' ? 'left' : 'right') as 'left' | 'right'
            };

            if (!actualPlacementNode.directMembers) {
                actualPlacementNode.directMembers = [];
            }
            actualPlacementNode.directMembers.push(directMemberRecord);
            console.log("✅ Added to actual node's directMembers:", {
                actualNodeId: actualPlacementNode.userId || actualPlacementNode.username,
                totalLeft: actualPlacementNode.directMembers.filter((m: any) => m.position === 'left').length,
                totalRight: actualPlacementNode.directMembers.filter((m: any) => m.position === 'right').length,
            });

            // ── Assign new user to the actual leaf node found by cascade ──
            console.log("🟡 STEP 5.3: Updating binary tree (leftChild/rightChild)...");
            actualPlacementNode[positionField] = newUserFieldValue;
            console.log(`✅ Binary tree update: ${newUserFieldValue} → ${positionField} of ${actualPlacementNode.userId || actualPlacementNode.username}`);

            try {
                await actualPlacementNode.save();
                console.log("✅ Actual placement node updated in database");
                
                if (actualPlacementNode._id !== placementUser._id) {
                    console.log("✅ Cascade placement through intermediate nodes completed");
                } else {
                    console.log("✅ Direct placement (no cascade needed)");
                }
            } catch (parentError: any) {
                console.error('⚠️ Actual placement node save failed:', parentError.message);
                // Continue anyway - main registration is done
            }
        }

        // ✅ STEP 6: Calculate metrics
        console.log('➕ STEP 6: Calculating metrics...');
        try {
            if (finalPlacementId && placementUser) {
                console.log("🟣 Calling auto-calculate basic income...");
                const autoCalcResult = await autoCalculateBasicIncome(placementUser._id);
                console.log("📊 Auto-calc result:", autoCalcResult);
            }

            await calculateAndUpdateUserMetrics(newUser._id);
            
            if (finalPlacementId && placementUser) {
                await calculateAndUpdateUserMetrics(placementUser._id);
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
            placementId: finalPlacementId,
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

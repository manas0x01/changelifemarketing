import { connectDB } from '@/lib/database';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { decryptCookieValue } from '@/lib/cookieEncryption';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    console.log('\n🔐 === FETCH PROFILE ===');

    // Get username from encrypted cookie or JWT
    const authToken = req.cookies.get('auth-token')?.value;
    const usernameCookie = req.cookies.get('user-username')?.value;

    let username: string | null = null;

    // Try JWT token first
    if (authToken) {
      try {
        const decodedToken = verifyToken(authToken);
        if (decodedToken?.username) {
          username = decodedToken.username;
          console.log('✅ Username from JWT:', username);
        }
      } catch (error) {
        console.error('❌ JWT verification failed:', error);
      }
    }

    // Fall back to encrypted username cookie
    if (!username && usernameCookie) {
      try {
        username = decryptCookieValue(usernameCookie);
        console.log('✅ Username decrypted from cookie:', username);
      } catch (error) {
        console.error('❌ Error decrypting username:', error);
      }
    }

    if (!username) {
      console.log('❌ No valid authentication found');
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Fetch user profile
    console.log('🔍 Fetching user profile for:', username);
    const user = await User.findOne({ username }).select('-password -transactionPassword -otp -otpExpiry').lean();

    if (!user) {
      console.log('❌ User not found:', username);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User profile fetched successfully');

    // Debug: Log all user fields
    console.log('📊 DEBUG - User object fields:');
    console.log('   joiningDate:', user.joiningDate);
    console.log('   sponsorId:', user.sponsorId);
    console.log('   sponsorName:', user.sponsorName);
    console.log('   placementId:', user.placementId);
    console.log('   placementName:', user.placementName);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user._id,
          username: user.username,
          fullName: user.fullName || '',
          gender: user.gender || 'Male',
          email: user.email || '',
          phone: user.phone || '91',
          mobileNo: user.mobileNo || '',
          dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : '',
          panNo: user.panNo || '',
          state: user.state || 'Bihar',
          district: user.district || 'Patna',
          city: user.city || '',
          address: user.address || '',
          pincode: user.pincode || '',
          bankName: user.bankName || '',
          branchName: user.branchName || '',
          accountNo: user.accountNo || '',
          ifsc: user.ifsc || '',
          accountType: user.accountType || '',
          nomineeName: user.nomineeName || '',
          nomineeRelation: user.nomineeRelation || 'Son',
          joiningDate: user.joiningDate || '',
          sponsorId: user.sponsorId || '',
          sponsorName: user.sponsorName || '',
          placementId: user.placementId || '',
          placementName: user.placementName || '',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    console.log('\n🔐 === UPDATE PROFILE ===');

    // Get username from encrypted cookie or JWT
    const authToken = req.cookies.get('auth-token')?.value;
    const usernameCookie = req.cookies.get('user-username')?.value;

    let username: string | null = null;

    // Try JWT token first
    if (authToken) {
      try {
        const decodedToken = verifyToken(authToken);
        if (decodedToken?.username) {
          username = decodedToken.username;
          console.log('✅ Username from JWT:', username);
        }
      } catch (error) {
        console.error('❌ JWT verification failed:', error);
      }
    }

    // Fall back to encrypted username cookie
    if (!username && usernameCookie) {
      try {
        username = decryptCookieValue(usernameCookie);
        console.log('✅ Username decrypted from cookie:', username);
      } catch (error) {
        console.error('❌ Error decrypting username:', error);
      }
    }

    if (!username) {
      console.log('❌ No valid authentication found');
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const profileData = await req.json();

    console.log('📋 Updating profile with data:', {
      fullName: profileData.fullName,
      email: profileData.email,
      gender: profileData.gender,
    });

    // Validate format only if fields are provided (all fields are optional)
    // Validate mobile number format if provided (must be 10 digits)
    if (profileData.mobileNo && !/^\d{10}$/.test(profileData.mobileNo)) {
      console.log('❌ Invalid mobile number format');
      return NextResponse.json(
        { error: 'Mobile number must be 10 digits' },
        { status: 400 }
      );
    }

    // Validate PAN number format if provided (ABCDE1234F format)
    if (profileData.panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(profileData.panNo)) {
      console.log('❌ Invalid PAN number format');
      return NextResponse.json(
        { error: 'PAN number format is invalid' },
        { status: 400 }
      );
    }

    // Build update object - only include fields that are provided (not undefined)
    const updateData: any = {};
    
    if (profileData.fullName !== undefined) updateData.fullName = profileData.fullName;
    if (profileData.gender !== undefined) updateData.gender = profileData.gender;
    if (profileData.email !== undefined) updateData.email = profileData.email;
    if (profileData.phone !== undefined) updateData.phone = profileData.phone;
    if (profileData.mobileNo !== undefined) updateData.mobileNo = profileData.mobileNo;
    if (profileData.dateOfBirth !== undefined) updateData.dateOfBirth = profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null;
    if (profileData.panNo !== undefined) updateData.panNo = profileData.panNo ? profileData.panNo.toUpperCase() : null;
    if (profileData.state !== undefined) updateData.state = profileData.state;
    if (profileData.district !== undefined) updateData.district = profileData.district;
    if (profileData.city !== undefined) updateData.city = profileData.city;
    if (profileData.address !== undefined) updateData.address = profileData.address;
    if (profileData.pincode !== undefined) updateData.pincode = profileData.pincode;
    if (profileData.bankName !== undefined) updateData.bankName = profileData.bankName;
    if (profileData.branchName !== undefined) updateData.branchName = profileData.branchName;
    if (profileData.accountNo !== undefined) updateData.accountNo = profileData.accountNo;
    if (profileData.ifsc !== undefined) updateData.ifsc = profileData.ifsc;
    if (profileData.accountType !== undefined) updateData.accountType = profileData.accountType;
    if (profileData.nomineeName !== undefined) updateData.nomineeName = profileData.nomineeName;
    if (profileData.nomineeRelation !== undefined) updateData.nomineeRelation = profileData.nomineeRelation;
    if (profileData.joiningDate !== undefined) updateData.joiningDate = profileData.joiningDate;
    if (profileData.sponsorId !== undefined) updateData.sponsorId = profileData.sponsorId;
    if (profileData.sponsorName !== undefined) updateData.sponsorName = profileData.sponsorName;
    if (profileData.placementId !== undefined) updateData.placementId = profileData.placementId;
    if (profileData.placementName !== undefined) updateData.placementName = profileData.placementName;

    console.log('📝 Will update fields:', Object.keys(updateData));

    // Update user
    const user = await User.findOneAndUpdate(
      { username },
      updateData,
      { returnDocument: 'after' }
    ).select('-password -transactionPassword -otp -otpExpiry');

    if (!user) {
      console.log('❌ User not found:', username);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ Profile updated successfully');

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

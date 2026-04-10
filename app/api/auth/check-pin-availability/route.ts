import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API] PIN AVAILABILITY CHECK - Starting...');
    await connectDB();
    const session = await getServerSession(authOptions);
    console.log('📋 Session:', session?.user?.username ? `Authenticated (${session.user.username})` : 'Unauthenticated');

    // For registration page (unauthenticated users), check if ANY admin/system has available pins
    // For logged-in users, check their personal pins
    let user;
    
    if (session?.user?.username) {
      // Authenticated user - check their pins
      console.log('🔍 Checking pins for authenticated user:', session.user.username);
      user = await User.findOne({ username: session.user.username }).select('ePins');
    } else {
      // Unauthenticated user (registration page) - check if system has any available pins
      // Look for any user with available pins in the system
      console.log('🔍 Checking system for any available pins (unauthenticated)');
      user = await User.findOne({ 
        'ePins.usedDate': { $exists: false } 
      }).select('ePins');
    }

    if (!user || !user.ePins || user.ePins.length === 0) {
      console.log('❌ No user found with available pins');
      return NextResponse.json({
        hasPins: false,
        message: 'First Buy The Pin Then Create A Account',
      });
    }

    // Check for available pins (status Active or Transferred, and not used yet)
    const availablePins = user.ePins.filter((pin: any) => !pin.usedDate && (pin.status === 'Active' || pin.status === 'Transferred'));
    console.log('✅ Total E-Pins:', user.ePins.length, '| Available:', availablePins.length);
    
    if (availablePins.length === 0) {
      console.log('❌ No available pins (all used or status not Active/Transferred)');
      return NextResponse.json({
        hasPins: false,
        message: 'No Available Pins. First Buy The Pin Then Create A Account',
      });
    }

    console.log('✅ PIN availability check completed successfully');
    return NextResponse.json({
      hasPins: true,
      totalPins: user.ePins.length,
      availablePins: availablePins.length,
    });
  } catch (error: any) {
    console.error('❌ Error checking pin availability:', error);
    return NextResponse.json(
      { hasPins: false, message: 'Error checking pin availability' },
      { status: 500 }
    );
  }
}

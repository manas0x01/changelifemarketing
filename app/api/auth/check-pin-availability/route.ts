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
    
    // 🔐 Log session details
    console.log('📋 SESSION VERIFICATION:', {
      authenticated: !!session?.user?.username,
      username: session?.user?.username || 'NOT_SET',
      userId: session?.user?.id || 'NOT_SET',
      email: session?.user?.email || 'NOT_SET'
    });

    if (session?.user?.username) {
      // ✅ AUTHENTICATED USER - Check their personal pins
      const username = session.user.username;
      console.log('✅ AUTHENTICATED USER DETECTED:', username);
      
      console.log('🔍 Checking pins for authenticated user:', username);
      const user = await User.findOne({ username }).select('ePins username userId fullName');
      
      if (!user) {
        console.log('❌ User not found in database');
        return NextResponse.json({
          hasPins: false,
          message: 'User not found',
          userNotFound: true,
        }, { status: 404 });
      }

      console.log('👤 User Found:', {
        username: user.username,
        userId: user.userId,
        fullName: user.fullName,
        totalPinsInDB: user.ePins?.length || 0
      });
      
      if (!user.ePins || user.ePins.length === 0) {
        console.log('❌ User has no E-Pins in database');
        return NextResponse.json({
          hasPins: false,
          message: 'You have no E-Pins available',
          userDetails: {
            username: user.username,
            userId: user.userId,
            totalPins: 0
          }
        });
      }

      const availablePins = user.ePins.filter((pin: any) => 
        !pin.usedDate && (pin.status === 'Active' || pin.status === 'Transferred')
      );
      
      console.log('✅ PIN ANALYSIS FOR AUTHENTICATED USER:', {
        username: user.username,
        userId: user.userId,
        totalPins: user.ePins.length,
        availablePins: availablePins.length,
        usedPins: user.ePins.filter((p: any) => p.usedDate).length,
        pinDetails: availablePins.slice(0, 5).map((p: any) => ({
          pin: p.pin,
          status: p.status,
          usedDate: p.usedDate ? '✗ Used' : '✓ Available'
        }))
      });
      
      if (availablePins.length === 0) {
        console.log('⚠️ User has no available pins (all used)');
        return NextResponse.json({
          hasPins: false,
          message: 'All your E-Pins are used. Please buy more pins.',
          userDetails: {
            username: user.username,
            userId: user.userId,
            totalPins: user.ePins.length,
            availablePins: 0
          }
        });
      }

      console.log('✅ SUCCESS - User has available pins');
      return NextResponse.json({
        hasPins: true,
        totalPins: user.ePins.length,
        availablePins: availablePins.length,
        userDetails: {
          username: user.username,
          userId: user.userId,
          fullName: user.fullName
        }
      });
    } else {
      // ✅ UNAUTHENTICATED USER (Registration) - Count TOTAL available pins in system
      console.log('� UNAUTHENTICATED USER - Checking system-wide pins');
      
      // Find ALL users and count total available pins
      const users = await User.find().select('ePins username fullName userId');
      console.log(`📊 SYSTEM SCAN: Total users in database: ${users.length}`);
      
      let totalAvailablePins = 0;
      let usersWithPins: any[] = [];
      let pinStats = {
        totalUsers: users.length,
        usersWithPins: 0,
        usersWithAvailablePins: 0,
        totalPinsInSystem: 0,
        totalUsedPins: 0,
      };

      users.forEach((user: any) => {
        if (user.ePins && user.ePins.length > 0) {
          pinStats.usersWithPins++;
          pinStats.totalPinsInSystem += user.ePins.length;
          
          const available = user.ePins.filter((pin: any) => 
            !pin.usedDate && (pin.status === 'Active' || pin.status === 'Transferred')
          );
          
          const used = user.ePins.filter((p: any) => p.usedDate);
          pinStats.totalUsedPins += used.length;
          
          if (available.length > 0) {
            pinStats.usersWithAvailablePins++;
            totalAvailablePins += available.length;
            usersWithPins.push({
              userId: user.userId || user.username || user._id.toString(),
              username: user.username,
              name: user.fullName || 'N/A',
              totalPins: user.ePins.length,
              availablePins: available.length,
              usedPins: used.length
            });
            
            console.log(`📌 User: ${user.fullName || user.username} | Total: ${user.ePins.length} | Available: ${available.length} | Used: ${used.length}`);
          }
        }
      });

      console.log(`📊 SYSTEM PIN STATISTICS:`, pinStats);
      console.log(`✅ Total Available Pins in System: ${totalAvailablePins}`);
      console.log(`👥 Users with Available Pins: ${usersWithPins.length}`);

      if (totalAvailablePins === 0) {
        console.log('❌ NO PINS AVAILABLE IN ENTIRE SYSTEM');
        return NextResponse.json({
          hasPins: false,
          message: 'No Available Pins in System. Please buy pins first.',
          systemStats: pinStats
        });
      }

      console.log('✅ SUCCESS - System has available pins');
      return NextResponse.json({
        hasPins: true,
        totalAvailablePins,
        systemStats: pinStats,
        usersWithPins: usersWithPins.slice(0, 10) // Show top 10 users with pins
      });
    }
  } catch (error: any) {
    console.error('❌ Error checking pin availability:', error);
    return NextResponse.json(
      { hasPins: false, message: 'Error checking pin availability' },
      { status: 500 }
    );
  }
}

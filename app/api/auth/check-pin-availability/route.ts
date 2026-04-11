import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (session?.user?.username) {
      const username = session.user.username;
      const user = await User.findOne({ username }).select('ePins username userId fullName');
      if (!user) {
        return NextResponse.json({
          hasPins: false,
          message: 'User not found',
          userNotFound: true,
        }, { status: 404 });
      }
      if (!user.ePins || user.ePins.length === 0) {
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
      if (availablePins.length === 0) {
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
      const users = await User.find().select('ePins username fullName userId');
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
          }
        }
      });
      if (totalAvailablePins === 0) {
        return NextResponse.json({
          hasPins: false,
          message: 'No Available Pins in System. Please buy pins first.',
          systemStats: pinStats
        });
      }
      return NextResponse.json({
        hasPins: true,
        totalAvailablePins,
        systemStats: pinStats,
        usersWithPins: usersWithPins.slice(0, 10) 
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { hasPins: false, message: 'Error checking pin availability' },
      { status: 500 }
    );
  }
}

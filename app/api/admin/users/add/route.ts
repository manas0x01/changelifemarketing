import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { username, password, email, fullName, mobileNo, role = 'user', memberType = 'active' } = await req.json();

    // ── Validation ──
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (mobileNo && mobileNo.length !== 10) {
      return NextResponse.json(
        { message: 'Mobile number must be 10 digits' },
        { status: 400 }
      );
    }

    // ── Check for existing user ──
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Username or email already exists' },
        { status: 409 }
      );
    }

    // ── Create new user ──
    const newUser = new User({
      username,
      password,
      email,
      fullName,
      mobileNo,
      role,
      memberType,
      joiningDate: new Date().toLocaleDateString('en-IN'),
    });

    await newUser.save();

    return NextResponse.json(
      { 
        message: 'User created successfully', 
        user: {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          fullName: newUser.fullName,
          mobileNo: newUser.mobileNo,
          role: newUser.role,
          memberType: newUser.memberType,
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? 'Failed to create user' },
      { status: 500 }
    );
  }
}

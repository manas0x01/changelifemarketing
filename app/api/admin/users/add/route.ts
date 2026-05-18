import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { username, password, email, fullName, mobileNo, role = 'user', memberType = 'active', transactionPassword } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 5) {
      return NextResponse.json(
        { message: 'Password must be at least 5 characters' },
        { status: 400 }
      );
    }

    if (mobileNo && mobileNo.length !== 10) {
      return NextResponse.json(
        { message: 'Mobile number must be 10 digits' },
        { status: 400 }
      );
    }
    
    if (!transactionPassword || !String(transactionPassword).trim()) {
      return NextResponse.json(
        { message: 'Transaction Password is required' },
        { status: 400 }
      );
    }
    if (String(transactionPassword).trim().length < 6) {
      return NextResponse.json(
        { message: 'Transaction Password must be at least 6 characters' },
        { status: 400 }
      );
    }
    
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Username already exists' },
        { status: 409 }
      );
    }
    const newUser = new User({
      username,
      userId: username,
      password,
      email,
      fullName,
      mobileNo,
      role,
      memberType,
      transactionPassword: String(transactionPassword).trim(),
      joiningDate: "",
    });

    try {
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
        },
        rawPassword: password,
        rawTransactionPassword: transactionPassword,
      },
      { status: 201 }
      );
    } catch (err: any) {
      if (err && err.code === 11000) {
        const field = Object.keys(err.keyValue || {}).join(', ') || 'field';
        return NextResponse.json({ message: `${field} already exists` }, { status: 409 });
      }
      throw err;
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? 'Failed to create user' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  console.log('📨 [API] validate-transaction-password route called');
  console.log('📨 [REQUEST] Method:', request.method);
  console.log('📨 [REQUEST] URL:', request.url);
  
  try {
    // Get the session to identify the logged-in user
    console.log('🔑 [AUTH] Getting session...');
    const session = await getServerSession();
    console.log('🔑 [AUTH] Session:', session ? 'Found' : 'Not found');

    if (!session || !session.user) {
      console.log('❌ [ERROR] No session or user in session');
      return NextResponse.json(
        { error: 'Not authenticated. Please log in first.' },
        { status: 401 }
      );
    }

    // Get username from session
    console.log('👤 [USER] Full session.user:', session.user);
    const username = session.user.username || session.user.name || session.user.email;
    const userEmail = session.user.email;
    console.log('👤 [USER] Username from session:', username);
    console.log('👤 [USER] Email from session:', userEmail);
    console.log('👤 [USER] Session user.username:', session.user.username);
    console.log('👤 [USER] Session user.name:', session.user.name);
    console.log('👤 [USER] Session user.email:', session.user.email);
    
    if (!username && !userEmail) {
      console.log('❌ [ERROR] No username or email in session');
      return NextResponse.json(
        { error: 'User information not found in session' },
        { status: 400 }
      );
    }

    // Parse request body
    console.log('📦 [BODY] Parsing request body...');
    const { transactionPassword } = await request.json();
    console.log('📦 [BODY] Transaction password received:', transactionPassword ? 'Yes' : 'No');

    if (!transactionPassword) {
      console.log('❌ [ERROR] No transaction password provided');
      return NextResponse.json(
        { error: 'Transaction password is required' },
        { status: 400 }
      );
    }

    // Connect to database
    console.log('🔌 [DB] Connecting to database...');
    await connectDB();
    console.log('🔌 [DB] Connected');

    // Build search query - prioritize by email if username is not available
    const searchQuery: any = {};
    if (session.user.username) {
      searchQuery.username = session.user.username;
      console.log('🔍 [DB] Primary search: by username');
    } else if (userEmail) {
      searchQuery.email = userEmail;
      console.log('🔍 [DB] Primary search: by email (username not in session)');
    } else {
      searchQuery.$or = [
        { userId: username },
        { email: userEmail },
        { mobileNo: username }
      ];
      console.log('🔍 [DB] Primary search: by multiple fields');
    }

    // Find user with transaction password selected
    console.log('🔍 [DB] Finding user with query:', searchQuery);
    let user = await User.findOne(searchQuery).select('+transactionPassword');
    
    // If not found, try alternate searches
    if (!user && (username || userEmail)) {
      console.log('🔍 [DB] User not found by primary method, trying alternate fields...');
      user = await User.findOne({
        $or: [
          { username: username },
          { email: userEmail },
          { userId: username },
          { mobileNo: username }
        ]
      }).select('+transactionPassword');
      console.log('🔍 [DB] Alternate search result:', user ? 'Found' : 'Not found');
    }
    
    console.log('🔍 [DB] User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('🔍 [DB] User details - username:', user.username, 'email:', user.email, 'fullName:', user.fullName);
    }

    if (!user) {
      console.log('❌ [ERROR] User not found in database');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has set a transaction password
    console.log('🔐 [PASS] Checking transaction password...');
    if (!user.transactionPassword) {
      console.log('❌ [ERROR] User has no transaction password set');
      return NextResponse.json(
        { 
          error: 'No transaction password set',
          message: 'Please set a transaction password in your profile first'
        },
        { status: 401 }
      );
    }

    // Verify transaction password using bcrypt comparison
    console.log('🔐 [PASS] Verifying transaction password...');
    const isPasswordValid = await user.compareTransactionPassword(transactionPassword);
    console.log('🔐 [PASS] Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ [ERROR] Transaction password is incorrect');
      return NextResponse.json(
        { error: 'Transaction password is incorrect' },
        { status: 401 }
      );
    }

    // Check if user has available EPINs (status should be 'Active' only)
    console.log('📌 [PIN] Checking available pins...');
    const userEPins = user.ePins || [];
    console.log('📌 [PIN] Total pins:', userEPins.length);
    
    const availableEPins = userEPins.filter((pin: any) => {
      // Consider a pin as available if it's Active
      return pin.status === 'Active' || !pin.status;
    });
    
    console.log('📌 [PIN] Available pins:', availableEPins.length);

    if (!availableEPins || availableEPins.length === 0) {
      console.log('❌ [ERROR] No available pins');
      return NextResponse.json(
        {
          error: 'no_pins_available',
          message: "You don't have a pin. First purchase a pin then create a new account",
          hasPins: false
        },
        { status: 200 }
      );
    }

    // Everything is valid
    console.log('✅ [SUCCESS] Transaction password validated successfully');
    return NextResponse.json(
      {
        success: true,
        message: 'Transaction password validated successfully',
        hasPins: true,
        userId: user.userId,
        userName: user.fullName
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ [CATCH] Error validating transaction password:', error);
    console.error('❌ [CATCH] Error message:', (error as any)?.message);
    console.error('❌ [CATCH] Error stack:', (error as any)?.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as any)?.message },
      { status: 500 }
    );
  }
}

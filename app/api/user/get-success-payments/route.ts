// Finalized Success Payments API
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/database';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ username: session.user.username });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Aggregate income records by session (date + type)
    const sessionsMap = new Map<string, {
      date: Date,
      sessionType: 'morning' | 'evening',
      basicIncome: number,
      boosterIncome: number
    }>();

    // Process Basic/Silver Income
    if (Array.isArray(user.sessionBasedIncome)) {
      user.sessionBasedIncome.forEach((record: any) => {
        try {
          const d = new Date(record.date);
          if (isNaN(d.getTime())) return; // skip records with invalid dates
          const sessionType = record.sessionType === 'morning' ? 'morning' : 'evening';
          const key = `${d.toISOString().split('T')[0]}_${sessionType}`;
          if (!sessionsMap.has(key)) {
            sessionsMap.set(key, { date: d, sessionType, basicIncome: 0, boosterIncome: 0 });
          }
          const entry = sessionsMap.get(key)!;
          entry.basicIncome += Number(record.netIncome) || 0;
        } catch (e) {
          console.warn('[GET_SUCCESS_PAYMENTS] Skipping bad sessionBasedIncome record:', e);
        }
      });
    }

    // Process Booster/Gold Income
    if (Array.isArray(user.boosterMatchingRecords)) {
      user.boosterMatchingRecords.forEach((record: any) => {
        try {
          const d = new Date(record.date);
          if (isNaN(d.getTime())) return; // skip records with invalid dates
          const sessionType = record.sessionType === 'morning' ? 'morning' : 'evening';
          const key = `${d.toISOString().split('T')[0]}_${sessionType}`;
          if (!sessionsMap.has(key)) {
            sessionsMap.set(key, { date: d, sessionType, basicIncome: 0, boosterIncome: 0 });
          }
          const entry = sessionsMap.get(key)!;
          entry.boosterIncome += Number(record.netIncome) || Number(record.income) || 0;
        } catch (e) {
          console.warn('[GET_SUCCESS_PAYMENTS] Skipping bad boosterMatchingRecords record:', e);
        }
      });
    }

    // Convert map to sorted array and calculate derived fields
    const payments = Array.from(sessionsMap.values())
      .filter(sess => (sess.basicIncome + sess.boosterIncome) > 0)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((sess, index, arr) => {
        const total = sess.basicIncome + sess.boosterIncome;

        // Logical Calculations as per Invoice standard:
        // Admin Processing & Delivery Charges = 18%
        // TDS = 2%
        // Netpay = 80%
        const adminProcessing = Math.round(total * 0.18);
        const tds = Math.round(total * 0.02);
        const netpay = total - adminProcessing - tds;
        const reimbursement = 0; // Legacy field, setting to 0

        // Date formatting for the table:
        // Morning: 12:00:00 AM to 11:59:59 AM
        // Evening: 12:00:00 PM to 11:59:59 PM
        const d = sess.date;
        const istDate = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
        const dateStr = `${istDate.getUTCMonth() + 1}/${istDate.getUTCDate()}/${istDate.getUTCFullYear()}`;

        const fromTime = sess.sessionType === 'morning' ? "12:00:00 AM" : "12:00:00 PM";
        const toTime   = sess.sessionType === 'morning' ? "11:59:59 AM" : "11:59:59 PM";

        return {
          srNo: arr.length - index,
          fromDate: `${dateStr} ${fromTime}`,
          toDate: `${dateStr} ${toTime}`,
          basicIncome: sess.basicIncome,
          boosterIncome: sess.boosterIncome,
          total: total,
          adminProcessing: adminProcessing,
          reimbursement: reimbursement,
          tds: tds,
          netpay: netpay,
          userId: user.username // For invoice link
        };
      })
      .sort((a, b) => b.srNo - a.srNo); // Keep srNo descending for display

    return NextResponse.json({ success: true, payments });
  } catch (error) {
    console.error('[GET_SUCCESS_PAYMENTS_API] Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}


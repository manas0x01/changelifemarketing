// Finalized Success Payments API
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/database';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

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
    if (user.sessionBasedIncome) {
      user.sessionBasedIncome.forEach((record: any) => {
        const d = new Date(record.date);
        const key = `${d.toISOString().split('T')[0]}_${record.sessionType}`;
        if (!sessionsMap.has(key)) {
          sessionsMap.set(key, { date: d, sessionType: record.sessionType, basicIncome: 0, boosterIncome: 0 });
        }
        const entry = sessionsMap.get(key)!;
        entry.basicIncome += record.netIncome || 0;
      });
    }

    // Process Booster/Gold Income
    if (user.boosterMatchingRecords) {
      user.boosterMatchingRecords.forEach((record: any) => {
        const d = new Date(record.date);
        const key = `${d.toISOString().split('T')[0]}_${record.sessionType}`;
        if (!sessionsMap.has(key)) {
          sessionsMap.set(key, { date: d, sessionType: record.sessionType, basicIncome: 0, boosterIncome: 0 });
        }
        const entry = sessionsMap.get(key)!;
        // Some records use 'income', others 'netIncome' or 'grossIncome'. 
        // Based on models/User.ts, boosterMatchingRecords has 'netIncome'.
        entry.boosterIncome += record.netIncome || record.income || 0;
      });
    }

    // Convert map to sorted array and calculate derived fields
    const payments = Array.from(sessionsMap.values())
      .filter(sess => (sess.basicIncome + sess.boosterIncome) > 0)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((sess, index, arr) => {
        const total = sess.basicIncome + sess.boosterIncome;
        
        // Logical Calculations as per Invoice standard:
        // Admin & Processing = 18%
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
        const dateStr = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
        
        let fromTime = sess.sessionType === 'morning' ? "12:00:00 AM" : "12:00:00 PM";
        let toTime = sess.sessionType === 'morning' ? "11:59:59 AM" : "11:59:59 PM";

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
    console.error('[GET_SUCCESS_PAYMENTS_API]', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

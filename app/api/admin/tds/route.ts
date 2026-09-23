import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database';
import User from '@/models/User';
import Setting from '@/models/Setting';
import TdsRecord from '@/models/TdsRecord';
import { verifyAdminPermission } from '@/lib/auth';

function getFinancialYear(date: Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Unknown';
  const year = d.getFullYear();
  const month = d.getMonth(); // 0 = Jan, 3 = April
  return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await verifyAdminPermission();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const fyFilter = searchParams.get('fy') || 'all';
    const monthFilter = searchParams.get('month') || 'all';
    const statusFilter = searchParams.get('status') || 'all';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const viewMode = searchParams.get('view') || 'summary'; // 'summary' (leader-wise) or 'detailed' (transaction-wise)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const isExport = searchParams.get('limit') === '-1';
    const limit = isExport ? 100000 : Math.min(100, parseInt(searchParams.get('limit') || '25'));
    const skip = isExport ? 0 : (page - 1) * limit;

    // 1. Fetch active TDS configuration
    const settingDoc = (await Setting.findOne({ key: 'tds_config' }).lean()) as any;
    const activeTdsRate = Number(settingDoc?.value?.tdsRate) >= 0 ? Number(settingDoc.value.tdsRate) : 2;
    const deductorInfo = settingDoc?.value || {
      deductorName: 'Change Life Marketing',
      deductorPan: 'HYDKW0218G',
      deductorTan: 'DELC12345A',
      deductorAddress: 'Patna, Bihar, India',
    };

    // 2. Fetch existing saved TdsRecord overrides
    const savedRecords = await TdsRecord.find().lean();
    const statusMap = new Map<string, any>();
    savedRecords.forEach((rec: any) => {
      // Key can be by recordKey or by userId_fy
      if (rec.recordKey) statusMap.set(rec.recordKey, rec);
      if (rec.userId) statusMap.set(`${rec.userId}_${rec.financialYear}`, rec);
    });

    // 3. Fetch users with earnings
    const users = await User.find({
      $or: [
        { 'sessionBasedIncome.0': { $exists: true } },
        { 'boosterMatchingRecords.0': { $exists: true } },
      ],
    })
      .select(
        'username userId fullName panNo mobileNo phone city district state address bankName accountNo ifsc branchName sessionBasedIncome boosterMatchingRecords'
      )
      .lean();

    const fromDateObj = dateFrom ? new Date(dateFrom) : null;
    const toDateObj = dateTo ? new Date(new Date(dateTo).setHours(23, 59, 59, 999)) : null;

    const availableFys = new Set<string>();
    const allDetailedTransactions: any[] = [];
    const leaderMap = new Map<string, any>();

    users.forEach((u: any) => {
      const uId = u.userId || u.username;
      const uFullName = (u.fullName && String(u.fullName).trim()) ? String(u.fullName).trim() : (u.username || u.userId || 'N/A');
      const uName = uFullName;
      const pan = (u.panNo || '').trim().toUpperCase() || 'NOT PROVIDED';
      const mobile = u.mobileNo || u.phone || 'N/A';
      const loc = [u.city, u.district, u.state].filter(Boolean).join(', ') || 'N/A';
      const bankDetails = {
        bankName: u.bankName || 'N/A',
        accountNo: u.accountNo || 'N/A',
        ifsc: u.ifsc || 'N/A',
      };

      const userTransactions: any[] = [];

      // Process Basic Session Income
      if (Array.isArray(u.sessionBasedIncome)) {
        u.sessionBasedIncome.forEach((s: any, idx: number) => {
          const amt = Number(s.netIncome) || Number(s.grossIncome) || 0;
          if (amt <= 0 || !s.date) return;
          const d = new Date(s.date);
          if (isNaN(d.getTime())) return;

          const fy = getFinancialYear(d);
          availableFys.add(fy);
          const periodMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

          const tRecordKey = `${uId}_session_${s._id || idx}_${d.toISOString().split('T')[0]}`;
          const savedOverride = statusMap.get(tRecordKey) || statusMap.get(`${uId}_${fy}`);
          const recStatus = savedOverride?.status || 'Pending';
          const recRate = savedOverride?.tdsRate ?? activeTdsRate;
          const tdsAmt = Math.round(amt * (recRate / 100));
          const netAmt = amt - tdsAmt;

          userTransactions.push({
            id: tRecordKey,
            userId: uId,
            userName: uName,
            panNo: pan,
            mobileNo: mobile,
            location: loc,
            bankDetails,
            incomeType: `Basic / Silver (${s.sessionType || 'Session'})`,
            totalCommission: amt,
            tdsRate: recRate,
            tdsAmount: tdsAmt,
            netPayable: netAmt,
            paymentDate: d.toISOString(),
            dateStr: d.toISOString().split('T')[0],
            financialYear: fy,
            periodMonth,
            status: recStatus,
            challanNo: savedOverride?.challanNo || '',
            acknowledgementNo: savedOverride?.acknowledgementNo || '',
            remarks: savedOverride?.remarks || '',
          });
        });
      }

      // Process Booster Income
      if (Array.isArray(u.boosterMatchingRecords)) {
        u.boosterMatchingRecords.forEach((b: any, idx: number) => {
          const amt = Number(b.netIncome) || Number(b.income) || 0;
          if (amt <= 0 || !b.date || b.status === 'Hold') return;
          const d = new Date(b.date);
          if (isNaN(d.getTime())) return;

          const fy = getFinancialYear(d);
          availableFys.add(fy);
          const periodMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

          const tRecordKey = `${uId}_booster_${b._id || idx}_${d.toISOString().split('T')[0]}`;
          const savedOverride = statusMap.get(tRecordKey) || statusMap.get(`${uId}_${fy}`);
          const recStatus = savedOverride?.status || 'Pending';
          const recRate = savedOverride?.tdsRate ?? activeTdsRate;
          const tdsAmt = Math.round(amt * (recRate / 100));
          const netAmt = amt - tdsAmt;

          userTransactions.push({
            id: tRecordKey,
            userId: uId,
            userName: uName,
            panNo: pan,
            mobileNo: mobile,
            location: loc,
            bankDetails,
            incomeType: 'Booster / Gold Income',
            totalCommission: amt,
            tdsRate: recRate,
            tdsAmount: tdsAmt,
            netPayable: netAmt,
            paymentDate: d.toISOString(),
            dateStr: d.toISOString().split('T')[0],
            financialYear: fy,
            periodMonth,
            status: recStatus,
            challanNo: savedOverride?.challanNo || '',
            acknowledgementNo: savedOverride?.acknowledgementNo || '',
            remarks: savedOverride?.remarks || '',
          });
        });
      }

      if (userTransactions.length === 0) return;

      // Filter transactions based on date/month/fy criteria
      const filteredTransactions = userTransactions.filter((t) => {
        if (fyFilter !== 'all' && t.financialYear !== fyFilter) return false;
        if (monthFilter !== 'all' && t.periodMonth !== monthFilter) return false;
        if (fromDateObj && new Date(t.paymentDate) < fromDateObj) return false;
        if (toDateObj && new Date(t.paymentDate) > toDateObj) return false;
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        return true;
      });

      if (filteredTransactions.length === 0) return;

      // Add to all transactions list (for detailed mode or exports)
      allDetailedTransactions.push(...filteredTransactions);

      // Aggregate into Leader summary
      const leaderCommission = filteredTransactions.reduce((acc, cur) => acc + cur.totalCommission, 0);
      const leaderTds = filteredTransactions.reduce((acc, cur) => acc + cur.tdsAmount, 0);
      const leaderNet = filteredTransactions.reduce((acc, cur) => acc + cur.netPayable, 0);
      const sortedDates = [...filteredTransactions]
        .map((t) => t.dateStr)
        .sort((a, b) => b.localeCompare(a));
      const latestDateStr = sortedDates[0];
      const uniqueDates = [...new Set(sortedDates)];

      // Leader level status override
      const leaderSaved = statusMap.get(`${uId}_${fyFilter !== 'all' ? fyFilter : 'overall'}`);
      let aggregateStatus = leaderSaved?.status;
      if (!aggregateStatus) {
        const statuses = filteredTransactions.map((t) => t.status);
        if (statuses.every((s) => s === 'Filed')) aggregateStatus = 'Filed';
        else if (statuses.every((s) => s === 'Paid')) aggregateStatus = 'Paid';
        else if (statuses.some((s) => s === 'Filed')) aggregateStatus = 'Filed';
        else if (statuses.some((s) => s === 'Paid')) aggregateStatus = 'Paid';
        else aggregateStatus = 'Pending';
      }

      leaderMap.set(uId, {
        userId: uId,
        userName: uName,
        panNo: pan,
        mobileNo: mobile,
        location: loc,
        bankDetails,
        totalCommission: leaderCommission,
        tdsRate: activeTdsRate,
        tdsAmount: leaderTds,
        netPayable: leaderNet,
        paymentDate: latestDateStr,
        paymentDates: uniqueDates,
        datesCount: uniqueDates.length,
        financialYear: fyFilter !== 'all' ? fyFilter : getFinancialYear(new Date(latestDateStr)),
        status: aggregateStatus,
        challanNo: leaderSaved?.challanNo || '',
        acknowledgementNo: leaderSaved?.acknowledgementNo || '',
        remarks: leaderSaved?.remarks || '',
        transactionCount: filteredTransactions.length,
        transactions: filteredTransactions,
      });
    });

    let records: any[] = [];
    if (viewMode === 'detailed') {
      records = allDetailedTransactions;
    } else {
      records = Array.from(leaderMap.values());
    }

    // Apply search filter
    if (search) {
      records = records.filter((r) => {
        return (
          r.userId.toLowerCase().includes(search) ||
          r.userName.toLowerCase().includes(search) ||
          r.panNo.toLowerCase().includes(search) ||
          r.mobileNo.toLowerCase().includes(search) ||
          (r.location && r.location.toLowerCase().includes(search))
        );
      });
    }

    // Sort descending by totalCommission or paymentDate
    records.sort((a, b) => b.totalCommission - a.totalCommission);

    // Compute Summary Counters from the filtered records
    let totalCommission = 0;
    let totalTdsDeducted = 0;
    let totalNetPaid = 0;
    const leaderSet = new Set<string>();
    const statusCounts = { pending: 0, paid: 0, filed: 0 };

    if (viewMode === 'detailed') {
      records.forEach((r) => {
        totalCommission += r.totalCommission;
        totalTdsDeducted += r.tdsAmount;
        totalNetPaid += r.netPayable;
        leaderSet.add(r.userId);
        if (r.status === 'Filed') statusCounts.filed++;
        else if (r.status === 'Paid') statusCounts.paid++;
        else statusCounts.pending++;
      });
    } else {
      records.forEach((r) => {
        totalCommission += r.totalCommission;
        totalTdsDeducted += r.tdsAmount;
        totalNetPaid += r.netPayable;
        leaderSet.add(r.userId);
        if (r.status === 'Filed') statusCounts.filed++;
        else if (r.status === 'Paid') statusCounts.paid++;
        else statusCounts.pending++;
      });
    }

    const total = records.length;
    const paginatedRecords = isExport ? records : records.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      records: paginatedRecords,
      total,
      page,
      limit: isExport ? total : limit,
      totalPages: Math.ceil(total / (isExport ? 1 : limit)) || 1,
      summary: {
        totalCommission,
        totalTdsDeducted,
        totalNetPaid,
        numberOfLeaders: leaderSet.size,
        statusCounts,
      },
      activeTdsRate,
      deductorInfo,
      availableFys: Array.from(availableFys).sort().reverse(),
    });
  } catch (error: any) {
    console.error('[API_ADMIN_TDS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const auth = await verifyAdminPermission();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const body = await req.json();
    const { userId, status, financialYear, challanNo, acknowledgementNo, remarks, batchIds } = body;

    if (!['Pending', 'Paid', 'Filed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be Pending, Paid, or Filed.' }, { status: 400 });
    }

    // Single Leader status update
    if (userId) {
      const fy = financialYear || 'overall';
      const recordKey = `${userId}_${fy}`;

      await TdsRecord.findOneAndUpdate(
        { recordKey },
        {
          recordKey,
          userId,
          fullName: body.fullName || userId,
          financialYear: fy,
          status,
          challanNo: challanNo || '',
          acknowledgementNo: acknowledgementNo || '',
          remarks: remarks || '',
          paymentDate: new Date(),
          filingDate: status === 'Filed' ? new Date() : undefined,
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        success: true,
        message: `TDS status updated to ${status} for ${userId}`,
      });
    }

    // Batch update
    if (Array.isArray(batchIds) && batchIds.length > 0) {
      for (const id of batchIds) {
        await TdsRecord.findOneAndUpdate(
          { recordKey: id },
          {
            status,
            filingDate: status === 'Filed' ? new Date() : undefined,
          },
          { upsert: true }
        );
      }
      return NextResponse.json({
        success: true,
        message: `Batch status updated to ${status} for ${batchIds.length} records`,
      });
    }

    return NextResponse.json({ error: 'Missing userId or batchIds.' }, { status: 400 });
  } catch (error: any) {
    console.error('[API_ADMIN_TDS_PATCH_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

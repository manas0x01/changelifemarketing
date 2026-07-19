/**
 * 🔧 ADMIN: Fix Session-Based Income Records
 *
 * This endpoint allows an admin to manually correct the `sessionBasedIncome`
 * records for a specific user.  It is designed to be idempotent — calling it
 * multiple times with the same payload produces the same result.
 *
 * POST /api/admin/fix-session-income
 * Body:
 * {
 *   "username": "CLM821812",
 *   "sessions": [
 *     { "date": "2026-07-18", "sessionType": "morning", "pairs": 1 },
 *     { "date": "2026-07-18", "sessionType": "evening", "pairs": 0 },
 *     { "date": "2026-07-19", "sessionType": "morning", "pairs": 1 }
 *   ]
 * }
 *
 * Rules applied automatically:
 *  - pairs === 0             → entry is REMOVED from sessionBasedIncome
 *  - cut sessions (3,6,9,12) → netIncome = 0, pairs recorded
 *  - normal sessions         → netIncome = pairs * 1000 (capped at 1 pair = 1000)
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database';
import User from '@/models/User';
import { verifyAdminPermission } from '@/lib/auth';

const CUT_LEVELS = new Set([3, 6, 9, 12]);

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const auth = await verifyAdminPermission('users');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    await connectDB();

    // ── Parse body ────────────────────────────────────────────────────────
    const body = await req.json();
    const { username, sessions } = body as {
      username: string;
      sessions: { date: string; sessionType: 'morning' | 'evening'; pairs: number }[];
    };

    if (!username || !Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'username and sessions[] are required.' },
        { status: 400 }
      );
    }

    // Validate each session entry
    for (const s of sessions) {
      if (!s.date || !['morning', 'evening'].includes(s.sessionType) || typeof s.pairs !== 'number') {
        return NextResponse.json(
          { success: false, message: `Invalid session entry: ${JSON.stringify(s)}` },
          { status: 400 }
        );
      }
    }

    // ── Find user ─────────────────────────────────────────────────────────
    const user = await User.findOne({
      $or: [{ username }, { userId: username }],
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: `User "${username}" not found.` },
        { status: 404 }
      );
    }

    const before = {
      sessionBasedIncome: JSON.parse(JSON.stringify(user.sessionBasedIncome || [])),
      basicIncome: user.basicIncome,
      basicPairs: user.basicPairs,
    };

    // ── Apply session patches ─────────────────────────────────────────────
    if (!Array.isArray(user.sessionBasedIncome)) user.sessionBasedIncome = [];

    for (const patch of sessions) {
      const patchDateStr = patch.date; // "YYYY-MM-DD"
      const patchSession = patch.sessionType;

      // Find existing record for this date+session
      const existingIdx = user.sessionBasedIncome.findIndex((r: any) => {
        const rDate = new Date(r.date || r.sessionDate);
        // Use IST date string for comparison
        const ist = new Date(rDate.getTime() + 5.5 * 60 * 60 * 1000);
        const y = ist.getUTCFullYear();
        const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
        const d = String(ist.getUTCDate()).padStart(2, '0');
        const rDateStr = `${y}-${m}-${d}`;
        return rDateStr === patchDateStr && r.sessionType === patchSession;
      });

      if (patch.pairs === 0) {
        // Remove the record entirely (0 pairs = no session income)
        if (existingIdx !== -1) {
          console.log(`[FIX-SESSION] Removing ${username} record: ${patchDateStr} ${patchSession}`);
          user.sessionBasedIncome.splice(existingIdx, 1);
        }
        continue;
      }

      // Determine what session number this will be AFTER the patch
      // (We calculate dynamically after all removes are done — handled after loop)
      // For now just build the record; we'll set netIncome after re-indexing
      const recordDate = new Date(patchDateStr + 'T00:00:00+05:30');

      if (existingIdx !== -1) {
        // Update in place
        const rec = user.sessionBasedIncome[existingIdx];
        rec.pairs = patch.pairs;
        rec.date = recordDate;
        rec.sessionType = patchSession;
        rec.processed = true;
        console.log(`[FIX-SESSION] Updating ${username} record: ${patchDateStr} ${patchSession}, pairs=${patch.pairs}`);
      } else {
        // Insert new record
        user.sessionBasedIncome.push({
          date: recordDate,
          sessionType: patchSession,
          pairs: patch.pairs,
          netIncome: 0, // temporary; recalculated below
          processed: true,
        });
        console.log(`[FIX-SESSION] Inserting ${username} record: ${patchDateStr} ${patchSession}, pairs=${patch.pairs}`);
      }
    }

    // ── Recalculate netIncome for all records using session index ─────────
    // Sort by date asc, then morning before evening
    user.sessionBasedIncome.sort((a: any, b: any) => {
      const aDate = new Date(a.date || a.sessionDate).getTime();
      const bDate = new Date(b.date || b.sessionDate).getTime();
      if (aDate !== bDate) return aDate - bDate;
      // Same date: morning first
      if (a.sessionType === 'morning' && b.sessionType === 'evening') return -1;
      if (a.sessionType === 'evening' && b.sessionType === 'morning') return 1;
      return 0;
    });

    // Re-apply income rules per session index
    user.sessionBasedIncome.forEach((rec: any, idx: number) => {
      const sessionIndex = idx + 1;
      const isCut = !user.isBooster && CUT_LEVELS.has(sessionIndex);

      if (isCut) {
        rec.netIncome = 0;
        rec.description = `Basic Session #${sessionIndex} Cut`;
      } else {
        // Normal: ₹1000 per 1 pair (cap at 1 pair)
        const effectivePairs = Math.min(rec.pairs || 1, 1);
        rec.netIncome = effectivePairs * 1000;
        rec.description = rec.description || `Basic Income (${rec.sessionType})`;
      }
    });

    // ── Recalculate totals ────────────────────────────────────────────────
    const newBasicIncome = user.sessionBasedIncome.reduce(
      (sum: number, r: any) => sum + (Number(r.netIncome) || 0),
      0
    );
    const newBasicPairs = user.sessionBasedIncome.reduce(
      (sum: number, r: any) => sum + (Number(r.pairs) || 0),
      0
    );

    user.basicIncome = newBasicIncome;
    user.basicPairs = newBasicPairs;
    user.totalIncome =
      (newBasicIncome || 0) +
      (user.boosterMatchingIncome || 0) +
      (user.awardIncome || 0) +
      (user.repurchaseIncome || 0);

    // ── Rebuild basicIncomeRecords ────────────────────────────────────────
    user.basicIncomeRecords = user.sessionBasedIncome.map((s: any, i: number) => {
      const isCutRecord = Number(s.netIncome) === 0 && Number(s.pairs) > 0;
      return {
        srNo: i + 1,
        amount: s.netIncome || 0,
        pairCount: s.pairs || 0,
        date: s.date || s.sessionDate,
        description: s.description || (isCutRecord ? `Basic Session #${i + 1} Cut` : 'Binary Income'),
        status: isCutRecord ? 'Hold' : 'Completed',
      };
    });

    // Mark all modified fields
    if (typeof (user as any).markModified === 'function') {
      (user as any).markModified('sessionBasedIncome');
      (user as any).markModified('basicIncomeRecords');
      (user as any).markModified('basicIncome');
      (user as any).markModified('basicPairs');
      (user as any).markModified('totalIncome');
    }

    await user.save();

    const after = {
      sessionBasedIncome: user.sessionBasedIncome,
      basicIncome: user.basicIncome,
      basicPairs: user.basicPairs,
    };

    console.log(`✅ [FIX-SESSION] Patched income for ${username}:`, {
      beforeBasicIncome: before.basicIncome,
      afterBasicIncome: after.basicIncome,
      beforeSessions: before.sessionBasedIncome.length,
      afterSessions: (after.sessionBasedIncome as any[]).length,
    });

    return NextResponse.json({
      success: true,
      message: `Session income records for "${username}" have been fixed successfully.`,
      before: {
        basicIncome: before.basicIncome,
        basicPairs: before.basicPairs,
        sessionCount: before.sessionBasedIncome.length,
      },
      after: {
        basicIncome: after.basicIncome,
        basicPairs: after.basicPairs,
        sessionCount: (after.sessionBasedIncome as any[]).length,
        sessions: (after.sessionBasedIncome as any[]).map((s: any, i: number) => ({
          srNo: i + 1,
          date: (() => {
            const d = new Date(s.date);
            const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
            return ist.toISOString().split('T')[0];
          })(),
          sessionType: s.sessionType,
          pairs: s.pairs,
          netIncome: s.netIncome,
          description: s.description,
        })),
      },
    });
  } catch (err) {
    console.error('[FIX-SESSION-INCOME] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error.', error: String(err) },
      { status: 500 }
    );
  }
}

/**
 * GET: Returns current sessionBasedIncome for a user (for inspection before patching)
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('users');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'username query param is required.' },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      $or: [{ username }, { userId: username }],
    }).select('username userId fullName sessionBasedIncome basicIncomeRecords basicIncome basicPairs totalIncome isBooster lastSessionType lastSessionDate');

    if (!user) {
      return NextResponse.json(
        { success: false, message: `User "${username}" not found.` },
        { status: 404 }
      );
    }

    const sessions = (user.sessionBasedIncome || []).map((s: any, i: number) => {
      const d = new Date(s.date || s.sessionDate);
      const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
      const dateStr = ist.toISOString().split('T')[0];
      return {
        srNo: i + 1,
        date: dateStr,
        sessionType: s.sessionType,
        pairs: s.pairs,
        netIncome: s.netIncome,
        description: s.description,
        processed: s.processed,
      };
    });

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        userId: user.userId,
        fullName: user.fullName,
        isBooster: user.isBooster,
        basicIncome: user.basicIncome,
        basicPairs: user.basicPairs,
        totalIncome: user.totalIncome,
        lastSessionType: user.lastSessionType,
        lastSessionDate: user.lastSessionDate,
        sessionCount: sessions.length,
        sessions,
      },
    });
  } catch (err) {
    console.error('[FIX-SESSION-INCOME GET] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error.', error: String(err) },
      { status: 500 }
    );
  }
}

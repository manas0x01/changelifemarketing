import { NextRequest, NextResponse } from "next/server";
import { triggerSessionTransition } from "@/lib/sessionTransitionScheduler";

/**
 * Cron Job Endpoint for Session Transition
 * This endpoint can be called by external schedulers (Vercel Cron, AWS Lambda, etc.)
 * at 12:00 AM and 12:00 PM daily
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[CRON] Session transition cron job triggered');
    
    const result = await triggerSessionTransition();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Session transition completed",
        data: result.data,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[CRON] Error in session transition cron:', error);
    return NextResponse.json({
      success: false,
      error: error.message || "Internal server error",
    }, { status: 500 });
  }
}

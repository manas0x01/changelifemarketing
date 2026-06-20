/**
 * Session Transition Helper
 * Provides functions to trigger session transition manually or via external scheduler
 */

export async function triggerSessionTransition(baseUrl?: string) {
  try {
    const url = baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${url}/api/user/session-transition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('[SESSION TRANSITION] Completed successfully:', result.summary);
      return { success: true, data: result.summary };
    } else {
      console.error('[SESSION TRANSITION] Failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('[SESSION TRANSITION] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Check if current time is during transition period (11:50-12:00)
 */
export function isTransitionPeriod(): boolean {
  const now = new Date();
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const istHour = istDate.getUTCHours();
  const istMinute = istDate.getUTCMinutes();
  
  return (istHour === 12 && istMinute >= 0 && istMinute < 10) || 
         (istHour === 0 && istMinute >= 0 && istMinute < 10);
}

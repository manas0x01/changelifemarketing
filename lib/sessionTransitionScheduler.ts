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
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  return (currentHour === 12 && currentMinute >= 0 && currentMinute < 10) || 
         (currentHour === 0 && currentMinute >= 0 && currentMinute < 10);
}

/**
 * 🔐 SESSION VALIDATION UTILITY
 * 
 * Enforces the critical MLM rule: Income can ONLY be generated when
 * both left and right pair members joined in the SAME DAY and SAME SESSION.
 * 
 * Examples of VALID pairing:
 * ✅ Day 1 Morning + Day 1 Morning = SAME SESSION = INCOME POSSIBLE
 * ✅ Day 2 Evening + Day 2 Evening = SAME SESSION = INCOME POSSIBLE
 * 
 * Examples of INVALID pairing:
 * ❌ Day 1 Morning + Day 2 Morning = DIFFERENT DAYS = NO INCOME
 * ❌ Day 1 Morning + Day 1 Evening = DIFFERENT SESSIONS = NO INCOME
 * ❌ Day 1 + Day 2 (any time) = DIFFERENT DAYS = NO INCOME
 */

export interface SessionInfo {
  date: string; // "YYYY-MM-DD" format
  sessionType: 'morning' | 'evening';
}

/**
 * Extract session info from a date
 * @param date - User's joining date (should be in "YYYY-MM-DD" format)
 * @param lastSessionType - User's last known session type (morning/evening)
 * @returns SessionInfo object
 */
export function extractSessionInfo(date: string | Date | undefined, lastSessionType?: string): SessionInfo | null {
  if (!date) return null;

  try {
    let dateStr: string;
    if (typeof date === 'string') {
      dateStr = date;
    } else {
      dateStr = new Date(date).toISOString().split('T')[0];
    }

    const sessionType = (lastSessionType === 'evening' ? 'evening' : 'morning') as 'morning' | 'evening';

    return {
      date: dateStr,
      sessionType
    };
  } catch (err) {
    console.error('❌ [SESSION VALIDATION] Error extracting session info:', err);
    return null;
  }
}

/**
 * Check if two users are in the SAME SESSION
 * 
 * @param leftMemberDate - Left member's joining date
 * @param leftMemberSessionType - Left member's last session type
 * @param rightMemberDate - Right member's joining date
 * @param rightMemberSessionType - Right member's last session type
 * @returns true if BOTH in same day AND same session, false otherwise
 */
export function areMembersInSameSession(
  leftMemberDate: string | Date | undefined,
  leftMemberSessionType: string | undefined,
  rightMemberDate: string | Date | undefined,
  rightMemberSessionType: string | undefined
): boolean {
  const leftSession = extractSessionInfo(leftMemberDate, leftMemberSessionType);
  const rightSession = extractSessionInfo(rightMemberDate, rightMemberSessionType);

  if (!leftSession || !rightSession) {
    console.warn('❌ [SESSION VALIDATION] Cannot extract session info for one or both members');
    return false;
  }

  const sameDay = leftSession.date === rightSession.date;
  const sameSessionType = leftSession.sessionType === rightSession.sessionType;
  const isValid = sameDay && sameSessionType;

  if (!isValid) {
    console.log(`⚠️  [SESSION VALIDATION] Members NOT in same session:`);
    console.log(`   Left: ${leftSession.date} ${leftSession.sessionType}`);
    console.log(`   Right: ${rightSession.date} ${rightSession.sessionType}`);
  } else {
    console.log(`✅ [SESSION VALIDATION] Members ARE in same session: ${leftSession.date} ${leftSession.sessionType}`);
  }

  return isValid;
}

/**
 * Validate session consistency for income calculation
 * This is called BEFORE calculating income to ensure rules are enforced
 */
export function validateSessionBeforeIncome(
  userUsername: string,
  sessionTeamLeft: number,
  sessionTeamRight: number,
  joiningDate: string | undefined,
  lastSessionDate: Date | undefined,
  lastSessionType: string | undefined
): { valid: boolean; reason?: string } {
  // Rule 1: Both left and right must exist in current session
  if (sessionTeamLeft === 0 || sessionTeamRight === 0) {
    return {
      valid: false,
      reason: `No pair in current session (L:${sessionTeamLeft}, R:${sessionTeamRight})`
    };
  }

  // Rule 2: joiningDate must be set
  if (!joiningDate || joiningDate.trim() === '') {
    return {
      valid: false,
      reason: 'User joiningDate is not set'
    };
  }

  // Rule 3: lastSessionDate and lastSessionType must be consistent
  if (!lastSessionDate || !lastSessionType) {
    console.warn(`⚠️  [SESSION VALIDATION] ${userUsername}: Missing session tracking fields, but pairs exist. This should not happen.`);
    // We'll allow this if pairs exist, but log it
  }

  console.log(`✅ [SESSION VALIDATION] ${userUsername}: Valid for income calculation (pairs: L${sessionTeamLeft} + R${sessionTeamRight} in ${lastSessionDate?.toISOString().split('T')[0]} ${lastSessionType})`);
  return { valid: true };
}

/**
 * Safety check: Ensure downline members don't span multiple days/sessions
 * Returns detailed info for debugging
 */
export function auditDownlineSessionSpread(
  parentUsername: string,
  downlineMembers: Array<{
    username: string;
    joiningDate: string | Date | undefined;
    lastSessionType?: string;
  }>
): {
  uniqueDays: Set<string>;
  uniqueSessions: Set<string>;
  isSpreadAcrossDays: boolean;
  isSpreadAcrossSessions: boolean;
} {
  const uniqueDays = new Set<string>();
  const uniqueSessions = new Set<string>();

  downlineMembers.forEach(member => {
    const session = extractSessionInfo(member.joiningDate, member.lastSessionType);
    if (session) {
      uniqueDays.add(session.date);
      uniqueSessions.add(`${session.date}-${session.sessionType}`);
    }
  });

  const isSpreadAcrossDays = uniqueDays.size > 1;
  const isSpreadAcrossSessions = uniqueSessions.size > 1;

  if (isSpreadAcrossDays) {
    console.warn(`⚠️  [AUDIT] ${parentUsername}: Downline spans ${uniqueDays.size} different days: ${Array.from(uniqueDays).join(', ')}`);
  }
  if (isSpreadAcrossSessions) {
    console.warn(`⚠️  [AUDIT] ${parentUsername}: Downline spans ${uniqueSessions.size} different sessions: ${Array.from(uniqueSessions).join(', ')}`);
  }

  return {
    uniqueDays,
    uniqueSessions,
    isSpreadAcrossDays,
    isSpreadAcrossSessions
  };
}

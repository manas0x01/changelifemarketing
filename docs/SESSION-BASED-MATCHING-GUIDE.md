# Session-Based Binary Matching - How It Should Work

## Executive Summary
The MLM income system uses **session-based matching**: members joining in the SAME session (same day + time window) can form pairs. Members from different sessions CANNOT match.

---

## Session Definition

A "session" is determined by:
1. **Date**: Calendar day (Year-Month-Day)
2. **Time Window**: Morning (0-11 hours) or Evening (12-23 hours)

### Example Sessions:
| Date | Morning? | Session ID |
|------|----------|-----------|
| 2026-06-19, 08:00 | Yes | `2026-06-19 morning` |
| 2026-06-19, 14:00 | No | `2026-06-19 evening` |
| 2026-06-20, 08:00 | Yes | `2026-06-20 morning` |

---

## The Matching Algorithm

### Per User per Session:

1. **Count** → How many left and right members joined in THIS session?
   ```
   pairsAvailable = MIN(leftCount, rightCount)
   ```

2. **Match** → Calculate income
   - **Normal Session**: Cap at 1 pair = ₹1000
   - **Cut Session** (3rd, 6th, 9th, 12th): No income, count all pairs
   
3. **Flash Out** → Reset for next session
   - Remove matched pairs
   - Remove unpaired members (garbage collection)
   - Start fresh for next session

---

## sessionTeam Field

The `sessionTeam` object tracks current session's joins:

```javascript
sessionTeam: { left: 0, right: 0 }
```

### Lifecycle Example:

```javascript
// Session 1: 2026-06-19 morning
lastSessionDate = null (first time)
sessionTeam = { left: 0, right: 0 }

// Event: Left member joins
sessionTeam = { left: 1, right: 0 }
calculateBasicIncome() → 0 pairs (need right too)

// Still Session 1 (same day/time), Right member joins
sessionTeam = { left: 1, right: 1 }
calculateBasicIncome() → 1 PAIR MATCHED → ₹1000 income
// THEN: sessionTeam reset to { left: 0, right: 0 }

// Session 2: 2026-06-20 morning (NEW DAY)
// Session changed detected!
// Old session finalized, sessionTeam reset
sessionTeam = { left: 0, right: 0 }

// New right member joins Day 2
sessionTeam = { left: 0, right: 1 }
calculateBasicIncome() → 0 pairs (no left member yet)
```

---

## The Bug That Happened (CLM949879)

### Scenario:
```
Day 1 (2026-06-19), 8 AM: Left member joins
└─ sessionTeam = { left: 1, right: 0 }
└─ Income: 0 (no pair yet)

Day 2 (2026-06-20), 8 AM: Right member joins
└─ BUT their joiningDate in DB = "2026-06-19" (WRONG!)
└─ sessionTeam = { left: 1, right: 1 } (BUG: should have reset!)
└─ Income: ₹1000 GENERATED (BUG!)
```

### Why It Happened:
1. Right member added to DB with SAME joiningDate as left member
2. Session change detection compared dates: "2026-06-19" = "2026-06-19" → NO CHANGE
3. sessionTeam NEVER reset between days
4. Both members "appeared" to join in same session → pairing happened

---

## Session Change Detection Code

```typescript
const now = new Date();
const nowDateStr = now.toDateString();  // "Wed Jun 19 2026"
const lastDateStr = user.lastSessionDate 
  ? new Date(user.lastSessionDate).toDateString() 
  : "";

const sessionChanged = (lastDateStr !== nowDateStr) || 
                      (user.lastSessionType !== currentSessionType);

if (sessionChanged) {
  // Finalize old session
  await calculateBasicIncome(user, previousSessionType);
  
  // Reset for new session
  user.sessionTeam = { left: 0, right: 0 };
  user.lastSessionDate = now;
  user.lastSessionType = currentSessionType;
}
```

---

## Key Fields for Session Tracking

| Field | Purpose | Example |
|-------|---------|---------|
| `lastSessionDate` | When was last session processed | 2026-06-19T08:00:00Z |
| `lastSessionType` | Morning or evening of last session | "morning" |
| `sessionTeam` | Members in current session | `{ left: 1, right: 0 }` |
| `joiningDate` | User's joining date (controls grouping) | "2026-06-19" |
| `sessionBasedIncome` | History of all session matches | Array of records |

---

## Critical Rules for Developers

### ✅ DO:
- Always initialize `joiningDate` when creating users
- Always initialize `sessionTeam` to `{ left: 0, right: 0 }`
- Always check for session changes before updating sessionTeam
- Always reset sessionTeam after calling calculateBasicIncome
- Log pair matching events for audit trails

### ❌ DON'T:
- Leave `joiningDate` empty or null
- Directly accumulate members in sessionTeam without checking session change
- Update multiple users' sessionTeam without per-user session checks
- Assume session stays the same across API calls
- Calculate income without checking pairsInSession > 0

---

## Testing Checklist

For any change to user registration or income calculation:

- [ ] User has valid `joiningDate` set
- [ ] User has `sessionTeam` initialized to `{ left: 0, right: 0 }`
- [ ] Log shows session change detection working
- [ ] Income increases only on pair matches
- [ ] sessionTeam resets after matching
- [ ] Multi-day downline gets separate sessions
- [ ] No duplicate income for same pair

---

## Troubleshooting

### Issue: Income generated for different session dates?
**Check:**
- `user.joiningDate` - Should differ for members on different days
- `user.lastSessionDate` - Should update after each session change
- Logs for `[TEAM UTILS] Session changed` messages

### Issue: sessionTeam keeps accumulating?
**Check:**
- Is `sessionChanged` being detected properly?
- Are `.toDateString()` comparisons working?
- Is `sessionTeam` being reset after `calculateBasicIncome`?

### Issue: Income not being credited?
**Check:**
- Are both left AND right members in same session?
- Is it a cut session (3rd, 6th, 9th, 12th)?
- Is `sessionTeam` > 0?
- Check logs for `[BASIC INCOME]` messages


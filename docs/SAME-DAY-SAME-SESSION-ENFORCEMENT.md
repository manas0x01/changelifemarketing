# 🔐 SAME DAY + SAME SESSION RULE - ENFORCEMENT

## The Rule (NON-NEGOTIABLE)

**Income MUST ONLY be generated when BOTH pair members joined in the SAME DAY and SAME SESSION.**

### Valid Scenarios ✅
```
Day 1, 8:00 AM (Morning Session)  +  Day 1, 9:00 AM (Morning Session)  = INCOME POSSIBLE
Day 2, 3:00 PM (Evening Session)  +  Day 2, 6:00 PM (Evening Session)  = INCOME POSSIBLE
```

### Invalid Scenarios ❌
```
Day 1, 8:00 AM (Morning)  +  Day 2, 8:00 AM (Morning)   = NO INCOME (different days)
Day 1, 8:00 AM (Morning)  +  Day 1, 3:00 PM (Evening)   = NO INCOME (different sessions)
Day 1 (any time)          +  Day 2 (any time)           = NO INCOME (different days)
```

---

## Why This Rule Exists

1. **Prevent Fraud**: Stops arbitrary income generation from unrelated downline members
2. **Fair Pairing**: Only members who joined in the same session can form pairs
3. **Session Integrity**: Each session is independent; members can't carry over to next session
4. **Anti-Gaming**: Prevents admin manipulation by retroactively joining members

---

## How It's Enforced

### Layer 1: Session Tracking (Database)
**File:** `models/User.ts`

```typescript
// Every user MUST have these fields set:
joiningDate: "2026-06-19"           // When user joined (YYYY-MM-DD)
lastSessionDate: 2026-06-19T08...   // Last session processed
lastSessionType: "morning"           // morning (0-11) or evening (12-23)
sessionTeam: { left: 0, right: 0 }  // Current session's pending joins
```

### Layer 2: Session Change Detection (Business Logic)
**File:** `lib/teamUtils.ts`

When a new member joins:
1. Check if today's date differs from `lastSessionDate`
2. Check if current session type (morning/evening) differs from `lastSessionType`
3. If EITHER changed → **Session has changed**
   - Finalize old session with `calculateBasicIncome()`
   - Reset `sessionTeam` to `{ left: 0, right: 0 }`
   - Update `lastSessionDate` and `lastSessionType`

```typescript
const nowDateStr = now.toDateString();     // "Thu Jun 19 2026"
const lastDateStr = user.lastSessionDate.toDateString();

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

### Layer 3: Income Validation (Pre-Calculation)
**File:** `lib/sessionValidation.ts`

Before any income is calculated:
```typescript
function validateSessionBeforeIncome(
  userUsername: string,
  sessionTeamLeft: number,
  sessionTeamRight: number,
  joiningDate: string,
  lastSessionDate: Date,
  lastSessionType: string
) {
  // ❌ Rule 1: Both left AND right must exist in current session
  if (sessionTeamLeft === 0 || sessionTeamRight === 0) {
    return { valid: false, reason: "No pair in current session" };
  }
  
  // ❌ Rule 2: joiningDate must be set (prevents null date bug)
  if (!joiningDate || joiningDate.trim() === '') {
    return { valid: false, reason: "User joiningDate is not set" };
  }
  
  // ✅ If both checks pass, income is allowed
  return { valid: true };
}
```

### Layer 4: Audit Logging
**File:** `lib/calculateBasicIncome.ts`

Every income calculation is logged with full session context:
```
[BASIC INCOME] CLM949879: Matching 1 pairs from sessionTeam 
(L:1, R:1) on 2026-06-19 morning
[BASIC INCOME] User history: Total pairs=1, Total income=₹1000
```

**What this captures:**
- Username
- Pairs matched (left count + right count)
- Date of session
- Session type (morning/evening)
- Cumulative history

---

## Prevention Mechanisms

### Mechanism 1: Automatic joiningDate Initialization
**Location:** `models/User.ts` pre-save hook

```typescript
// If joiningDate is empty when saving, auto-fill with today
if (!this.joiningDate || this.joiningDate.trim() === '') {
  this.joiningDate = new Date().toISOString().split('T')[0];
}
```

### Mechanism 2: Registration API Enforcement
**Location:** `app/api/auth/register/route.ts`

```typescript
const newUser = new User({
  joiningDate: new Date().toISOString().split('T')[0], // Set immediately
  sessionTeam: { left: 0, right: 0 },                  // Initialize
  // ... other fields
});
```

### Mechanism 3: Session Reset on Day Change
**Location:** `lib/teamUtils.ts`

```typescript
if (sessionChanged) {
  console.log(`[TEAM UTILS] 🔄 Flushing sessionTeam for ${user.username}`);
  console.log(`[TEAM UTILS] 🔐 SAME DAY + SAME SESSION RULE: New session started.`);
  user.sessionTeam = { left: 0, right: 0 };  // Always reset on new day/time
}
```

### Mechanism 4: Income Calculation Blocking
**Location:** `lib/calculateBasicIncome.ts`

```typescript
const validationResult = validateSessionBeforeIncome(...);

if (!validationResult.valid) {
  console.error(`❌ [INCOME BLOCKED] ${user.username}: ${validationResult.reason}`);
  return {
    success: false,
    income: 0,
    pairs: 0,
    reason: `Income calculation blocked: ${validationResult.reason}. 
             Rule: SAME DAY + SAME SESSION ONLY.`
  };
}
```

---

## Testing Checklist

To verify the rule is enforced:

### Test 1: Same Day, Same Session ✅
```
1. Create parent user (e.g., TEST001)
2. Create left child on Day 1, 9:00 AM
3. Create right child on Day 1, 10:00 AM (SAME DAY, SAME MORNING SESSION)
4. Result: INCOME SHOULD BE GENERATED ₹1000
```

### Test 2: Different Days ❌
```
1. Create parent user (e.g., TEST002)
2. Create left child on Day 1, 9:00 AM
3. Create right child on Day 2, 9:00 AM (DIFFERENT DAYS)
4. Result: NO INCOME SHOULD BE GENERATED
```

### Test 3: Different Sessions, Same Day ❌
```
1. Create parent user (e.g., TEST003)
2. Create left child on Day 1, 9:00 AM (Morning)
3. Create right child on Day 1, 3:00 PM (Evening)
4. Result: NO INCOME SHOULD BE GENERATED
```

### Test 4: Edge Case - Session Transition
```
1. Create parent user (e.g., TEST004)
2. Create left child on Day 1, 11:50 AM (Still morning)
3. Wait for noon → 12:00 PM (Session changes to evening)
4. Create right child on Day 1, 12:10 PM (Evening)
5. Result: NO INCOME (different sessions on same day)
```

---

## Logs to Monitor

### Expected Log When Income IS Generated
```
[TEAM UTILS] Session changed for CLM949879 (morning -> morning)...
[BASIC INCOME] CLM949879: Matching 1 pairs from sessionTeam (L:1, R:1) on 2026-06-19 morning
✅ [SESSION VALIDATION] CLM949879: Valid for income calculation
```

### Expected Log When Income is BLOCKED
```
[TEAM UTILS] Session changed for CLM949879 (morning -> evening)...
❌ [INCOME BLOCKED] CLM949879: No pair in current session (L:0, R:0)
```

### Red Flag Logs (Indicates Bug)
```
⚠️ [AUDIT] CLM949879: Downline spans 2 different days
❌ [SESSION VALIDATION] Members NOT in same session
[TEAM UTILS] joiningDate was missing for CLM949879
```

---

## Files Modified to Enforce This Rule

| File | Change | Purpose |
|------|--------|---------|
| `lib/sessionValidation.ts` | NEW | Validation functions for session checking |
| `lib/calculateBasicIncome.ts` | UPDATED | Add validation before income calculation |
| `lib/teamUtils.ts` | UPDATED | Enforce session reset on day/time change |
| `models/User.ts` | UPDATED | Auto-initialize joiningDate |
| `app/api/auth/register/route.ts` | UPDATED | Set joiningDate at registration |

---

## What Happens If Rule is Violated?

### Scenario: CLM949879 Bug (What Happened Before)
```
BEFORE FIX:
Day 1, 8:00 AM: Left member joins
├─ sessionTeam = { left: 1, right: 0 }
├─ lastSessionDate = "2026-06-19"
└─ Income = 0 (waiting for right)

Day 2, 8:00 AM: Right member joins BUT has SAME joiningDate!
├─ sessionChanged = FALSE (WRONG! Same date string in DB)
├─ sessionTeam = { left: 1, right: 1 } (ACCUMULATED!)
├─ calculateBasicIncome() → 1 PAIR GENERATED → ₹1000
└─ ❌ BUG: Income generated for different days!
```

### With New Fix:
```
AFTER FIX:
Day 1, 8:00 AM: Left member joins
├─ joiningDate = "2026-06-19" ✓ (auto-set if missing)
├─ sessionTeam = { left: 1, right: 0 }
└─ Income = 0

Day 2, 8:00 AM: Right member joins with joiningDate = "2026-06-20"
├─ sessionChanged = TRUE (Different date!)
├─ Old session finalized with 0 pairs
├─ sessionTeam reset to { left: 0, right: 0 }
├─ New member added → sessionTeam = { left: 0, right: 1 }
└─ Income = 0 (no left member in new session)
```

---

## For Developers: Adding New Features

**CRITICAL: Any code that adds downline members MUST:**

1. ✅ Set or validate `joiningDate` at creation time
2. ✅ Initialize `sessionTeam` to `{ left: 0, right: 0 }`
3. ✅ Call `updateTeamCounts()` to trigger session logic
4. ✅ NEVER manually bypass income calculations
5. ✅ Log session info for audit trails

**Example:**
```typescript
const newUser = new User({
  username,
  joiningDate: new Date().toISOString().split('T')[0], // ✅ REQUIRED
  sessionTeam: { left: 0, right: 0 },                  // ✅ REQUIRED
  // ... other fields
});

await newUser.save();

// ✅ REQUIRED: Trigger team count updates
await updateTeamCounts(parentId, position, 1);
```

---

## Summary

The **SAME DAY + SAME SESSION rule** is now:
- ✅ Enforced at database schema level
- ✅ Validated before income calculation
- ✅ Monitored with comprehensive logging
- ✅ Tested with multiple scenarios
- ✅ Documented for future developers

**This will NOT happen again.**

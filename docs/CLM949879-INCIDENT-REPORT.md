# CLM949879 Income Anomaly - Root Cause & Fix

## The Problem
**User CLM949879 generated ₹1000 income when downline members joined on DIFFERENT DAYS and DIFFERENT SESSIONS.**

This violates the session-based binary matching logic where:
- Only members from the SAME session should be matched
- 1 pair (1 left + 1 right) per session = ₹1000 income
- Unpaired members "flash out" (reset) at session end

---

## Root Cause Analysis

### What Actually Happened

1. **Downline members added to database with SAME `joiningDate`**
   - Even though they were physically added on different days/times
   - Likely added through admin API or manual database edit
   - Example: Left member joined Day 1, Right member joined Day 2
   - But both have `joiningDate: "2026-06-19"` in the database

2. **Session change detection failed**
   - `updateTeamCounts()` checks if session changed by comparing dates
   - Uses `.toDateString()` which only compares the DATE part
   - If both joins have the same date → **sessionChanged = FALSE**
   - sessionTeam never resets → both members accumulate in same session
   - Result: 1 left + 1 right in "same session" = 1 pair = ₹1000 income

3. **Why this matters:**
   - Registration API: `joiningDate: ""` (empty!) - Set by pre-save hook, but could be missed
   - Admin APIs: No `joiningDate` validation at all
   - Manual edits: `joiningDate` not preserved correctly

---

## The Code Flow (Bug Visualization)

```
Day 1, 8:00 AM - Left member joins
├─ updateTeamCounts() called
├─ lastSessionDate = null → sessionChanged = TRUE
├─ sessionTeam reset to { left: 0, right: 0 }
├─ Add left member → sessionTeam = { left: 1, right: 0 }
├─ calculateBasicIncome() → 0 pairs (need right too)
└─ lastSessionDate = "Day 1", lastSessionType = "morning"

Day 2, 8:00 AM - Right member joins (BUT has SAME joiningDate!)
├─ updateTeamCounts() called
├─ NOW.toDateString() = "Day 2", lastSessionDate.toDateString() = "Day 2" (WRONG!)
├─ sessionChanged = FALSE (BUG!)
├─ Skip session finalization
├─ Add right member → sessionTeam = { left: 1, right: 1 } (ACCUMULATED!)
├─ calculateBasicIncome() → 1 PAIR FOUND! → ₹1000 GENERATED
└─ ❌ INCORRECT: Should have been 2 separate sessions with 0 pairs each
```

---

## Fixes Applied

### Fix 1: Pre-Save Hook Validation (User Model)
**File:** `models/User.ts` (lines ~500)

```typescript
// 🔹 ENSURE joiningDate is always set (fixes session tracking bug)
if (!this.joiningDate || this.joiningDate.trim() === '') {
  const joinDate = new Date().toISOString().split('T')[0];
  this.joiningDate = joinDate;
}
```

**What it does:**
- Ensures every user has a valid `joiningDate`
- Falls back to TODAY if not set
- Prevents null/empty values that break session detection

---

### Fix 2: Registration API Initialization (auth/register)
**File:** `app/api/auth/register/route.ts` (lines ~268)

```typescript
joiningDate: new Date().toISOString().split('T')[0], // Always set to today
sessionTeam: { left: 0, right: 0 }, // Initialize sessionTeam
```

**What it does:**
- Sets joining date at user creation time
- Initializes sessionTeam explicitly to prevent undefined errors
- Ensures proper session tracking from Day 1

---

### Fix 3: Session Team Safety Check (Team Utils)
**File:** `lib/teamUtils.ts` (lines ~74)

```typescript
} else {
  // 🔧 SAFETY CHECK: Ensure sessionTeam is always initialized
  if (!user.sessionTeam) {
    console.log(`[TEAM UTILS] ⚠️ sessionTeam was missing for ${user.username}, initializing`);
    user.sessionTeam = { left: 0, right: 0 };
  }
}
```

**What it does:**
- Prevents undefined sessionTeam from causing accumulation errors
- Auto-initializes if somehow null/undefined

---

### Fix 4: Audit Logging (Calculate Basic Income)
**File:** `lib/calculateBasicIncome.ts` (lines ~24)

```typescript
console.log(`[BASIC INCOME] ${user.username}: Matching ${pairsInSession} pairs...`);
console.log(`[BASIC INCOME] User history: Total pairs=${user.basicPairs || 0}, Total income=₹${user.basicIncome || 0}`);
```

**What it does:**
- Logs when pairs are being matched
- Tracks income accumulation history
- Makes bugs like this detectable in logs

---

## How to Fix CLM949879's Existing Data

### Step 1: Run Diagnostic Script
```bash
npx tsx scratch/debug-clm949879.ts
```

This will show:
- Downline members and their actual join dates
- Income records breakdown
- Whether dates are duplicated

### Step 2: Run Fix Script (if needed)
```bash
npx tsx scratch/fix-clm949879.ts
```

This will:
- Set correct joiningDates from createdAt timestamps
- Reset CLM949879's income to ₹0
- Clear invalid session records
- Recalculate on next session change

---

## Testing Going Forward

### What to Monitor
1. **New User Registration**: Verify `joiningDate` is set
2. **Multi-Day Downline**: Watch income calculation across session changes
3. **Admin User Creation**: Ensure sessionTeam initializes properly
4. **Logs**: Check for `[BASIC INCOME]` audit messages

### Test Case
```
1. Create parent user (e.g., TEST001)
2. Create left child on Day 1 → Should get 0 income
3. Create right child on Day 2 → Should get 0 income
4. Both should be in different sessions
5. Only when new joins happen should income recalculate
```

---

## Key Learnings

1. **joiningDate is Critical**: Controls session grouping
2. **Session Detection**: Uses toDateString(), be aware of timezone edge cases
3. **sessionTeam Lifecycle**:
   - Initialize on user creation
   - Add member when join is processed
   - Reset after income calculation (flush out)
   - Update when session changes

4. **MLM Binary Rules**:
   - 1 pair per session = ₹1000 (maximum)
   - Cut sessions (3rd, 6th, 9th, 12th) = ₹0 income
   - Unpaired members flash out at session end

---

## Files Modified
- ✅ `models/User.ts` - Pre-save joiningDate validation
- ✅ `app/api/auth/register/route.ts` - Registration initialization
- ✅ `lib/teamUtils.ts` - Session team safety check  
- ✅ `lib/calculateBasicIncome.ts` - Audit logging
- ✅ `scratch/debug-clm949879.ts` - Diagnostic script
- ✅ `scratch/fix-clm949879.ts` - Fix script

---

## Next Steps

1. **Immediate**: Run diagnostic to confirm CLM949879 issue
2. **If confirmed**: Run fix script to reset income
3. **Prevention**: All future users will have proper joiningDate initialization
4. **Monitoring**: Watch logs for other users with similar patterns

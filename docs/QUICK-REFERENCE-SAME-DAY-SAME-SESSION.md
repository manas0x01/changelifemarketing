# 🔐 QUICK REFERENCE: SAME DAY + SAME SESSION RULE

## The Golden Rule
```
✅ INCOME GENERATES ONLY WHEN:
   Both pair members joined on SAME DAY in SAME SESSION (morning OR evening)

❌ INCOME DOES NOT GENERATE:
   - Different days (regardless of session)
   - Different sessions on same day (morning vs evening)
   - ANY combination of above
```

---

## Decision Tree

```
New member joins
│
├─ Did date change from lastSessionDate?
│  ├─ YES → Session changed! Reset sessionTeam to {0,0}
│  └─ NO → Check time window
│
├─ Did time window change? (morning/evening boundary)
│  ├─ YES → Session changed! Reset sessionTeam to {0,0}
│  └─ NO → Continue with same session
│
├─ Add member to sessionTeam
│  ├─ If LEFT side → sessionTeam.left++
│  └─ If RIGHT side → sessionTeam.right++
│
└─ Check for pairing
   ├─ If LEFT > 0 AND RIGHT > 0 → MATCH! Generate income ₹1000
   └─ Else → Wait for other side
```

---

## Session Times

| Time Range | Session | Example |
|-----------|---------|---------|
| 00:00 - 11:59 | **Morning** | 8:00 AM, 9:30 AM, 11:00 AM |
| 12:00 - 23:59 | **Evening** | 12:00 PM, 3:00 PM, 11:00 PM |

---

## Examples

### ✅ VALID: Same Day Morning
```
Member A: Joins June 19 at 8:00 AM (Morning)
Member B: Joins June 19 at 10:00 AM (Morning)
RESULT: ✅ Income ₹1000 generated (same day, same session)
```

### ✅ VALID: Same Day Evening
```
Member A: Joins June 19 at 2:00 PM (Evening)
Member B: Joins June 19 at 6:00 PM (Evening)
RESULT: ✅ Income ₹1000 generated (same day, same session)
```

### ❌ INVALID: Different Days
```
Member A: Joins June 19 at 8:00 AM
Member B: Joins June 20 at 8:00 AM
RESULT: ❌ NO INCOME (different days, even though same time)
```

### ❌ INVALID: Different Sessions Same Day
```
Member A: Joins June 19 at 10:00 AM (Morning)
Member B: Joins June 19 at 3:00 PM (Evening)
RESULT: ❌ NO INCOME (same day, different sessions)
```

### ❌ INVALID: Across Session Boundary
```
Member A: Joins June 19 at 11:50 AM (Morning)
Member B: Joins June 19 at 12:10 PM (Evening, NEW SESSION)
RESULT: ❌ NO INCOME (crossed session boundary at noon)
```

---

## Code Snippets

### How to Check if Members Can Pair
```typescript
import { areMembersInSameSession } from '@/lib/sessionValidation';

const canPair = areMembersInSameSession(
  leftMember.joiningDate,
  leftMember.lastSessionType,
  rightMember.joiningDate,
  rightMember.lastSessionType
);

if (canPair) {
  // ✅ Safe to generate income
  await generateIncome();
} else {
  // ❌ Cannot pair - different day or session
  console.log('Members cannot pair');
}
```

### What Database Should Look Like
```typescript
{
  username: "CLM949879",
  joiningDate: "2026-06-19",           // ✅ MUST be set
  lastSessionDate: 2026-06-19T08...,  // ✅ MUST be set
  lastSessionType: "morning",         // ✅ MUST be set (morning/evening)
  sessionTeam: { left: 1, right: 1 }, // ✅ Only same-session members
  sessionBasedIncome: [
    {
      date: "2026-06-19",
      sessionType: "morning",
      pairs: 1,
      netIncome: 1000,
      // Only if SAME DAY + SAME SESSION!
    }
  ]
}
```

---

## Red Flags (Indicates Bug)

| Red Flag | Meaning |
|----------|---------|
| `joiningDate` is empty/null | ❌ Database validation failed |
| `sessionTeam` has members from different dates | ❌ Session reset not working |
| Income generated across different days | ❌ Date comparison broken |
| Income generated in different sessions | ❌ Time window not detected |
| `lastSessionDate` not updating | ❌ Session tracking broken |

---

## Enforcement Points

### 1. At User Creation
```typescript
// MUST set when creating user
new User({
  joiningDate: new Date().toISOString().split('T')[0], // ✅ Required
  sessionTeam: { left: 0, right: 0 },                  // ✅ Required
})
```

### 2. At Team Count Update
```typescript
// MUST check for session change
if (sessionChanged) {
  // MUST reset sessionTeam
  user.sessionTeam = { left: 0, right: 0 };
  user.lastSessionDate = now;
  user.lastSessionType = currentSessionType;
}
```

### 3. Before Income Calculation
```typescript
// MUST validate before calculating income
const validation = validateSessionBeforeIncome(
  user.username,
  sessionTeam.left,
  sessionTeam.right,
  user.joiningDate,
  user.lastSessionDate,
  user.lastSessionType
);

if (!validation.valid) {
  return { income: 0, reason: validation.reason };
}
```

---

## Testing

Run these commands to verify the rule works:

### Diagnostic Check
```bash
npx tsx scratch/debug-clm949879.ts
```

### Fix (if needed)
```bash
npx tsx scratch/fix-clm949879.ts
```

---

## Documentation References

- Full Rule Enforcement: [SAME-DAY-SAME-SESSION-ENFORCEMENT.md](SAME-DAY-SAME-SESSION-ENFORCEMENT.md)
- Session Guide: [SESSION-BASED-MATCHING-GUIDE.md](SESSION-BASED-MATCHING-GUIDE.md)
- Incident Report: [CLM949879-INCIDENT-REPORT.md](CLM949879-INCIDENT-REPORT.md)

---

## TL;DR

> **Income only when BOTH pair members join on the SAME DAY in the SAME SESSION.**
> 
> Different day = NO income.
> Different session = NO income.
> Only SAME DAY + SAME SESSION = Income possible.

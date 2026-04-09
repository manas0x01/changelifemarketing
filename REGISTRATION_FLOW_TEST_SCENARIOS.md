# 🎯 REGISTRATION TEST SCENARIOS - 5 POINTS VALIDATION

## Scenario 1: Basic Income Earning (All 5 Points Correct)

### Setup:
```
User A (Sponsor) - Time: 10:00 AM (Morning Session)
 ├─ Left: User B (registers at 10:30 AM) ✓ Morning
 └─ Right: User C (registers at 10:45 AM) ✓ Morning
```

### What Happens During Registration:

**Step 1: User B Registration (10:30 AM)**
```
POST /api/auth/register
{
  sponsorId: "A",
  placementId: "A",
  position: "left",
  fullName: "User B"
}

Processing:
1. New user B created in database
2. directMembers added to User A:
   {
     memberId: "CLM20261",
     name: "User B",
     joinDate: new Date() // 2026-04-09T10:30:00 (includes timestamp!)
     position: "left"
   }
3. Metrics calculated
4. basicIncome = 0 (no pairs yet)
```

**Step 2: User C Registration (10:45 AM)**
```
POST /api/auth/register
{
  sponsorId: "A",
  placementId: "A",
  position: "right",
  fullName: "User C"
}

Processing:
1. New user C created
2. directMembers added to User A:
   {
     memberId: "CLM20262",
     name: "User C",
     joinDate: new Date() // 2026-04-09T10:45:00
     position: "right"
   }
3. Metrics calculated
4. Now User A has:
   - Left: 1 (User B at 10:30)
   - Right: 1 (User C at 10:45)
   - Pairs formed: 1
```

### Validation Check (Test All 5 Points):

**Call:** `POST /api/user/validate-basic-income`

**Response:**
```json
{
  "success": true,
  "data": {
    "morning": {
      "isValid": true,         // ✅ POINT 5: Same session
      "pairs": 1,              // ✅ POINT 4: Only 1 pair counts
      "income": 800            // ✅ POINT 2: 1000 - 50 - 150 = 800
    },
    "evening": {
      "isValid": false,
      "pairs": 0,
      "income": 0
    },
    "totalDaily": 800          // ✅ POINT 3: Max 2000 cap not exceeded
  },
  "dailyCap": 2000,            // ✅ POINT 3: Daily cap
  "sessionCap": 1000,          // ✅ POINT 3: Session cap
  "maxPairsPerSession": 1      // ✅ POINT 4: Max 1 pair
}
```

### Income Breakdown (All 4 Types):
```
Point 1 - 4 Income Types:
├─ basicIncome: ₹800         (from 1 pair × ₹800 per pair)
├─ boosterIncomeAmount: ₹0   (needs 12 pairs)
├─ awardIncome: ₹0           (needs rank achievement)
└─ repurchaseIncome: ₹0      (future feature)

Total Income: ₹800
```

### Why All 5 Points Pass:
1. ✅ **Point 1**: 4 types visible in schema, 1 active (basicIncome)
2. ✅ **Point 2**: Pair income calculated as 1000-50-150 = 800
3. ✅ **Point 3**: Daily cap = 2000, session cap = 1000, total = 800 (within limits)
4. ✅ **Point 4**: Even if 10 on left + 10 on right, only 1 pair counts = 800
5. ✅ **Point 5**: Both added in morning session (10:30 & 10:45 both < 12:00) = VALID

---

## Scenario 2: Cross-Session Blocking (POINT 5 FAILS)

### Setup:
```
User A (Sponsor)
 ├─ Left: User D (registers at 11:50 AM) - Morning Session
 └─ Right: User E (registers at 12:10 PM) - Evening Session ❌
```

### Registration Flow:

**User D Registration: 11:50 AM**
```
directMembers = [
  { memberId: "CLM20263", position: "left", joinDate: 2026-04-09T11:50:00 }
]

Morning Session Check:
- getHours() = 11 (< 12) ✓ Morning
```

**User E Registration: 12:10 PM**
```
directMembers = [
  { memberId: "CLM20263", position: "left", joinDate: 2026-04-09T11:50:00 },
  { memberId: "CLM20264", position: "right", joinDate: 2026-04-09T12:10:00 }
]

Evening Session Check:
- getHours() = 12 (>= 12) ✓ Evening
```

### Validation Check:

**Call:** `POST /api/user/validate-basic-income`

**Response:**
```json
{
  "success": true,
  "data": {
    "morning": {
      "isValid": false,        // ❌ No right member in morning
      "pairs": 0,
      "income": 0
    },
    "evening": {
      "isValid": false,        // ❌ No left member in evening
      "pairs": 0,
      "income": 0
    },
    "totalDaily": 0,
    "recommendation": "Members must be added in SAME 12-hour session"
  }
}
```

### Why Point 5 Fails:
```
Morning Session (12 AM - 11:59 AM):
  - Left: 1 member (D at 11:50) ✓
  - Right: 0 members ✗
  - Pairs formed: min(1, 0) = 0
  - Income: ₹0

Evening Session (12 PM - 11:59 PM):
  - Left: 0 members ✗
  - Right: 1 member (E at 12:10) ✓
  - Pairs formed: min(0, 1) = 0
  - Income: ₹0

❌ POINT 5 BLOCKED: Different sessions = NO INCOME
```

---

## Scenario 3: Multiple Pairs Per Session (POINT 4 CAPPING)

### Setup:
```
User A (Sponsor) - Morning Session (9 AM - 11:30 AM)
 ├─ Left: B (9:00), D (9:15), F (9:30), H (9:45), J (10:00)
 └─ Right: C (9:10), E (9:25), G (9:40), I (9:55), K (10:10)
```

### What System Sees:

```
directMembers = [
  { memberId: "B", position: "left", joinDate: 2026-04-09T09:00 },
  { memberId: "C", position: "right", joinDate: 2026-04-09T09:10 },
  { memberId: "D", position: "left", joinDate: 2026-04-09T09:15 },
  { memberId: "E", position: "right", joinDate: 2026-04-09T09:25 },
  { memberId: "F", position: "left", joinDate: 2026-04-09T09:30 },
  { memberId: "G", position: "right", joinDate: 2026-04-09T09:40 },
  { memberId: "H", position: "left", joinDate: 2026-04-09T09:45 },
  { memberId: "I", position: "right", joinDate: 2026-04-09T09:55 },
  { memberId: "J", position: "left", joinDate: 2026-04-09T10:00 },
  { memberId: "K", position: "right", joinDate: 2026-04-09T10:10 }
]
```

### Morning Session Filtering:

```javascript
// Filter members in morning (hours < 12)
leftInMorning = [B, D, F, H, J]     // 5 members
rightInMorning = [C, E, G, I, K]    // 5 members

// Calculate pairs
pairsInMorning = Math.min(5, 5) = 5 pairs

// But apply POINT 4 capping
countablePairs = Math.min(5, 1) = 1 pair  // ❌ Only 1 pair counts!

// Calculate income
grossIncome = 1000 * 1 = ₹1,000
tds = 1000 * 5% = ₹50
serviceCharge = 1000 * 15% = ₹150
netIncome = ₹800
```

### Validation Response:

```json
{
  "success": true,
  "data": {
    "morning": {
      "isValid": true,
      "pairs": 5,              // 5 pairs could be formed
      "income": 800            // But only 1 pair's income (₹800) counted!
    }
  }
}
```

### Why Point 4 Works:
```
Even with 5L + 5R = 5 pairs theoretically possible,
only 1 pair counts per session:

calculateBasicIncome(5, 'morning') =>
  countablePairs = Math.min(5, 1) = 1
  netIncome = ₹800 per 1 pair
  
Result: ₹800 (not ₹4,000 from 5 pairs)
```

---

## Scenario 4: Full Day (Both Sessions) - POINT 3 DAILY CAP

### Setup:

```
User A (Sponsor)

Morning (9 AM - 10 AM):
 ├─ Left: User B (9:30 AM)
 └─ Right: User C (9:45 AM)

Evening (2 PM - 3 PM):
 ├─ Left: User D (2:15 PM)
 └─ Right: User E (2:30 PM)
```

### Session Calculation:

```
Morning Session (12 AM - 11:59 AM):
├─ Left: 1 (B at 9:30, hours=9)
├─ Right: 1 (C at 9:45, hours=9)
├─ Pairs: min(1,1) = 1
├─ Income: 1 pair × ₹800 = ₹800
└─ Status: ✓ Valid

Evening Session (12 PM - 11:59 PM):
├─ Left: 1 (D at 2:15 PM, hours=14)
├─ Right: 1 (E at 2:30 PM, hours=14)
├─ Pairs: min(1,1) = 1
├─ Income: 1 pair × ₹800 = ₹800
└─ Status: ✓ Valid

TOTAL DAILY: ₹800 + ₹800 = ₹1,600 ✅ (Within ₹2,000 cap)
```

### Validation Response:

```json
{
  "success": true,
  "data": {
    "morning": {
      "isValid": true,
      "pairs": 1,
      "income": 800
    },
    "evening": {
      "isValid": true,
      "pairs": 1,
      "income": 800
    },
    "totalDaily": 1600        // ✅ POINT 3: Daily cap = ₹2,000 (1600 < 2000)
  },
  "dailyCap": 2000,
  "sessionCap": 1000,
  "maxPairsPerSession": 1
}
```

### Why Point 3 Works:
```
Daily Total = Morning (₹800) + Evening (₹800) = ₹1,600
Daily Cap = ₹2,000
Result: ₹1,600 ≤ ₹2,000 ✅
```

---

## Summary Table: All 5 Points in Action

| Point | Rule | Registration | Validation | Status |
|-------|------|--------------|-----------|--------|
| 1 | 4 Income Types | Tracking in schema | 4 fields visible | ✅ |
| 2 | ₹1000→₹800 | Stored in DB | Calculated in API | ✅ |
| 3 | Daily ₹2000 cap | 2 sessions tracked | Daily total checked | ✅ |
| 3 | Session ₹1000 cap | Session type stored | Per-session validated | ✅ |
| 4 | Max 1 pair/session | Multiple members ok | Capped at 1 pair | ✅ |
| 5 | Same session only | joinDate timestamp | Hours compared (< 12) | ✅ |

---

## Code Locations for All 5 Points

### Point 1: Model Definition
- **File**: `/models/User.ts`
- **Lines**: 109-135
- **Fields**: basicIncome, boosterIncomeAmount, awardIncome, repurchaseIncome

### Point 2: Calculation Logic
- **File**: `/lib/incomeCalculations.ts`
- **Lines**: 27-44
- **Function**: `calculateBinaryPairIncome()`

### Point 3: Session & Daily Capping
- **File**: `/lib/incomeCalculations.ts`
- **Lines**: 45-77
- **Constants**: `BASIC_INCOME_CONFIG`

### Point 4: Max Pair Capping
- **File**: `/lib/incomeCalculations.ts`
- **Lines**: 66-77
- **Function**: `calculateBasicIncome()`
- **Key**: `Math.min(pairsInSession, 1)`

### Point 5: Cross-Session Blocking
- **File**: `/lib/incomeCalculations.ts`
- **Lines**: 78-101
- **Function**: `validateBasicIncomePairMatching()`
- **Check**: `leftSession !== rightSession => NO INCOME`

---

## 🚀 How to Test in Real Scenario

1. **Create User A** (Sponsor)
2. **Register User B** at 10:30 AM (Left position)
3. **Register User C** at 10:45 AM (Right position)
4. **Call** `POST /api/user/validate-basic-income` for User A
5. **Verify response** shows:
   ```
   income: 800,
   totalDaily: 800,
   dailyCap: 2000,
   sessionCap: 1000,
   maxPairsPerSession: 1
   ```

✅ **All 5 Points Verified!**

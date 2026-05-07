# 🚀 Phase 2: Booster Level Implementation Plan

This document outlines the architectural specifications and logic for the **Booster Level** in the ChangeLife Marketing MLM system.

---

## 💎 1. Booster Upgrade Condition
A user is eligible for the Booster Level upgrade only when they meet the following requirement:
- **Condition:** Complete **12 VALID income sessions**.
- **Action:** Upon completion, the user status is upgraded to `BOOSTER LEVEL`.

---

## ⚡ 2. Core Concepts & Definitions

### Booster Concept
In the Booster phase, income generation shifts from simple pair existence to a per-pair matching model.
- **Income Source:** Generated per pair matched in a session.
- **Pair Definition:** `1 Left User + 1 Right User = 1 Pair`.

### Side Logic (Stock Side)
Whichever side (Left or Right) fills first or has an excess of members is designated as the **Initial Side** or **Stock Side**.
> **Example:** 
> - Left Team = 25
> - Right Team = 0
> - **Result:** Left side becomes the Stock Side.

---

## 💰 3. Income & Session Limits

| Feature | Limit / Value |
| :--- | :--- |
| **Income per Pair** | ₹1,000 |
| **Max Pairs per Session** | 10 Pairs |
| **Max Income per Session** | ₹10,000 |
| **Daily Max Income** | ₹20,000 (Morning + Evening) |

---

## ⚙️ 4. Booster Pair Engine Formulas

The engine uses specific mathematical rules to determine payouts and carry-forwards:

1.  **Pair Calculation:**
    `pairs = MIN(totalLeft, totalRight)`
2.  **Paid Pairs (Capped):**
    `paidPairs = MIN(pairs, 10)`
3.  **Session Income:**
    `income = paidPairs × 1000`
4.  **Carry Forward (Unpaired only):**
    `carry = ABS(totalLeft - totalRight)`

---

## 🌊 5. Flush-Out & Persistence Rules

### The Flush-Out Rule
If the total number of pairs in a session exceeds the cap (10), the extra pairs are "flushed out" regarding income, but they remain in the network.

**Logic for `pairs > 10`:**
- ✅ **Tree Integrity:** Users remain in the tree forever.
- ✅ **Consumption:** Pairs remain consumed (they cannot be reused for future income).
- ❌ **No Credit:** Income for pairs > 10 is **NOT** credited to the wallet.
- ❌ **No Carry Forward:** Extra paired users do **NOT** carry forward.

### Persistence Rule
- **Tree Never Shrinks:** Users are permanently part of the tree and are never deleted or removed after pairing or flushing.
- **Opportunity Change:** Only the income opportunity is consumed; the node remains in the hierarchy.

---

## 🔄 6. Session Processing Workflow

Every session (Morning/Evening) follows this 7-step execution flow:

1.  **STEP 1 — Load Carry Forward:** 
    - `totalLeft = carryLeft + newLeft`
    - `totalRight = carryRight + newRight`
2.  **STEP 2 — Calculate Pairs:** 
    - `pairs = MIN(totalLeft, totalRight)`
3.  **STEP 3 — Apply Session Cap:** 
    - `paidPairs = MIN(pairs, 10)`
4.  **STEP 4 — Calculate Income:** 
    - `income = paidPairs × 1000`
5.  **STEP 5 — Flush Extra Pair Income:** 
    - `flushedPairs = MAX(0, pairs - 10)` (Remains paired, generates NO future income).
6.  **STEP 6 — Calculate Carry Forward:** 
    - `carryLeft = MAX(0, totalLeft - totalRight)`
    - `carryRight = MAX(0, totalRight - totalLeft)`
    - *Note: ONLY unpaired users carry forward.*
7.  **STEP 7 — Credit Wallet:** 
    - `wallet += income`

---

## 🧠 7. Paired vs. Unpaired Comparison

| Type | Future Income? | Carry Forward? |
| :--- | :---: | :---: |
| **Unpaired Users** | ✅ Yes | ✅ Yes |
| **Paid Pairs (1-10)** | ❌ No | ❌ No |
| **Flushed Pairs (>10)** | ❌ No | ❌ No |

---

## 🤖 8. Session Engine (Cron Job) Flow

At the close of each session, a Cron Job must execute the following sequence for all Booster users:

1.  **Fetch** all users with `isBooster: true`.
2.  **Calculate** new joins (Left/Right) for the current session window.
3.  **Add** previous carry-forward balances.
4.  **Generate** pair count using the formula.
5.  **Apply** the 10-pair cap.
6.  **Flush** extra pair income (Mark as paired but non-earning).
7.  **Save** new carry-forward values for the next session.
8.  **Credit** the user's wallet with the calculated income.
9.  **Store** the session history in `boosterMatchingRecords`.

---

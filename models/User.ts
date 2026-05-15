import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { calculateBasicIncome } from '../lib/calculateBasicIncome';

export interface IUser extends Document {
  username: string;
  userId?: string;
  password: string;
  email?: string;
  phone?: string;
  mobileNo?: string;
  fullName?: string;
  gender?: string;
  dateOfBirth?: Date;
  panNo?: string;
  state?: string;
  district?: string;
  city?: string;
  address?: string;
  pincode?: string;
  bankName?: string;
  branchName?: string;
  accountNo?: string;
  ifsc?: string;
  accountType?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  registeredPackage?: string;
  registeredEPIN?: string;
  joiningDate?: string;
  sponsorId?: string;
  sponsorName?: string;
  placementId?: string;
  placementName?: string;
  placementPosition?: 'left' | 'right';
  leftChild?: string;
  rightChild?: string;
  memberType?: 'gold' | 'active';
  role?: string;
  basicRank?: string;
  boosterMatchingIncome?: number;
  boosterMatchingRecords?: {
    srNo: number;
    date: Date;
    fromLeftBoosterId?: string;
    fromLeftBoosterName?: string;
    fromRightBoosterId?: string;
    fromRightBoosterName?: string;
    pairsMatched: number;
    paidPairs: number;
    flashedPairs?: number;
    pairs?: number;
    income?: number;
    grossIncome: number;
    carryForwardPairs: number;
    sessionType: 'morning' | 'evening';
    tdsDeducted: number;
    serviceChargeDeducted: number;
    netIncome: number;
    status: 'Completed' | 'Pending' | 'Hold' | 'Released' | 'Paid';
    processed?: boolean;
  }[];
  boosterCarryForward?: {
    date: Date;
    sessionType: 'morning' | 'evening';
    pairsCarried: number;
    reason: string;
  }[];
  boosterPairsCarryForward?: { left: number; right: number };
  sessionBasedIncome?: {
    // Canonical fields (preferred): `date`, `sessionType`, `pairs`, `netIncome`
    date: Date;
    sessionType: 'morning' | 'evening';
    pairs: number;
    netIncome: number;
    // Optional/compatibility fields
    grossIncome?: number;
    tdsDeducted?: number;
    serviceChargeDeducted?: number;
    status?: 'Completed' | 'Pending';
    processed?: boolean;
    // Legacy aliases (kept for backward-compatibility)
    sessionDate?: Date;
    leftMembersInSession?: number;
    rightMembersInSession?: number;
    pairsInSession?: number;
    pairCount?: number;
    income?: number;
  }[];
  basicFlushHistory?: { date: Date; left: number; right: number; reason: string }[];
  totalTeam?: { left: number; right: number };
  sessionTeam?: { left: number; right: number };
  lastSessionType?: 'morning' | 'evening';
  lastSessionDate?: Date;
  isBooster?: boolean;
  boosterCount?: { left: number; right: number };
  boosterAchievedAt?: Date;
  boosterCuts?: number[];
  basicPairs?: number;
  boosterPairs?: number;
  matchedPairs?: number;
  basicIncome?: number;
  totalDirect?: number;
  activePins?: number;
  usedPins?: number;
  totalPins?: number;
  boosterIncome?: { amount: number; LG: number; RG: number; totalMatching: number };
  directMembers?: {
    memberId: string;
    name: string;
    joinDate: Date;
    position: string;
  }[];
  basicIncomeRecords?: {
    srNo: number; amount: number; pairCount: number;
    date: Date; description: string; status: string;
  }[];
  boosterIncomeRecords?: {
    srNo: number; amount: number; pairCount: number;
    date: Date; description: string; status: string;
  }[];
  awardIncome?: number;
  awardIncomeRecords?: {
    srNo: number; amount: number; awardName: string;
    date: Date; description: string; status: string;
  }[];
  repurchaseIncome?: number;
  repurchaseIncomeRecords?: {
    srNo: number; amount: number; repurchaseAmount: number; commission: number;
    date: Date; description: string; status: string;
  }[];
  currentAwardRank?: number; // Current rank achievement (1-13)
  awardRankStatus?: {
    rank: number;
    leftBoostersForRank: number; // Boosters used for CURRENT rank targeting
    rightBoostersForRank: number; // Boosters used for CURRENT rank targeting
    achievementDate?: Date;
    awardReceivedName?: string; // Name of award received at this rank
  };
  awardRankRecords?: {
    srNo: number;
    rank: number;
    rankName: string;
    achievedDate: Date;
    leftBoostersUsed: number;
    rightBoostersUsed: number;
    awardName: string;
    awardValue?: number; // In rupees for cash rewards
    status: 'Awarded' | 'Pending';
  }[];
  successPayments?: {
    srNo: number; fromDate: Date; toDate: Date; silverBinary: number;
    goldBinary: number; total: number; reimbursement: number; tds: number; netpay: number;
  }[];
  boosterCounting?: {
    srNo: number; RBV: number; LBV: number; RCarry: number; LCarry: number;
    matching: number; date: Date; fromMemberId: string; product: string; description: string;
  }[];
  boosterDownlineMembers?: {
    srNo: number; memberId: string; name: string; date: string; position: 'left' | 'right';
  }[];
  ePins?: {
    pin: string; packageName: string;
    status: 'Active' | 'Used' | 'Transferred' | 'Expired';
    usedDate?: Date; usedByUsername?: string; usedByName?: string;
    transferredFrom?: string; transferredFromName?: string;
    transferredTo?: string; transferredToName?: string; transferDate?: Date;
    remark?: string;
  }[];
  transferHistory?: {
    srNo: number; reqNo: string; fromUser: string; fromUserName: string;
    transferType: string; transferRejectDate: Date; package: string;
    quantity: number; amount: string;
    status: 'Transferred' | 'Rejected' | 'Pending' | 'Approved';
  }[];
  transferredEpins?: {
    date: Date; time: string; ePin: string; package: string;
    transferredTo: string; transferredToName: string;
    status: 'Success' | 'Failed' | 'Pending'; remark?: string;
  }[];
  pinPurchaseHistory?: {
    date: Date; packageName: string; quantity: number;
    totalAmount: number; paymentId: string; status: 'Success' | 'Failed' | 'Pending';
  }[];
  pinRequests?: {
    srNo: number; requestNo: string; date: Date; memberId: string; name: string;
    totalPins: number; totalAmount: string; description: string; type: 'Credit' | 'Debit';
  }[];
  totalIncome?: number;
  utrNumber?: string;
  bankAccountDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };

  withdrawRequests?: {
    requestNo: string;
    amount: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    requestDate: Date;
    processedDate?: Date;
    adminRemark?: string;
    utrNumber?: string;
    paymentMode?: string;
  }[];
  transactionPassword?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
  compareTransactionPassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: [true, 'Username is required'], unique: true, trim: true, minlength: [3, 'Username must be at least 3 characters long'], maxlength: [30, 'Username must not exceed 30 characters'] },
    userId: { type: String, required: false, unique: true, sparse: true, trim: true },
    password: { type: String, required: [true, 'Password is required'], select: false },
    email: { type: String, required: false, trim: true },
    phone: { type: String, required: false, trim: true },
    mobileNo: { type: String, required: false, trim: true },
    fullName: { type: String, required: false, trim: true },
    gender: { type: String, required: false, enum: ['Male', 'Female', 'Other'] },
    dateOfBirth: { type: Date, required: false },
    panNo: { type: String, required: false, trim: true, uppercase: true },
    state: { type: String, required: false, trim: true },
    district: { type: String, required: false, trim: true },
    city: { type: String, required: false, trim: true },
    address: { type: String, required: false, trim: true },
    pincode: { type: String, required: false, trim: true },
    bankName: { type: String, required: false, trim: true },
    branchName: { type: String, required: false, trim: true },
    accountNo: { type: String, required: false, trim: true },
    ifsc: { type: String, required: false, trim: true, uppercase: true },
    accountType: { type: String, required: false, enum: ['Savings', 'Saving', 'Current', 'Business'] },
    nomineeName: { type: String, required: false, trim: true },
    nomineeRelation: { type: String, required: false, default: 'Son', enum: ['Son', 'Daughter', 'Wife', 'Husband', 'Father', 'Mother', 'Brother', 'Sister', 'Other'] },
    registeredPackage: { type: String, required: false, trim: true },
    registeredEPIN: { type: String, required: false, trim: true },
    joiningDate: { type: String, required: false, trim: true },
    sponsorId: { type: String, required: false, trim: true },
    sponsorName: { type: String, required: false, trim: true },
    placementId: { type: String, required: false, trim: true },
    placementName: { type: String, required: false, trim: true },
    placementPosition: { type: String, required: false, enum: ['left', 'right'], trim: true },
    leftChild: { type: String, required: false, trim: true },
    rightChild: { type: String, required: false, trim: true },
    memberType: { type: String, required: false, enum: ['gold', 'active'], default: 'active' },
    role: { type: String, required: false, default: 'user', enum: ['user', 'admin', 'moderator'] },
    basicRank: { type: String, required: false, default: 'basic' },
    isBooster: { type: Boolean, default: false },
    boosterMatchingIncome: { type: Number, default: 0 },
    boosterMatchingRecords: { type: [{ srNo: Number, date: Date, fromLeftBoosterId: String, fromLeftBoosterName: String, fromRightBoosterId: String, fromRightBoosterName: String, pairsMatched: Number, paidPairs: Number, flashedPairs: Number, pairs: Number, income: Number, grossIncome: Number, carryForwardPairs: Number, sessionType: String, tdsDeducted: Number, serviceChargeDeducted: Number, netIncome: Number, status: String, processed: Boolean }], default: [] },
    boosterCarryForward: { type: [{ date: Date, sessionType: String, pairsCarried: Number, reason: String }], default: [] },
    boosterPairsCarryForward: { type: { left: { type: Number, default: 0 }, right: { type: Number, default: 0 } }, default: { left: 0, right: 0 } },
    directMembers: { type: [{ memberId: String, name: String, joinDate: Date, position: String }], default: [] },
    sessionBasedIncome: { type: [{ date: Date, sessionDate: Date, sessionType: String, pairs: Number, pairsInSession: Number, leftMembersInSession: Number, rightMembersInSession: Number, grossIncome: Number, netIncome: Number, tdsDeducted: Number, serviceChargeDeducted: Number, status: String, processed: Boolean }], default: [] },
    totalTeam: { type: { left: { type: Number, default: 0 }, right: { type: Number, default: 0 } }, default: { left: 0, right: 0 } },
    sessionTeam: { type: { left: { type: Number, default: 0 }, right: { type: Number, default: 0 } }, default: { left: 0, right: 0 } },
    basicFlushHistory: { type: [{ date: Date, left: Number, right: Number, reason: String }], default: [] },
    lastSessionType: { type: String, enum: ['morning', 'evening'], required: false },
    lastSessionDate: { type: Date, required: false },
    boosterCount: { type: { left: { type: Number, default: 0 }, right: { type: Number, default: 0 } }, default: { left: 0, right: 0 } },
    boosterAchievedAt: { type: Date, required: false },
    boosterCuts: { type: [Number], default: [] },
    basicPairs: { type: Number, default: 0 },
    boosterPairs: { type: Number, default: 0 },
    matchedPairs: { type: Number, default: 0 },
    activePins: { type: Number, default: 0 },
    usedPins: { type: Number, default: 0 },
    totalPins: { type: Number, default: 0 },
    totalDirect: { type: Number, default: 0 },
    basicIncome: { type: Number, default: 0 },
    boosterIncome: { type: { amount: { type: Number, default: 0 }, LG: { type: Number, default: 0 }, RG: { type: Number, default: 0 }, totalMatching: { type: Number, default: 0 } }, default: { amount: 0, LG: 0, RG: 0, totalMatching: 0 } },
    basicIncomeRecords: { type: [{ srNo: Number, amount: Number, pairCount: Number, date: Date, description: String, status: String }], default: [] },
    boosterIncomeRecords: { type: [{ srNo: Number, amount: Number, pairCount: Number, date: Date, description: String, status: String }], default: [] },
    awardIncome: { type: Number, default: 0 },
    awardIncomeRecords: { type: [{ srNo: Number, amount: Number, awardName: String, date: Date, description: String, status: String }], default: [] },
    currentAwardRank: { type: Number, required: false, default: 0 },
    awardRankStatus: {
      type: {
        rank: { type: Number, default: 0 },
        leftBoostersForRank: { type: Number, default: 0 },
        rightBoostersForRank: { type: Number, default: 0 },
        achievementDate: { type: Date, required: false },
        awardReceivedName: { type: String, required: false },
      },
      default: { rank: 0, leftBoostersForRank: 0, rightBoostersForRank: 0 },
    },
    awardRankRecords: {
      type: [
        {
          srNo: { type: Number, required: true },
          rank: { type: Number, required: true },
          rankName: { type: String, required: true },
          achievedDate: { type: Date, required: true },
          leftBoostersUsed: { type: Number, required: true },
          rightBoostersUsed: { type: Number, required: true },
          awardName: { type: String, required: true },
          awardValue: { type: Number, required: false },
          status: { type: String, enum: ['Awarded', 'Pending'], default: 'Awarded' },
        },
      ],
      default: [],
    },
    repurchaseIncome: { type: Number, default: 0 },
    repurchaseIncomeRecords: { type: [{ srNo: Number, amount: Number, repurchaseAmount: Number, commission: Number, date: Date, description: String, status: String }], default: [] },
    successPayments: { type: [{ srNo: Number, fromDate: Date, toDate: Date, silverBinary: Number, goldBinary: Number, total: Number, reimbursement: Number, tds: Number, netpay: Number }], default: [] },
    boosterCounting: { type: [{ srNo: Number, RBV: Number, LBV: Number, RCarry: Number, LCarry: Number, matching: Number, date: Date, fromMemberId: String, product: String, description: String }], default: [] },
    boosterDownlineMembers: { type: [{ srNo: Number, memberId: String, name: String, date: String, position: String }], default: [] },
    ePins: { type: [{ pin: String, packageName: String, status: String, usedDate: Date, usedByUsername: String, usedByName: String, transferredFrom: String, transferredFromName: String, transferredTo: String, transferredToName: String, transferDate: Date, remark: String }], default: [] },
    transferHistory: { type: [{ srNo: Number, reqNo: String, fromUser: String, fromUserName: String, transferType: String, transferRejectDate: Date, package: String, quantity: Number, amount: String, status: String }], default: [] },
    transferredEpins: { type: [{ date: Date, time: String, ePin: String, package: String, transferredTo: String, transferredToName: String, status: String, remark: String }], default: [] },
    pinPurchaseHistory: { type: [{ date: Date, packageName: String, quantity: Number, totalAmount: Number, paymentId: String, status: String }], default: [] },
    pinRequests: {
      type: [
        {
          srNo: { type: Number, required: true },
          requestNo: { type: String, required: true },
          date: { type: Date, required: true },
          memberId: { type: String, required: true },
          name: { type: String, required: true },
          totalPins: { type: Number, required: true },
          totalAmount: { type: String, required: true },
          description: { type: String, required: true },
          type: { type: String, enum: ['Credit', 'Debit'], required: true },
        },
      ],
      default: [],
    },
    totalIncome: { type: Number, default: 0 },
    utrNumber: { type: String, required: false, trim: true },
    bankAccountDetails: {
      type: {
        accountHolderName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        ifscCode: { type: String, default: '' },
        bankName: { type: String, default: '' },
      },
      default: { accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '' },
    },
    withdrawRequests: {
      type: [
        {
          requestNo: { type: String, required: true },
          amount: { type: Number, required: true },
          status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
          requestDate: { type: Date, default: Date.now },
          processedDate: { type: Date },
          adminRemark: { type: String, trim: true },
          utrNumber: { type: String, trim: true },
          paymentMode: { type: String, trim: true },
        },
      ],
      default: [],
    },
    transactionPassword: { type: String, required: false, select: false },
  },
  { timestamps: true }
);

// Add indexes for performance
userSchema.index({ placementId: 1 });
userSchema.index({ leftChild: 1 });
userSchema.index({ rightChild: 1 });
userSchema.index({ sponsorId: 1 });

userSchema.pre('save', async function (this: IUser) {
  console.log('💾 [PRE-SAVE] Starting save hook for user:', this.username || this.userId);
  console.log('💾 [PRE-SAVE] Is new document:', this.isNew);
  console.log('💾 [PRE-SAVE] Modified fields:', this.modifiedPaths());

  const salt = await bcrypt.genSalt(12);

  if (this.isModified('password')) {
    if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
      console.log('🔒 [PRE-SAVE] Password is modified and not hashed, hashing...');
      this.password = await bcrypt.hash(this.password, salt);
    } else {
      console.log('🔒 [PRE-SAVE] Password is already hashed, skipping.');
    }
  }

  // Check transaction password - only hash when modified or on new documents
  console.log('🔐 [PRE-SAVE] Checking transactionPassword modification state...');
  console.log('🔐 [PRE-SAVE] isModified("transactionPassword"):', this.isModified('transactionPassword'));
  console.log('🔐 [PRE-SAVE] transactionPassword value present:', !!this.transactionPassword);

  // Only process transactionPassword when it has been modified (or set on new docs)
  if (this.isModified('transactionPassword')) {
    if (this.transactionPassword) {
      console.log('🔐 [PRE-SAVE] Transaction password modified, processing...');
      const trimmedTxnPassword = this.transactionPassword.toString().trim();
      console.log('🔐 [PRE-SAVE] Trimmed length:', trimmedTxnPassword.length);

      if (trimmedTxnPassword.length > 0) {
        if (!trimmedTxnPassword.startsWith('$2a$') && !trimmedTxnPassword.startsWith('$2b$')) {
          console.log('🔐 [PRE-SAVE] Hashing transaction password with salt', salt);
          this.transactionPassword = await bcrypt.hash(trimmedTxnPassword, salt);
          console.log('✅ [PRE-SAVE] Transaction password hashed successfully');
        } else {
          console.log('🔐 [PRE-SAVE] Transaction password is already hashed, skipping.');
        }
      } else {
        console.log('⚠️ [PRE-SAVE] After trim, transaction password is empty; clearing field');
        this.transactionPassword = undefined as any;
      }
    } else {
      console.log('⚠️ [PRE-SAVE] transactionPassword modified but value is falsy; clearing field');
      this.transactionPassword = undefined as any;
    }
  } else {
    console.log('🔐 [PRE-SAVE] transactionPassword not modified; skipping hashing to avoid double-hash');
  }

  // Ensure `userId` exists and falls back to `username` when missing.
  try {
    if (!this.userId && this.username) {
      console.log('💡 [PRE-SAVE] userId missing — setting from username');
      this.userId = this.username;
      if (typeof (this as any).markModified === 'function') {
        try { (this as any).markModified('userId'); } catch (e) { }
      }
    }
  } catch (err) {
    console.error('❌ [PRE-SAVE] Error ensuring userId fallback:', err);
  }

  // 🔹 SELF-HEALING BOOSTER & INCOME SYNC
  try {
    const totalLeft = this.totalTeam?.left || 0;
    const totalRight = this.totalTeam?.right || 0;

    // 1. BOOSTER QUALIFICATION SYNC (Critical for existing users like CLMPP)
    // If user has 12 pairs OR is the pioneer user CLMPP, ensure they are a Booster
    const basicPairsCount = this.basicPairs || 0;
    const isPioneer = this.username === 'CLMPP';
    const shouldBeBooster = (basicPairsCount >= 12) || isPioneer;

    if (shouldBeBooster && !this.isBooster) {
      console.log(`🚀 [SELF-HEALING] Upgrading ${this.username} to Booster status (Requirement met or Pioneer).`);
      this.isBooster = true;
      this.basicRank = "Booster";
      this.boosterAchievedAt = this.boosterAchievedAt || new Date();

      // Release any existing 'Hold' records
      if (Array.isArray(this.boosterMatchingRecords)) {
        this.boosterMatchingRecords.forEach((record: any) => {
          if (record.status === 'Hold') record.status = 'Released';
        });
      }
    }

    // 3. AGGREGATE & TREE SYNC
    if (Array.isArray(this.sessionBasedIncome) && (totalLeft > 0 || totalRight > 0)) {
      console.log(`🔍 [SYNC] Checking Basic Income for ${this.username}. Tree: ${totalLeft}L | ${totalRight}R`);
      
      // Step A: Fix missing fields and Enforce Cuts retroactively
      let cumulativePairs = 0;
      this.sessionBasedIncome.forEach((rec: any) => {
        // Fallback for missing 'pairs' field (due to previous schema bug)
        if (!rec.pairs || rec.pairs === 0) {
          if ((Number(rec.netIncome) || 0) >= 1000 || (Number(rec.grossIncome) || 0) >= 1000 || (Number(rec.income) || 0) >= 1000) {
            rec.pairs = 1;
          } else if (rec.description?.toLowerCase().includes('cut')) {
            rec.pairs = 1;
          }
        }

         // CAPPING FIX: Ensure no single session record exceeds 1000
         if (Number(rec.netIncome) > 1000) {
            console.log(`⚠️ [SYNC] Capping inflated income for ${this.username}: ${rec.netIncome} -> 1000`);
            rec.netIncome = 1000;
         }

        cumulativePairs += (Number(rec.pairs) || 0);

        // Enforce strict cuts for Basic users (3rd, 6th, 9th, 12th)
        const cutLevels = [3, 6, 9, 12];
        if (this.username !== 'CLMPP' && cutLevels.includes(cumulativePairs) && Number(rec.netIncome) > 0) {
          console.log(`✂️ [SELF-HEALING] Retro-enforcing cut for pair #${cumulativePairs} of ${this.username}`);
          rec.netIncome = 0;
          rec.description = `Pair #${cumulativePairs} Cut (Fixed)`;
        }
      });

      let sumBasicIncome = this.sessionBasedIncome.reduce((acc: number, curr: any) => acc + (Number(curr.netIncome) || 0), 0);
      let sumBasicPairs = this.sessionBasedIncome.reduce((acc: number, curr: any) => acc + (Number(curr.pairs) || 0), 0);

      const actualTreePairs = Math.min(totalLeft, totalRight);

      // Snap to grid: Ensure wallet pairs don't exceed actual tree pairs
      if (sumBasicPairs > actualTreePairs) {
        console.log(`⚠️ [TREE SYNC] ${this.username} has ${sumBasicPairs} wallet pairs but only ${actualTreePairs} tree pairs. Adjusting...`);
        let excess = sumBasicPairs - actualTreePairs;
        for (let i = this.sessionBasedIncome.length - 1; i >= 0 && excess > 0; i--) {
          const rec = this.sessionBasedIncome[i];
          const canReduce = Math.min(Number(rec.pairs) || 0, excess);
          if (canReduce > 0) {
            rec.pairs = (Number(rec.pairs) || 0) - canReduce;
            if (rec.netIncome > 0) {
              const incomeToReduce = canReduce * 1000;
              rec.netIncome = Math.max(0, (Number(rec.netIncome) || 0) - incomeToReduce);
            }
            excess -= canReduce;
          }
        }
        // Recalculate sums
        sumBasicIncome = this.sessionBasedIncome.reduce((acc: number, curr: any) => acc + (Number(curr.netIncome) || 0), 0);
        sumBasicPairs = this.sessionBasedIncome.reduce((acc: number, curr: any) => acc + (Number(curr.pairs) || 0), 0);
      }

      if (this.basicIncome !== sumBasicIncome) {
        console.log(`[SELF-HEALING] Syncing basicIncome for ${this.username}: ${this.basicIncome} -> ${sumBasicIncome}`);
        this.basicIncome = sumBasicIncome;
      }
      if (this.basicPairs !== sumBasicPairs) {
        this.basicPairs = sumBasicPairs;
      }

      // Sync display records
      this.basicIncomeRecords = this.sessionBasedIncome.map((s: any, i: number) => ({
        srNo: i + 1,
        amount: Number(s.netIncome) || 0,
        pairCount: Number(s.pairs) || 0,
        date: s.date || s.sessionDate,
        description: s.description || (Number(s.netIncome) === 0 && Number(s.pairs) > 0 ? "3rd Pair Cut" : "Binary Income"),
        status: 'Completed'
      }));
    } else if (totalLeft === 0 && totalRight === 0) {
      // Hard reset if tree is truly empty
      if (this.basicIncome !== 0 || (this.sessionBasedIncome && this.sessionBasedIncome.length > 0)) {
        console.log(`[SELF-HEALING] Tree is empty for ${this.username}. Resetting wallet and history to 0.`);
        this.basicIncome = 0;
        this.basicPairs = 0;
        this.sessionBasedIncome = [];
        this.basicIncomeRecords = [];
      }
    }

    // 2.5 RETROACTIVE SYNC FOR BROKEN ACCOUNTS (Jumpstart)
    // If user has NO income records but has a tree, attempt to match the first pair.
    if ((this.basicIncome === 0 || !this.sessionBasedIncome || this.sessionBasedIncome.length === 0) && Math.min(totalLeft, totalRight) > 0) {
        console.log(`[SELF-HEALING] User ${this.username} has potential pairs but no income. Attempting retroactive match.`);
        const { calculateBasicIncome } = require('../lib/calculateBasicIncome');
        // Force sessionTeam to have at least 1,1 to trigger the match if it's currently empty
        if (!this.sessionTeam) this.sessionTeam = { left: 0, right: 0 };
        if (this.sessionTeam.left === 0) this.sessionTeam.left = 1;
        if (this.sessionTeam.right === 0) this.sessionTeam.right = 1;
        
        await calculateBasicIncome(this, this.lastSessionType || (new Date().getHours() < 12 ? "morning" : "evening"), this.lastSessionDate || new Date());
    }

    // 3. SESSION TRANSITION HEALING (Real-time clock based)
    const now = new Date();
    const currentHour = now.getHours();
    const currentSessionType = (currentHour < 12 ? "morning" : "evening");
    const nowDateStr = now.toDateString();
    const lastDateStr = this.lastSessionDate ? new Date(this.lastSessionDate).toDateString() : "";

    const sessionChanged = (lastDateStr !== nowDateStr) || (this.lastSessionType !== currentSessionType);

    if (sessionChanged) {
        console.log(`[SELF-HEALING] Session transition detected for ${this.username} (${this.lastSessionType} -> ${currentSessionType}). Flashing old session team.`);
        
        // Finalize old session before clearing
        if (this.sessionTeam && (this.sessionTeam.left > 0 || this.sessionTeam.right > 0)) {
           const { calculateBasicIncome } = require('../lib/calculateBasicIncome');
           await calculateBasicIncome(this, this.lastSessionType, this.lastSessionDate || new Date());
        }

        this.sessionTeam = { left: 0, right: 0 };
        this.lastSessionType = currentSessionType as any;
        this.lastSessionDate = now;
    }

    // 4. BOOSTER COUNT & CARRY-FORWARD SYNC (Real-time tree audit)
    const boosterResult = await (this.constructor as any).aggregate([
      { $match: { placementId: this.username } },
      {
        $graphLookup: {
          from: "users",
          startWith: "$username",
          connectFromField: "username",
          connectToField: "placementId",
          as: "descendants"
        }
      },
      {
        $project: {
          placementPosition: 1,
          isBooster: 1,
          boosterDescendants: {
            $filter: {
              input: "$descendants",
              as: "d",
              cond: { $eq: ["$$d.isBooster", true] }
            }
          }
        }
      }
    ]);

    let actualLeftBoosters = 0;
    let actualRightBoosters = 0;
    boosterResult.forEach((r: any) => {
      const count = (r.isBooster ? 1 : 0) + (r.boosterDescendants?.length || 0);
      if (r.placementPosition === 'left') actualLeftBoosters += count;
      if (r.placementPosition === 'right') actualRightBoosters += count;
    });

    if (Array.isArray(this.boosterMatchingRecords)) {
      // 1. CRITICAL FIX: If the user has NO boosters in downline, any booster matching income is a BUG.
      // Purge it to fix records for users like CLMAKS.
      if (actualLeftBoosters === 0 && actualRightBoosters === 0) {
        if ((this.boosterMatchingIncome || 0) > 0 || (this.boosterMatchingRecords?.length || 0) > 0) {
          console.log(`🧹 [SELF-HEALING] Purging incorrect booster income for ${this.username} (No booster descendants found).`);
          this.boosterMatchingIncome = 0;
          this.boosterMatchingRecords = [];
        }
      }

      // 2. Release any existing 'Hold' records if user is now a Booster
      if (this.isBooster) {
        let releasedAny = false;
        const todayStr = new Date().toDateString();
        // In TESTING MODE (or if triggered very quickly), we allow finding the most recent record
        // but we'll be less strict about the date to allow manual overrides.
        let sessionRecord = (this.sessionBasedIncome || []).find((s: any) => {
          const recDate = new Date(s.date || s.sessionDate);
          return recDate.toDateString() === todayStr && 
                 s.sessionType === this.lastSessionType && 
                 (Date.now() - recDate.getTime() < 10000);
        });
        this.boosterMatchingRecords.forEach((record: any) => {
          if (record.status === 'Hold') {
            record.status = 'Released';
            releasedAny = true;
          }
        });
        if (releasedAny) {
          console.log(`🔓 [SELF-HEALING] Released 'Hold' booster records for ${this.username} because they are now a Booster.`);
        }
      }

      // 3. Sum up released/completed records for the wallet
      const sumBooster = this.boosterMatchingRecords.reduce((acc: number, curr: any) => {
        if (curr.status === 'Released' || curr.status === 'Completed' || curr.status === 'Paid') {
          return acc + (Number(curr.netIncome) || 0);
        }
        return acc;
      }, 0);

      if (this.boosterMatchingIncome !== sumBooster) {
        console.log(`[SELF-HEALING] Syncing boosterMatchingIncome for ${this.username}: ${this.boosterMatchingIncome} -> ${sumBooster}`);
        this.boosterMatchingIncome = sumBooster;
      }

      // Sync the nested boosterIncome object for UI compatibility
      const sumBoosterPairs = this.boosterMatchingRecords.reduce((acc: number, curr: any) => {
        if (curr.status === 'Released' || curr.status === 'Completed' || curr.status === 'Paid') {
          return acc + (Number(curr.paidPairs || curr.pairs) || 0);
        }
        return acc;
      }, 0);

      if (!this.boosterIncome) this.boosterIncome = { amount: 0, LG: 0, RG: 0, totalMatching: 0 };
      this.boosterIncome.amount = sumBooster;
      this.boosterIncome.totalMatching = sumBoosterPairs;
    } else {
      this.boosterMatchingRecords = [];
      this.boosterMatchingIncome = 0;
      this.boosterIncome = { amount: 0, LG: 0, RG: 0, totalMatching: 0 };
    }

    if (!this.boosterCount) this.boosterCount = { left: 0, right: 0 };
    this.boosterCount.left = actualLeftBoosters;
    this.boosterCount.right = actualRightBoosters;

    // Sync LG/RG to boosterIncome for UI
    if (!this.boosterIncome) this.boosterIncome = { amount: 0, LG: 0, RG: 0, totalMatching: 0 };
    this.boosterIncome.LG = actualLeftBoosters;
    this.boosterIncome.RG = actualRightBoosters;

    // Total boosters matched in history
    const matchedBoosterPairs = (this.boosterMatchingRecords || []).reduce((acc: number, curr: any) => acc + (Number(curr.pairsMatched) || 0), 0);
    const newLeftCarry = Math.max(0, actualLeftBoosters - matchedBoosterPairs);
    const newRightCarry = Math.max(0, actualRightBoosters - matchedBoosterPairs);

    if (!this.boosterPairsCarryForward) this.boosterPairsCarryForward = { left: 0, right: 0 };

    // Only update if changed significantly
    if (this.boosterPairsCarryForward.left !== newLeftCarry || this.boosterPairsCarryForward.right !== newRightCarry) {
      console.log(`[SELF-HEALING] Syncing boosterPairsCarryForward for ${this.username}: L:${this.boosterPairsCarryForward.left}->${newLeftCarry}, R:${this.boosterPairsCarryForward.right}->${newRightCarry}`);
      this.boosterPairsCarryForward.left = newLeftCarry;
      this.boosterPairsCarryForward.right = newRightCarry;

      // If we have matchable pairs now, trigger the matching engine
      // BUT ONLY if we haven't matched them in this current session already to avoid infinite loops
      if (Math.min(newLeftCarry, newRightCarry) > 0) {
        const { calculateBoosterMatching } = require('../lib/calculateBoosterMatching');
        await calculateBoosterMatching(this);
      }
    }

    // 5. DIRECT MEMBERS SYNC (Real-time sponsorship audit)
    const directResult = await (this.constructor as any).find({
      sponsorId: this.username || this.userId
    }, 'userId username fullName createdAt placementPosition joiningDate registeredPackage');

    if (Array.isArray(directResult)) {
      const currentDirects = directResult.map((d: any) => ({
        memberId: d.username || d.userId,
        name: d.fullName || d.username,
        joinDate: d.createdAt,
        position: d.placementPosition || 'left'
      }));

      // Update directMembers array if count differs or it's empty
      if (!this.directMembers || this.directMembers.length !== currentDirects.length) {
        console.log(`[SELF-HEALING] Syncing directMembers for ${this.username}: ${this.directMembers?.length || 0} -> ${currentDirects.length}`);
        this.directMembers = currentDirects;
      }
      this.totalDirect = currentDirects.length;
    }

    // Ensure totalIncome is the sum of all income sources
    const computedTotal = (this.basicIncome || 0) + (this.boosterMatchingIncome || 0) + (this.awardIncome || 0) + (this.repurchaseIncome || 0);
    this.totalIncome = computedTotal as any;

    if (typeof (this as any).markModified === 'function') {
      this.markModified('basicIncome');
      this.markModified('boosterMatchingIncome');
      this.markModified('boosterIncome');
      this.markModified('totalIncome');
    }
  } catch (err) {
    console.error('❌ [PRE-SAVE] Error in self-healing:', err);
  }
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

userSchema.methods.compareTransactionPassword = async function (password: string): Promise<boolean> {
  if (!this.transactionPassword) {
    console.log('🔐 [DEBUG] No transaction password stored');
    return false;
  }

  // Trim the input password before comparison
  const trimmedInput = password.toString().trim();
  if (trimmedInput.length === 0) {
    console.log('🔐 [DEBUG] Empty password provided for comparison');
    return false;
  }

  try {
    const result = await bcrypt.compare(trimmedInput, this.transactionPassword);
    console.log('🔐 [DEBUG] Transaction password comparison result:', result);
    return result;
  } catch (error) {
    console.error('🔐 [ERROR] bcrypt comparison failed:', error);
    return false;
  }
};

if (mongoose.models.User) delete mongoose.models.User;

export default mongoose.model<IUser>('User', userSchema);
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
    grossIncome: number;
    carryForwardPairs: number;
    sessionType: 'morning' | 'evening';
    tdsDeducted: number;
    serviceChargeDeducted: number;
    netIncome: number;
    status: 'Completed' | 'Pending';
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
    boosterMatchingRecords: { type: [{ srNo: Number, date: Date, fromLeftBoosterId: String, fromLeftBoosterName: String, fromRightBoosterId: String, fromRightBoosterName: String, pairsMatched: Number, paidPairs: Number, grossIncome: Number, carryForwardPairs: Number, sessionType: String, tdsDeducted: Number, serviceChargeDeducted: Number, netIncome: Number, status: String }], default: [] },
    boosterCarryForward: { type: [{ date: Date, sessionType: String, pairsCarried: Number, reason: String }], default: [] },
    boosterPairsCarryForward: { type: { left: { type: Number, default: 0 }, right: { type: Number, default: 0 } }, default: { left: 0, right: 0 } },
    directMembers: { type: [{ memberId: String, name: String, joinDate: Date, position: String }], default: [] },
    sessionBasedIncome: { type: [{ sessionDate: Date, sessionType: String, leftMembersInSession: Number, rightMembersInSession: Number, pairsInSession: Number, grossIncome: Number, netIncome: Number, tdsDeducted: Number, serviceChargeDeducted: Number, status: String }], default: [] },
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
        try { (this as any).markModified('userId'); } catch (e) {}
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

    // 2. INCOME AGGREGATE & WALLET SYNC (Retroactive migration for booster binary income)
    if (this.isBooster && Array.isArray(this.boosterMatchingRecords) && this.boosterMatchingRecords.length > 0) {
      const recordsToMove: any[] = [];
      const remainingBoosterRecords: any[] = [];

      this.boosterMatchingRecords.forEach((record: any) => {
        if (record.status === 'Released' || record.status === 'Completed' || record.status === 'Paid') {
          // If this session is not in basic income yet, move it
          const existsInBasic = this.sessionBasedIncome?.some((s: any) => {
            const basicDateStr = new Date(s.date || s.sessionDate).toDateString();
            const recordDateStr = new Date(record.date).toDateString();
            return basicDateStr === recordDateStr && s.sessionType === record.sessionType;
          });
          
          if (!existsInBasic && (record.income > 0 || record.netIncome > 0)) {
            recordsToMove.push(record);
          } else {
            remainingBoosterRecords.push(record);
          }
        } else {
          remainingBoosterRecords.push(record);
        }
      });

      if (recordsToMove.length > 0) {
        if (!this.sessionBasedIncome) this.sessionBasedIncome = [];
        const sessionIncome = this.sessionBasedIncome;
        
        recordsToMove.forEach(r => {
          // Check if we already moved a record for this same session in this same loop
          const alreadyMoved = sessionIncome.find((s: any) => 
            new Date(s.date || s.sessionDate).toDateString() === new Date(r.date).toDateString() && 
            s.sessionType === r.sessionType
          );

          if (alreadyMoved) {
            // Merge into existing record
            alreadyMoved.pairs = (alreadyMoved.pairs || 0) + (r.pairs || r.paidPairs || 0);
            alreadyMoved.netIncome = (alreadyMoved.netIncome || 0) + (r.netIncome || r.income || 0);
            alreadyMoved.grossIncome = (alreadyMoved.grossIncome || 0) + (r.income || r.grossIncome || 0);
          } else {
            sessionIncome.push({
              date: r.date,
              sessionType: r.sessionType,
              pairs: r.pairs || r.paidPairs || 0,
              netIncome: r.netIncome || r.income || 0,
              grossIncome: r.income || r.grossIncome || 0,
              processed: true,
              status: 'Completed'
            });
          }
        });
        
        this.boosterMatchingRecords = remainingBoosterRecords;
      }
    }

    // 3. AGGREGATE & TREE SYNC
    if (Array.isArray(this.sessionBasedIncome)) {
      // First, ensure all records have a 'pairs' count (fix for legacy data)
      this.sessionBasedIncome.forEach((rec: any, index: number) => {
        if (typeof rec.pairs !== 'number') {
          // Infer pairs: If it's one of the first 12 records, it's 1 pair.
          // Otherwise, it's netIncome / 1000.
          if (index < 12) {
            rec.pairs = 1;
          } else {
            rec.pairs = Math.max(1, Math.floor((rec.netIncome || 0) / 1000));
          }
        }
      });



      let sumBasicIncome = this.sessionBasedIncome.reduce((acc: number, curr: any) => acc + (curr.netIncome || 0), 0);
      let sumBasicPairs = this.sessionBasedIncome.reduce((acc: number, curr: any) => acc + (curr.pairs || 0), 0);
      
      // 🔥 TREE SNAP-TO-GRID (Safety check for existing users like CLMPP)
      const actualTreePairs = Math.min(totalLeft, totalRight);

      // 🔥 SPECIFIC FIX FOR CLMPP LEGACY DUPLICATE (Record #13 issue)
      // Must run AFTER pair inference so rec.pairs is available
      if (this.username === 'CLMPP' && Array.isArray(this.sessionBasedIncome)) {
          this.sessionBasedIncome.forEach((rec: any, idx: number) => {
              // 1. Fix the duplicate record (Index 12 is record #13)
              if (idx === 12 && rec.netIncome === 2000) {
                  console.log(`🔧 [FIX] Correcting CLMPP record #13 (2000 -> 1000)`);
                  rec.netIncome = 1000;
                  rec.pairs = 1;
              }
              // 2. Fix any records that were accidentally zeroed out (up to 18th pair)
              if (idx >= 12 && rec.netIncome === 0 && idx < actualTreePairs) {
                  console.log(`🔧 [FIX] Restoring CLMPP record #${idx+1} (0 -> 1000)`);
                  rec.netIncome = 1000;
                  rec.pairs = 1;
              }
          });
          // Recalculate sums after our manual fixes
          sumBasicIncome = this.sessionBasedIncome.reduce((acc: number, curr: any) => acc + (curr.netIncome || 0), 0);
          sumBasicPairs = this.sessionBasedIncome.reduce((acc: number, curr: any) => acc + (curr.pairs || 0), 0);
      }

      if (sumBasicPairs > actualTreePairs) {
        console.log(`⚠️ [TREE SYNC] ${this.username} has ${sumBasicPairs} wallet pairs but only ${actualTreePairs} tree pairs. Adjusting...`);
        
        let excess = sumBasicPairs - actualTreePairs;
        for (let i = this.sessionBasedIncome.length - 1; i >= 0 && excess > 0; i--) {
          const rec = this.sessionBasedIncome[i];
          const canReduce = Math.min(rec.pairs || 0, excess);
          if (canReduce > 0) {
            rec.pairs = (rec.pairs || 0) - canReduce;
            // If we reduce pairs, we must reduce income accordingly
            // For booster phase, 1 pair = 1000.
            if (rec.netIncome > 0) {
                const incomeToReduce = canReduce * 1000;
                rec.netIncome = Math.max(0, (rec.netIncome || 0) - incomeToReduce);
            }
            excess -= canReduce;
          }
        }
        // Recalculate sums
        sumBasicIncome = this.sessionBasedIncome.reduce((acc: number, curr: any) => acc + (curr.netIncome || 0), 0);
        sumBasicPairs = this.sessionBasedIncome.reduce((acc: number, curr: any) => acc + (curr.pairs || 0), 0);
      }

      if (this.basicIncome !== sumBasicIncome) {
        console.log(`[SELF-HEALING] Correcting basicIncome for ${this.username}: ${this.basicIncome} -> ${sumBasicIncome}`);
        this.basicIncome = sumBasicIncome;
      }
      if (this.basicPairs !== sumBasicPairs) {
        console.log(`[SELF-HEALING] Correcting basicPairs for ${this.username}: ${this.basicPairs} -> ${sumBasicPairs}`);
        this.basicPairs = sumBasicPairs;
      }
    }

    // 3. INCOME AGGREGATE SYNC
    // HARD RESET FOR TESTING: If the tree is empty, reset the wallet and history to 0
    if (totalLeft === 0 && totalRight === 0) {
      if (this.basicIncome !== 0 || (this.sessionBasedIncome && this.sessionBasedIncome.length > 0)) {
        console.log(`[SELF-HEALING] Tree is empty for ${this.username}. Resetting wallet and history to 0.`);
        this.basicIncome = 0;
        this.basicPairs = 0;
        this.sessionBasedIncome = [];
        this.basicIncomeRecords = [];
        this.totalIncome = (this.boosterMatchingIncome || 0);
      }
    } else {
      // Standard sync from records
      if (Array.isArray(this.sessionBasedIncome)) {
        const sumBasic = this.sessionBasedIncome.reduce((acc: number, curr: any) => acc + (curr.netIncome || 0), 0);
        if (this.basicIncome !== sumBasic) {
          console.log(`[SELF-HEALING] Correcting basicIncome for ${this.username}: ${this.basicIncome} -> ${sumBasic}`);
          this.basicIncome = sumBasic;
        }
      }
    }

    if (Array.isArray(this.boosterMatchingRecords)) {
      // For booster matching income, we only sum 'Released' or 'Completed' or 'Paid' status records
      const sumBooster = this.boosterMatchingRecords.reduce((acc: number, curr: any) => {
        if (curr.status === 'Released' || curr.status === 'Completed' || curr.status === 'Paid') {
          return acc + (curr.netIncome || 0);
        }
        return acc;
      }, 0);

      if (this.boosterMatchingIncome !== sumBooster) {
        console.log(`[SELF-HEALING] Correcting boosterMatchingIncome for ${this.username}: ${this.boosterMatchingIncome} -> ${sumBooster}`);
        this.boosterMatchingIncome = sumBooster;
      }
    }

    // Ensure totalIncome is the sum of all income sources
    const computedTotal = (this.basicIncome || 0) + (this.boosterMatchingIncome || 0) + (this.awardIncome || 0) + (this.repurchaseIncome || 0);
    this.totalIncome = computedTotal as any;

    if (typeof (this as any).markModified === 'function') {
      this.markModified('basicIncome');
      this.markModified('boosterMatchingIncome');
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
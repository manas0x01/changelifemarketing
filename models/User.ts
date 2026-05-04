import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

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
    boosterMatchingRecords: { type: [{ srNo: Number, date: Date, fromLeftBoosterId: String, fromLeftBoosterName: String, fromRightBoosterId: String, fromRightBoosterName: String, pairsMatched: Number, grossIncome: Number, carryForwardPairs: Number, sessionType: String, tdsDeducted: Number, serviceChargeDeducted: Number, netIncome: Number, status: String }], default: [] },
    boosterCarryForward: { type: [{ date: Date, sessionType: String, pairsCarried: Number, reason: String }], default: [] },
    boosterPairsCarryForward: { type: { left: { type: Number, default: 0 }, right: { type: Number, default: 0 } }, default: { left: 0, right: 0 } },
    directMembers: { type: [{ memberId: String, name: String, joinDate: Date, position: String }], default: [] },
    sessionBasedIncome: { type: [{ sessionDate: Date, sessionType: String, leftMembersInSession: Number, rightMembersInSession: Number, pairsInSession: Number, grossIncome: Number, netIncome: Number, tdsDeducted: Number, serviceChargeDeducted: Number, status: String }], default: [] },
    totalTeam: { type: { left: { type: Number, default: 0 }, right: { type: Number, default: 0 } }, default: { left: 0, right: 0 } },
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

userSchema.pre('save', async function (this: IUser) {
  console.log('💾 [PRE-SAVE] Starting save hook for user:', this.username || this.userId);
  console.log('💾 [PRE-SAVE] Is new document:', this.isNew);
  console.log('💾 [PRE-SAVE] Modified fields:', this.modifiedPaths());
  
  const salt = await bcrypt.genSalt(12);
  
  if (this.isModified('password')) {
    console.log('🔒 [PRE-SAVE] Password is modified, hashing...');
    this.password = await bcrypt.hash(this.password, salt);
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
        console.log('🔐 [PRE-SAVE] Hashing transaction password with salt', salt);
        this.transactionPassword = await bcrypt.hash(trimmedTxnPassword, salt);
        console.log('✅ [PRE-SAVE] Transaction password hashed successfully');
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
  try {
    const hasSessionIncome = Array.isArray(this.sessionBasedIncome) && this.sessionBasedIncome.length > 0;
    const hasBasicRecords = Array.isArray(this.basicIncomeRecords) && this.basicIncomeRecords.length > 0;
    const isSessionModified = this.isModified('sessionBasedIncome');
    
    // Sync if sessionBasedIncome was modified OR if basicIncomeRecords is empty but sessionBasedIncome has data
    if (isSessionModified || (hasSessionIncome && !hasBasicRecords)) {
      if (isSessionModified) {
        console.log('💡 [PRE-SAVE] sessionBasedIncome modified — syncing basicIncomeRecords');
      } else {
        console.log('💡 [PRE-SAVE] basicIncomeRecords empty but sessionBasedIncome has data — syncing');
      }
      
      // DEDUPLICATE: Keep only 1 record per session type
      const uniqueSessions = new Map();
      for (const s of this.sessionBasedIncome || []) {
        if (s && s.sessionType && s.status === "Completed") {
          if (!uniqueSessions.has(s.sessionType)) {
            uniqueSessions.set(s.sessionType, s);
          }
        }
      }
      const sessions = Array.from(uniqueSessions.values());
      
      // Update the array with deduplicated records
      if (sessions.length !== (this.sessionBasedIncome?.length || 0)) {
        console.log(`💡 [PRE-SAVE] Deduplicated: ${this.sessionBasedIncome?.length} -> ${sessions.length} records`);
        this.sessionBasedIncome = sessions;
      }

      if (!Array.isArray(this.basicIncomeRecords)) this.basicIncomeRecords = [];
      let nextSrNo = (this.basicIncomeRecords?.length || 0) + 1;
      
      console.log(`💡 [PRE-SAVE] Processing ${sessions.length} session records...`);
      for (const s of sessions) {
        if (!s) {
          console.log('💡 [PRE-SAVE] Skipping null session record');
          continue;
        }
        // Check both date field names (schema uses sessionDate, code pushes date)
        let sessionDateValue: Date | undefined = s.date || s.sessionDate;
        console.log(`💡 [PRE-SAVE] Session record: date=${s.date}, sessionDate=${s.sessionDate}, netIncome=${s.netIncome}, grossIncome=${s.grossIncome}, status=${s.status}`);
        if (!sessionDateValue) {
          console.log(`💡 [PRE-SAVE] No date found, using current date for record with netIncome=${s.netIncome}`);
          sessionDateValue = new Date(); // Use current date as fallback
        }
        
        // Skip pending sessions
        const status = (s.status || '').toString().toLowerCase();
        if (status === 'pending') {
          console.log('💡 [PRE-SAVE] Skipping pending session');
          continue;
        }
        
        const sessionTime = new Date(sessionDateValue).getTime();
        const existingIndex = this.basicIncomeRecords.findIndex((r: any) => r && r.date && new Date(r.date).getTime() === sessionTime);

        const amountValue = (typeof s.netIncome === 'number')
          ? s.netIncome
          : (typeof s.grossIncome === 'number')
            ? s.grossIncome
            : (typeof s.income === 'number')
              ? s.income
              : 0;

        if (existingIndex === -1) {
          // Add new record
          console.log(`💡 [PRE-SAVE] Adding new basicIncomeRecord: amount=${amountValue}, date=${sessionDateValue}`);
          this.basicIncomeRecords.push({
            srNo: nextSrNo++,
            amount: amountValue,
            pairCount: s.pairs || s.pairsInSession || s.pairCount || 0,
            date: new Date(sessionDateValue),
            description: `Income from ${s.sessionType || ''} session`,
            status: s.status || 'Completed',
          } as any);
        } else {
          // Update existing record
          console.log(`💡 [PRE-SAVE] Updating existing basicIncomeRecord at index ${existingIndex}: amount=${amountValue}`);
          const rec: any = this.basicIncomeRecords[existingIndex];
          rec.amount = amountValue;
          rec.pairCount = s.pairs || s.pairsInSession || s.pairCount || 0;
          rec.status = s.status || rec.status;
        }
      }
      console.log(`💡 [PRE-SAVE] Sync complete - basicIncomeRecords now has ${this.basicIncomeRecords.length} records`);
    }

    // DEDUPLICATE basicIncomeRecords too (keep only 1 per session description)
    if (Array.isArray(this.basicIncomeRecords) && this.basicIncomeRecords.length > 0) {
      const uniqueRecords = new Map();
      for (const r of this.basicIncomeRecords) {
        const key = r.description || r.date?.toString() || Math.random();
        if (!uniqueRecords.has(key)) {
          uniqueRecords.set(key, r);
        }
      }
      const dedupedRecords = Array.from(uniqueRecords.values());
      if (dedupedRecords.length !== this.basicIncomeRecords.length) {
        console.log(`💡 [PRE-SAVE] Deduplicated basicIncomeRecords: ${this.basicIncomeRecords.length} -> ${dedupedRecords.length}`);
        this.basicIncomeRecords = dedupedRecords;
      }
    }

    // ALWAYS recalculate basicIncome from basicIncomeRecords to ensure it's correct
    if (Array.isArray(this.basicIncomeRecords)) {
      const totalFromRecords = this.basicIncomeRecords
        .filter((r: any) => (r.status || '').toLowerCase() === 'completed')
        .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      
      this.basicIncome = totalFromRecords;
      // Also fix basicPairs to match actual unique sessions
      this.basicPairs = (this.sessionBasedIncome || []).filter((s: any) => s.status === "Completed").length;
      console.log(`💰 [PRE-SAVE] basicIncome recalculated: ₹${this.basicIncome}, basicPairs: ${this.basicPairs}`);
    }
  } catch (err) {
    console.error('❌ [PRE-SAVE] Error deriving basicIncome:', err);
  }
  // Ensure totalIncome is derived from current income sources (single source of truth)
  try {
    const computedTotal = (this.basicIncome || 0) + (this.boosterMatchingIncome || 0) + (this.awardIncome || 0) + (this.repurchaseIncome || 0);
    if (this.totalIncome !== computedTotal) {
      this.totalIncome = computedTotal as any;
      if (typeof (this as any).markModified === 'function') {
        try { (this as any).markModified('totalIncome'); } catch (e) {}
      }
    }
  } catch (err) {
    console.error('❌ [PRE-SAVE] Error deriving totalIncome:', err);
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
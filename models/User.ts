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
  basicRank?: string; // User rank for basic income eligibility
  boosterStatus?: {
    isBoosterLeft?: boolean;
    isBoosterRight?: boolean;
    boosterQualificationDateLeft?: Date;
    boosterQualificationDateRight?: Date;
    pairsCompletedLeft?: number;
    pairsCompletedRight?: number;
  };
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
  directMembers?: {
    memberId: string;
    name: string;
    joinDate: Date;
    position: 'left' | 'right';
  }[];
  sessionBasedIncome?: {
    sessionDate: Date;
    sessionType: 'morning' | 'evening';
    leftMembersInSession: number;
    rightMembersInSession: number;
    pairsInSession: number;
    grossIncome: number;
    netIncome: number;
    tdsDeducted: number;
    serviceChargeDeducted: number;
    status: 'Completed' | 'Pending';
  }[];
  totalTeam?: { left: number; right: number };
  totalDirect?: { left: number; right: number };
  basicIncome?: number;
  boosterIncomeAmount?: number;
  boosterIncome?: { LG: number; RG: number; totalBoosterMatching: number };
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
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
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
    boosterStatus: { 
      type: { 
        isBoosterLeft: { type: Boolean, default: false }, 
        isBoosterRight: { type: Boolean, default: false },
        boosterQualificationDateLeft: { type: Date, required: false },
        boosterQualificationDateRight: { type: Date, required: false },
        pairsCompletedLeft: { type: Number, default: 0 },
        pairsCompletedRight: { type: Number, default: 0 }
      }, 
      default: { isBoosterLeft: false, isBoosterRight: false, pairsCompletedLeft: 0, pairsCompletedRight: 0 }
    },
    boosterMatchingIncome: { type: Number, default: 0 },
    boosterMatchingRecords: { type: [{ srNo: Number, date: Date, fromLeftBoosterId: String, fromLeftBoosterName: String, fromRightBoosterId: String, fromRightBoosterName: String, pairsMatched: Number, grossIncome: Number, carryForwardPairs: Number, sessionType: String, tdsDeducted: Number, serviceChargeDeducted: Number, netIncome: Number, status: String }], default: [] },
    boosterCarryForward: { type: [{ date: Date, sessionType: String, pairsCarried: Number, reason: String }], default: [] },
    directMembers: { type: [{ memberId: String, name: String, joinDate: Date, position: String }], default: [] },
    sessionBasedIncome: { type: [{ sessionDate: Date, sessionType: String, leftMembersInSession: Number, rightMembersInSession: Number, pairsInSession: Number, grossIncome: Number, netIncome: Number, tdsDeducted: Number, serviceChargeDeducted: Number, status: String }], default: [] },
    totalTeam: { type: { left: { type: Number, default: 0 }, right: { type: Number, default: 0 } }, default: { left: 0, right: 0 } },
    totalDirect: { type: { left: { type: Number, default: 0 }, right: { type: Number, default: 0 } }, default: { left: 0, right: 0 } },
    basicIncome: { type: Number, default: 0 },
    boosterIncomeAmount: { type: Number, default: 0 },
    boosterIncome: { type: { LG: { type: Number, default: 0 }, RG: { type: Number, default: 0 }, totalBoosterMatching: { type: Number, default: 0 } }, default: { LG: 0, RG: 0, totalBoosterMatching: 0 } },
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
    // ── NEW: Withdraw Requests Array ──
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
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  const salt = await bcrypt.genSalt(12);
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

if (mongoose.models.User) delete mongoose.models.User;

export default mongoose.model<IUser>('User', userSchema);
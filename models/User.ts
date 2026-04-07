import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  userId?: string;
  password: string;
  transactionPassword?: string;
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
  memberType?: 'gold' | 'active';
  role?: string;
  totalTeam?: { left: number; right: number };
  totalDirectAmount?: number;
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
    usedDate?: Date; transferredFrom?: string; transferredFromName?: string;
    transferredTo?: string; transferredToName?: string; transferDate?: Date; remark?: string;
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
  compareTransactionPassword(transactionPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: [true, 'Username is required'], unique: true, trim: true, minlength: [3, 'Username must be at least 3 characters long'], maxlength: [30, 'Username must not exceed 30 characters'] },
    userId: { type: String, required: false, unique: true, sparse: true, trim: true },
    password: { type: String, required: [true, 'Password is required'], select: false },
    transactionPassword: { type: String, required: false, select: false },
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
    memberType: { type: String, required: false, enum: ['gold', 'active'], default: 'active' },
    role: { type: String, required: false, default: 'user', enum: ['user', 'admin', 'moderator'] },
    totalTeam: { type: { left: { type: Number, default: 0 }, right: { type: Number, default: 0 } }, default: { left: 0, right: 0 } },
    totalDirect: { type: { left: { type: Number, default: 0 }, right: { type: Number, default: 0 } }, default: { left: 0, right: 0 } },
    totalDirectAmount: { type: Number, default: 0 },
    basicIncome: { type: Number, default: 0 },
    boosterIncomeAmount: { type: Number, default: 0 },
    boosterIncome: { type: { LG: { type: Number, default: 0 }, RG: { type: Number, default: 0 }, totalBoosterMatching: { type: Number, default: 0 } }, default: { LG: 0, RG: 0, totalBoosterMatching: 0 } },
    basicIncomeRecords: { type: [{ srNo: Number, amount: Number, pairCount: Number, date: Date, description: String, status: String }], default: [] },
    boosterIncomeRecords: { type: [{ srNo: Number, amount: Number, pairCount: Number, date: Date, description: String, status: String }], default: [] },
    successPayments: { type: [{ srNo: Number, fromDate: Date, toDate: Date, silverBinary: Number, goldBinary: Number, total: Number, reimbursement: Number, tds: Number, netpay: Number }], default: [] },
    boosterCounting: { type: [{ srNo: Number, RBV: Number, LBV: Number, RCarry: Number, LCarry: Number, matching: Number, date: Date, fromMemberId: String, product: String, description: String }], default: [] },
    boosterDownlineMembers: { type: [{ srNo: Number, memberId: String, name: String, date: String, position: String }], default: [] },
    ePins: { type: [{ pin: String, packageName: String, status: String, usedDate: Date, transferredFrom: String, transferredFromName: String, transferredTo: String, transferredToName: String, transferDate: Date, remark: String }], default: [] },
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
  if (this.isModified('transactionPassword') && this.transactionPassword) {
    this.transactionPassword = await bcrypt.hash(this.transactionPassword, salt);
  }
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

userSchema.methods.compareTransactionPassword = async function (transactionPassword: string): Promise<boolean> {
  if (!this.transactionPassword) return false;
  return bcrypt.compare(transactionPassword, this.transactionPassword);
};

if (mongoose.models.User) delete mongoose.models.User;

export default mongoose.model<IUser>('User', userSchema);
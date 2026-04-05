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
  joiningDate?: string;
  sponsorId?: string;
  sponsorName?: string;
  placementId?: string;
  placementName?: string;
  placementPosition?: 'left' | 'right';
  role?: string;
  totalTeam?: {
    left: number;
    right: number;
  };
  totalDirectAmount?: number;
  totalDirect?: {
    left: number;
    right: number;
  };
  basicIncome?: number;
  boosterIncomeAmount?: number;
  boosterIncome?: {
    LG: number;
    RG: number;
    totalGoldMatching: number;
  };
  ePins?: {
    pin: string;
    packageName: string;
    usedDate?: Date;
    transferredFrom?: string;
    transferredFromName?: string;
    transferredTo?: string;
    transferredToName?: string;
    transferDate?: Date;
    remark?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
  compareTransactionPassword(transactionPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username must not exceed 30 characters'],
    },
    userId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    transactionPassword: {
      type: String,
      required: false,
      select: false,
    },
    email: {
      type: String,
      required: false,
      trim: true,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
    },
    mobileNo: {
      type: String,
      required: false,
      trim: true,
    },
    fullName: {
      type: String,
      required: false,
      trim: true,
    },
    gender: {
      type: String,
      required: false,
      enum: ['Male', 'Female', 'Other'],
    },
    dateOfBirth: {
      type: Date,
      required: false,
    },
    panNo: {
      type: String,
      required: false,
      trim: true,
      uppercase: true,
    },
    state: {
      type: String,
      required: false,
      trim: true,
    },
    district: {
      type: String,
      required: false,
      trim: true,
    },
    city: {
      type: String,
      required: false,
      trim: true,
    },
    address: {
      type: String,
      required: false,
      trim: true,
    },
    pincode: {
      type: String,
      required: false,
      trim: true,
    },
    bankName: {
      type: String,
      required: false,
      trim: true,
    },
    branchName: {
      type: String,
      required: false,
      trim: true,
    },
    accountNo: {
      type: String,
      required: false,
      trim: true,
    },
    ifsc: {
      type: String,
      required: false,
      trim: true,
      uppercase: true,
    },
    accountType: {
      type: String,
      required: false,
      enum: ['Savings', 'Current', 'Business'],
    },
    nomineeName: {
      type: String,
      required: false,
      trim: true,
    },
    nomineeRelation: {
      type: String,
      required: false,
      default: 'Son',
      enum: ['Son', 'Daughter', 'Wife', 'Husband', 'Father', 'Mother', 'Brother', 'Sister', 'Other'],
    },
    joiningDate: {
      type: String,
      required: false,
      trim: true,
    },
    sponsorId: {
      type: String,
      required: false,
      trim: true,
    },
    sponsorName: {
      type: String,
      required: false,
      trim: true,
    },
    placementId: {
      type: String,
      required: false,
      trim: true,
    },
    placementName: {
      type: String,
      required: false,
      trim: true,
    },
    placementPosition: {
      type: String,
      required: false,
      enum: ['left', 'right'],
      trim: true,
    },
    role: {
      type: String,
      required: false,
      default: 'user',
      enum: ['user', 'admin', 'moderator'],
    },
    totalTeam: {
      type: {
        left: {
          type: Number,
          default: 0,
        },
        right: {
          type: Number,
          default: 0,
        },
      },
      default: { left: 0, right: 0 },
    },
    totalDirect: {
      type: {
        left: {
          type: Number,
          default: 0,
        },
        right: {
          type: Number,
          default: 0,
        },
      },
      default: { left: 0, right: 0 },
    },
    totalDirectAmount: {
      type: Number,
      default: 0,
    },
    basicIncome: {
      type: Number,
      default: 0,
    },
    boosterIncomeAmount: {
      type: Number,
      default: 0,
    },
    boosterIncome: {
      type: {
        LG: {
          type: Number,
          default: 0,
        },
        RG: {
          type: Number,
          default: 0,
        },
        totalGoldMatching: {
          type: Number,
          default: 0,
        },
      },
      default: { LG: 0, RG: 0, totalGoldMatching: 0 },
    },
    ePins: {
      type: [
        {
          pin: String,
          packageName: String,
          usedDate: Date,
          transferredFrom: String,
          transferredFromName: String,
          transferredTo: String,
          transferredToName: String,
          transferDate: Date,
          remark: String,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
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

userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(password, this.password);
};

userSchema.methods.compareTransactionPassword = async function (
  transactionPassword: string
): Promise<boolean> {
  if (!this.transactionPassword) {
    return false;
  }
  return bcrypt.compare(transactionPassword, this.transactionPassword);
};

// Force clear old models to ensure schema is fresh
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model<IUser>('User', userSchema);
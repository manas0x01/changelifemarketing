import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  password: string;
  transactionPassword?: string;
  email?: string;
  phone?: string;
  fullName?: string;
  role?: string;
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
    fullName: {
      type: String,
      required: false,
      trim: true,
    },
    role: {
      type: String,
      required: false,
      default: 'user',
      enum: ['user', 'admin', 'moderator'],
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

export default mongoose.models.User ||
  mongoose.model<IUser>('User', userSchema);
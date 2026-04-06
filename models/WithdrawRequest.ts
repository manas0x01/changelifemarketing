import mongoose, { Schema, Document } from 'mongoose';

export interface IWithdrawRequest extends Document {
  userId: string;
  userName: string;
  userFullName: string;
  mobileNo: string;
  requestNo: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestDate: Date;
  processedDate?: Date;
  processedBy?: string;
  adminRemark?: string;
  utrNumber?: string;
  paymentMode?: string;
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const withdrawRequestSchema = new Schema<IWithdrawRequest>(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userFullName: { type: String, required: true },
    mobileNo: { type: String, required: true },
    requestNo: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    requestDate: { type: Date, default: Date.now },
    processedDate: Date,
    processedBy: String,
    adminRemark: String,
    utrNumber: String,
    paymentMode: String,
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.WithdrawRequest ||
  mongoose.model<IWithdrawRequest>('WithdrawRequest', withdrawRequestSchema);

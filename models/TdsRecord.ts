import mongoose, { Schema, Document } from 'mongoose';

export interface ITdsRecord extends Document {
  recordKey: string; // Unique key e.g. `${userId}_${dateStr}_${sessionType}` or `${userId}_${fy}`
  userId: string;
  fullName: string;
  panNo?: string;
  mobileNo?: string;
  city?: string;
  state?: string;
  address?: string;
  financialYear: string; // e.g. "2026-2027", "2025-2026"
  periodMonth?: string; // e.g. "2026-05"
  paymentDate: Date;
  totalCommission: number;
  tdsRate: number; // percentage applied (e.g. 2, 5)
  tdsAmount: number;
  netPayable: number;
  status: 'Pending' | 'Paid' | 'Filed';
  challanNo?: string;
  acknowledgementNo?: string;
  filingDate?: Date;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const tdsRecordSchema = new Schema<ITdsRecord>(
  {
    recordKey: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    fullName: { type: String, required: true },
    panNo: { type: String, trim: true, uppercase: true },
    mobileNo: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    address: { type: String, trim: true },
    financialYear: { type: String, required: true, index: true },
    periodMonth: { type: String, index: true },
    paymentDate: { type: Date, required: true, index: true },
    totalCommission: { type: Number, required: true, default: 0 },
    tdsRate: { type: Number, required: true, default: 2 },
    tdsAmount: { type: Number, required: true, default: 0 },
    netPayable: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Filed'],
      default: 'Pending',
      index: true,
    },
    challanNo: { type: String, trim: true },
    acknowledgementNo: { type: String, trim: true },
    filingDate: { type: Date },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.TdsRecord || mongoose.model<ITdsRecord>('TdsRecord', tdsRecordSchema);

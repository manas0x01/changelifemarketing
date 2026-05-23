import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  userId: string;
  username: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  details?: string;
  timestamp: Date;
}

const activityLogSchema = new Schema<IActivityLog>({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  action: { type: String, required: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  details: { type: String, required: false },
  timestamp: { type: Date, default: Date.now }
});

if (mongoose.models.ActivityLog) delete mongoose.models.ActivityLog;

export default mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);

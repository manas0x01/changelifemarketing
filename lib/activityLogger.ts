import ActivityLog from '../models/ActivityLog';
import { connectDB } from './database';

export async function logActivity(
  userId: string,
  username: string,
  action: string,
  ipAddress: string,
  userAgent: string,
  details?: string
) {
  try {
    await connectDB();
    await ActivityLog.create({
      userId,
      username,
      action,
      ipAddress: ipAddress || "unknown",
      userAgent: userAgent || "unknown",
      details: details || ""
    });
    console.log(`📝 [Activity Logged] User: ${username}, Action: ${action}`);
  } catch (error) {
    console.error("❌ Failed to create activity log:", error);
  }
}

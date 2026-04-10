import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  await connectDB();
  const adminUser = await User.findOne({ username: session?.user?.username });

  const stats = {
    totalUsers: await User.countDocuments(),
    activeUsers: await User.countDocuments({ memberType: "active" }),
    adminUser: adminUser?.username,
    totalIncome: adminUser?.totalIncome || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Welcome, {adminUser?.fullName || adminUser?.username}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-700 rounded-lg p-6">
            <p className="text-slate-300 text-sm mb-2">Total Users</p>
            <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-6">
            <p className="text-slate-300 text-sm mb-2">Active Users</p>
            <p className="text-3xl font-bold text-white">{stats.activeUsers}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-6">
            <p className="text-slate-300 text-sm mb-2">Admin User</p>
            <p className="text-2xl font-bold text-green-400">{stats.adminUser}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-6">
            <p className="text-slate-300 text-sm mb-2">Total Income</p>
            <p className="text-3xl font-bold text-yellow-400">₹{stats.totalIncome}</p>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="bg-slate-700 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Admin Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/users"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-center transition"
            >
              👥 Manage Users
            </Link>
            <Link
              href="/admin/orders"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-center transition"
            >
              📦 Manage Orders
            </Link>
            <Link
              href="/admin/achievers"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-center transition"
            >
              🏆 Achievers
            </Link>
            <Link
              href="/admin/withdrawrequests"
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg text-center transition"
            >
              💳 Withdraw Requests
            </Link>
            <Link
              href="/admin/createepin"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-center transition"
            >
              🎫 Create E-PIN
            </Link>
            <Link
              href="/admin/recalculate-metrics"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-center transition"
            >
              📊 Recalculate Metrics
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-slate-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Info</h2>
          <div className="space-y-3 text-slate-300">
            <p>📅 Current Date: {new Date().toLocaleDateString('en-IN')}</p>
            <p>⏰ Current Time: {new Date().toLocaleTimeString('en-IN')}</p>
            <p>👤 Session User: {session?.user?.username}</p>
            <p>🔐 Role: {session?.user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

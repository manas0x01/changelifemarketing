"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Filter, ChevronLeft, ChevronRight,
  Trash2, Edit3, X, Check, Shield, Star, User,
  MapPin, Phone, Mail, Calendar, TrendingUp,
  RefreshCw, Download, ChevronDown, AlertTriangle,
  Eye, ArrowUpDown, ArrowUp, ArrowDown, Loader2,
  UserCheck, UserX, Crown, Package, IndianRupee,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface UserRecord {
  _id: string;
  username: string;
  userId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  mobileNo?: string;
  role?: string;
  memberType?: string;
  joiningDate?: string;
  sponsorId?: string;
  sponsorName?: string;
  placementId?: string;
  placementName?: string;
  placementPosition?: string;
  registeredPackage?: string;
  state?: string;
  district?: string;
  city?: string;
  basicIncome?: number;
  boosterIncomeAmount?: number;
  boosterIncome?: { amount?: number; LG?: number; RG?: number; totalMatching?: number };
  totalTeam?: { left: number; right: number };
  totalDirect?: { left: number; right: number };
  totalDirectAmount?: number;
  isBlocked?: boolean;
  plainPassword?: string;
  plainTransactionPassword?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
interface Summary {
  totalUsers: number;
  totalAdmin: number;
  totalBooster: number;
  totalActive: number;
  totalIncome: number;
}

type SortField = 'createdAt' | 'updatedAt' | 'username' | 'fullName' | 'joiningDate' | 'basicIncome' | 'boosterIncomeAmount';
type SortOrder = 'asc' | 'desc';

const AddUserModal = ({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    mobileNo: '',
    transactionPassword: '',
    confirmTransactionPassword: '',
    role: 'user',
    memberType: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<null | { username: string; password: string; transactionPassword: string }>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error('Username and password are required');
      return;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (formData.mobileNo && formData.mobileNo.length !== 10) {
      toast.error('Mobile number must be 10 digits');
      return;
    }
    // Transaction password validations
    if (!formData.transactionPassword || !formData.confirmTransactionPassword) {
      toast.error('Transaction password and confirmation are required');
      return;
    }
    if (formData.transactionPassword !== formData.confirmTransactionPassword) {
      toast.error('Transaction passwords do not match');
      return;
    }
    if (formData.transactionPassword.trim().length < 4) {
      toast.error('Transaction Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        fullName: formData.fullName,
        mobileNo: formData.mobileNo,
        role: formData.role,
        memberType: formData.memberType,
        transactionPassword: formData.transactionPassword,
      };

      const res = await fetch('/api/admin/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setCreatedCreds({
        username: json.user?.username ?? formData.username,
        password: json.rawPassword ?? formData.password,
        transactionPassword: json.rawTransactionPassword ?? formData.transactionPassword,
      });
    } catch (error: any) {
      toast.error(error.message ?? 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (e) {
      toast.error('Failed to copy');
    }
  };

  const handleDone = () => {
    setCreatedCreds(null);
    onClose();
    onSuccess();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A6E5A]/40 backdrop-blur-sm"
      onClick={() => createdCreds ? handleDone() : onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-[#FFFFFF] w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#0A6E5A] px-6 py-5 flex items-center justify-between">
          <h3 className="font-['Fraunces'] text-[1.25rem] text-[#FFFFFF]">Add New User</h3>
          <button onClick={() => createdCreds ? handleDone() : onClose()} className="w-8 h-8 rounded-full bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 flex items-center justify-center transition-colors" suppressHydrationWarning={true}>
            <X className="w-4 h-4 text-[#FFFFFF]" />
          </button>
        </div>

        {!createdCreds ? (
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333333]/50 mb-1.5">Username *</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Enter username" className="w-full px-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] text-[#333333] placeholder:text-[#333333]/30 transition-colors" suppressHydrationWarning={true} />
          </div>
          <div>
            <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333333]/50 mb-1.5">Password (min 8 chars) *</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter password" className="w-full px-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] text-[#333333] placeholder:text-[#333333]/30 transition-colors" suppressHydrationWarning={true} />
          </div>
          <div>
            <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333333]/50 mb-1.5">Full Name</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter full name" className="w-full px-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] text-[#333333] placeholder:text-[#333333]/30 transition-colors" suppressHydrationWarning={true} />
          </div>
          <div>
            <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333333]/50 mb-1.5">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email" className="w-full px-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] text-[#333333] placeholder:text-[#333333]/30 transition-colors" suppressHydrationWarning={true} />
          </div>
          <div>
            <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333333]/50 mb-1.5">Mobile Number (10 digits)</label>
            <input type="text" name="mobileNo" value={formData.mobileNo} onChange={handleChange} placeholder="Enter mobile number" maxLength={10} className="w-full px-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] text-[#333333] placeholder:text-[#333333]/30 transition-colors" suppressHydrationWarning={true} />
          </div>
          <div>
            <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333333]/50 mb-1.5">Transaction Password *</label>
            <input type="password" name="transactionPassword" value={formData.transactionPassword} onChange={handleChange} placeholder="Enter transaction password" className="w-full px-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] text-[#333333] placeholder:text-[#333333]/30 transition-colors" suppressHydrationWarning={true} />
          </div>
          <div>
            <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333333]/50 mb-1.5">Confirm Transaction Password *</label>
            <input type="password" name="confirmTransactionPassword" value={formData.confirmTransactionPassword} onChange={handleChange} placeholder="Confirm transaction password" className="w-full px-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] text-[#333333] placeholder:text-[#333333]/30 transition-colors" suppressHydrationWarning={true} />
          </div>
          <div>
            <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333333]/50 mb-1.5">Role</label>
            <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] text-[#333333] transition-colors" suppressHydrationWarning={true}>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333333]/50 mb-1.5">Member Type</label>
            <select name="memberType" value={formData.memberType} onChange={handleChange} className="w-full px-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] text-[#333333] transition-colors" suppressHydrationWarning={true}>
              <option value="active">Active</option>
              <option value="gold">Gold</option>
            </select>
          </div>
          </form>
        ) : (
          <div className="px-6 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <h4 className="font-['Fraunces'] text-[1rem] text-[#0A6E5A]">Credentials (shown once)</h4>
            <div className="space-y-3">
              <div className="bg-[#F8FAF9] border border-[#0A6E5A]/10 p-3 rounded">
                <p className="text-[0.75rem] text-[#333333]/60">Username</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-medium">{createdCreds.username}</span>
                  <button onClick={() => copyToClipboard(createdCreds.username)} className="text-sm text-[#0A6E5A]">Copy</button>
                </div>
              </div>
              <div className="bg-[#F8FAF9] border border-[#0A6E5A]/10 p-3 rounded">
                <p className="text-[0.75rem] text-[#333333]/60">Password</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-medium">{createdCreds.password}</span>
                  <button onClick={() => copyToClipboard(createdCreds.password)} className="text-sm text-[#0A6E5A]">Copy</button>
                </div>
              </div>
              <div className="bg-[#F8FAF9] border border-[#0A6E5A]/10 p-3 rounded">
                <p className="text-[0.75rem] text-[#333333]/60">Transaction Password</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-medium">{createdCreds.transactionPassword}</span>
                  <button onClick={() => copyToClipboard(createdCreds.transactionPassword)} className="text-sm text-[#0A6E5A]">Copy</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 pb-6 flex gap-3 border-t border-[#0A6E5A]/10">
          {!createdCreds ? (
            <>
              <button onClick={onClose} className="flex-1 py-3 border border-[#0A6E5A]/20 font-['Roboto'] text-[0.875rem] text-[#0A6E5A] hover:bg-[#0A6E5A]/5 transition-colors mt-4">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 bg-[#0A6E5A] font-['Roboto'] text-[0.875rem] text-[#FFFFFF] hover:bg-[#0A6E5A]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 mt-4">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </>
          ) : (
            <>
              <button onClick={handleDone} className="flex-1 py-3 border border-[#0A6E5A]/20 font-['Roboto'] text-[0.875rem] text-[#0A6E5A] hover:bg-[#0A6E5A]/5 transition-colors mt-4">
                Close
              </button>
              <button onClick={handleDone} className="flex-1 py-3 bg-[#0A6E5A] font-['Roboto'] text-[0.875rem] text-[#FFFFFF] hover:bg-[#0A6E5A]/90 transition-colors flex items-center justify-center gap-2 mt-4">
                <Check className="w-4 h-4" /> Done
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color = 'green' }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: 'green' | 'gold' | 'white';
}) => {
  const colorMap = { green: 'text-[#0A6E5A]', gold: 'text-[#C9A84C]', white: 'text-[#FFFFFF]' };
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-[#FFFFFF] border border-[#0A6E5A]/10 p-5 md:p-6 relative overflow-hidden group hover:shadow-lg hover:border-[#0A6E5A]/30 transition-all duration-300">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#0A6E5A]" />
      <div className="absolute -right-6 -top-6 w-20 h-20 bg-[#0A6E5A]/3 rounded-full group-hover:scale-150 transition-transform duration-500" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333333]/50 mb-1">{label}</p>
          <p className={`font-['Fraunces'] text-[1.75rem] md:text-[2rem] ${colorMap[color]} leading-none`}>{value}</p>
          {sub && <p className="font-['Roboto'] text-[0.75rem] text-[#333333]/40 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-full bg-[#0A6E5A]/8 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#0A6E5A]" />
        </div>
      </div>
    </motion.div>
  );
};

const Badge = ({ type, value, isBlocked }: { type: 'role' | 'member' | 'status'; value?: string; isBlocked?: boolean }) => {
  if (type === 'status') {
    if (isBlocked) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[0.65rem] font-['Roboto'] font-semibold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200">
          <UserX className="w-2.5 h-2.5" />Blocked
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[0.65rem] font-['Roboto'] font-semibold uppercase tracking-wider bg-[#0A6E5A]/10 text-[#0A6E5A] border border-[#0A6E5A]/20">
        <UserCheck className="w-2.5 h-2.5" />Active
      </span>
    );
  }
  if (type === 'role') {
    const map: Record<string, string> = { admin: 'bg-[#0A6E5A]/10 text-[#0A6E5A] border border-[#0A6E5A]/20', moderator: 'bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20', user: 'bg-[#333333]/8 text-[#333333]/60 border border-[#333333]/10' };
    const icons: Record<string, React.ElementType> = { admin: Shield, moderator: Star, user: User };
    const Ic = icons[value ?? 'user'] ?? User;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[0.65rem] font-['Roboto'] font-semibold uppercase tracking-wider ${map[value ?? 'user'] ?? map.user}`}>
        <Ic className="w-2.5 h-2.5" />{value}
      </span>
    );
  }
  const memberMap: Record<string, string> = { gold: 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30', active: 'bg-[#0A6E5A]/10 text-[#0A6E5A] border border-[#0A6E5A]/20' };
  const memberIcons: Record<string, React.ElementType> = { gold: Crown, active: UserCheck };
  const MIc = memberIcons[value ?? 'active'] ?? UserCheck;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[0.65rem] font-['Roboto'] font-semibold uppercase tracking-wider ${memberMap[value ?? 'active'] ?? memberMap.active}`}>
      <MIc className="w-2.5 h-2.5" />{value}
    </span>
  );
};

const SortIcon = ({ field, current, order }: { field: string; current: string; order: SortOrder }) => {
  if (field !== current) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
  return order === 'asc' ? <ArrowUp className="w-3 h-3 text-[#C9A84C]" /> : <ArrowDown className="w-3 h-3 text-[#C9A84C]" />;
};

const EditModal = ({ user, onClose, onSave }: { user: UserRecord; onClose: () => void; onSave: (id: string, role: string, memberType: string, isBlocked: boolean, password?: string, transactionPassword?: string) => Promise<void> }) => {
  const [role, setRole] = useState(user.role ?? 'user');
  const [memberType, setMemberType] = useState(user.memberType ?? 'active');
  const [isBlocked, setIsBlocked] = useState(user.isBlocked ?? false);
  const [password, setPassword] = useState('');
  const [transactionPassword, setTransactionPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(user._id, role, memberType, isBlocked, password, transactionPassword);
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A6E5A]/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 20 }} className="bg-[#FFFFFF] w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#0A6E5A] px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="font-['Fraunces'] text-[1.25rem] text-[#FFFFFF]">Edit User</h3>
            <p className="font-['Roboto'] text-[0.75rem] text-[#FFFFFF]/60 mt-0.5">{user.fullName ?? user.username} · {user.userId}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 flex items-center justify-center transition-colors" suppressHydrationWarning={true}>
            <X className="w-4 h-4 text-[#FFFFFF]" />
          </button>
        </div>
        <div className="px-6 py-6 space-y-5 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333333]/50 mb-2">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {['user', 'moderator', 'admin'].map((r) => (
                <button key={r} onClick={() => setRole(r)} suppressHydrationWarning={true} className={`py-2 text-[0.8rem] font-['Roboto'] font-medium uppercase tracking-wider transition-all ${role === r ? 'bg-[#0A6E5A] text-[#FFFFFF]' : 'border border-[#0A6E5A]/20 text-[#0A6E5A] hover:bg-[#0A6E5A]/5'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333333]/50 mb-2">Member Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['active', 'gold'].map((m) => (
                <button key={m} onClick={() => setMemberType(m)} suppressHydrationWarning={true} className={`py-2 text-[0.8rem] font-['Roboto'] font-medium uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${memberType === m ? (m === 'gold' ? 'bg-[#C9A84C] text-[#FFFFFF]' : 'bg-[#0A6E5A] text-[#FFFFFF]') : 'border border-[#0A6E5A]/20 text-[#0A6E5A] hover:bg-[#0A6E5A]/5'}`}>
                  {m === 'gold' ? <Crown className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}{m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333333]/50 mb-2">Block Status</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setIsBlocked(false)} suppressHydrationWarning={true} className={`py-2.5 text-[0.8rem] font-['Roboto'] font-medium uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${!isBlocked ? 'bg-[#0A6E5A] text-[#FFFFFF]' : 'border border-[#0A6E5A]/20 text-[#0A6E5A] hover:bg-[#0A6E5A]/5'}`}>
                <UserCheck className="w-3.5 h-3.5" /> Active
              </button>
              <button onClick={() => setIsBlocked(true)} suppressHydrationWarning={true} className={`py-2.5 text-[0.8rem] font-['Roboto'] font-medium uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${isBlocked ? 'bg-red-500 text-[#FFFFFF]' : 'border border-red-200 text-red-500 hover:bg-red-50'}`}>
                <UserX className="w-3.5 h-3.5" /> Blocked
              </button>
            </div>
          </div>
          <div>
            <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333333]/50 mb-1.5">Change Login Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" className="w-full px-3 py-2 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] text-[#333333] placeholder:text-[#333333]/30 transition-colors" suppressHydrationWarning={true} />
          </div>
          <div>
            <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333333]/50 mb-1.5">Change Transaction Password</label>
            <input type="password" value={transactionPassword} onChange={(e) => setTransactionPassword(e.target.value)} placeholder="Leave blank to keep current" className="w-full px-3 py-2 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] text-[#333333] placeholder:text-[#333333]/30 transition-colors" suppressHydrationWarning={true} />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 pt-4 border-t border-[#0A6E5A]/10">
          <button onClick={onClose} className="flex-1 py-3 border border-[#0A6E5A]/20 font-['Roboto'] text-[0.875rem] text-[#0A6E5A] hover:bg-[#0A6E5A]/5 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-[#0A6E5A] font-['Roboto'] text-[0.875rem] text-[#FFFFFF] hover:bg-[#0A6E5A]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const DeleteModal = ({ user, onClose, onConfirm }: { user: UserRecord; onClose: () => void; onConfirm: (id: string) => Promise<void> }) => {
  const [deleting, setDeleting] = useState(false);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#FFFFFF] w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="font-['Fraunces'] text-[1.25rem] text-[#333333] mb-2">Delete User?</h3>
          <p className="font-['Roboto'] text-[0.875rem] text-[#333333]/60 mb-6">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold text-[#0A6E5A]">{user.fullName ?? user.username}</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-[#333333]/20 font-['Roboto'] text-[0.875rem] text-[#333333]/60 hover:bg-[#333333]/5 transition-colors">
              Cancel
            </button>
            <button onClick={async () => { setDeleting(true); await onConfirm(user._id); setDeleting(false); }} disabled={deleting} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 font-['Roboto'] text-[0.875rem] text-[#FFFFFF] transition-colors flex items-center justify-center gap-2">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const UserDrawer = ({ user, onClose }: { user: UserRecord; onClose: () => void }) => {
  const income = (user.basicIncome ?? 0) + ((user.boosterIncome?.amount ?? user.boosterIncomeAmount) ?? 0);
  const team = (user.totalTeam?.left ?? 0) + (user.totalTeam?.right ?? 0);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end bg-[#0A6E5A]/30 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="bg-[#FFFFFF] w-full max-w-md h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#0A6E5A] px-6 py-5 flex items-center justify-between z-10">
          <div>
            <h3 className="font-['Fraunces'] text-[1.25rem] text-[#FFFFFF]">{user.fullName ?? user.username}</h3>
            <p className="font-['Roboto'] text-[0.75rem] text-[#C9A84C]">{user.userId ?? user.username}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 flex items-center justify-center rounded-full transition-colors" suppressHydrationWarning={true}>
            <X className="w-4 h-4 text-[#FFFFFF]" />
          </button>
        </div>
        <div className="px-6 py-6 space-y-6">
          <div className="flex gap-2">
            <Badge type="role" value={user.role ?? 'user'} />
            <Badge type="member" value={user.memberType ?? 'active'} />
            <Badge type="status" isBlocked={user.isBlocked} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Income', value: `₹${income.toLocaleString('en-IN')}`, icon: IndianRupee },
              { label: 'Total Team', value: team, icon: Users },
              { label: 'Left Team', value: user.totalTeam?.left ?? 0, icon: ArrowDown },
              { label: 'Right Team', value: user.totalTeam?.right ?? 0, icon: ArrowDown },
            ].map(({ label, value, icon: Ic }) => (
              <div key={label} className="border border-[#0A6E5A]/10 p-3 bg-[#0A6E5A]/2">
                <Ic className="w-3.5 h-3.5 text-[#C9A84C] mb-1" />
                <p className="font-['Fraunces'] text-[1.1rem] text-[#0A6E5A]">{value}</p>
                <p className="font-['Roboto'] text-[0.65rem] uppercase tracking-wider text-[#333333]/40">{label}</p>
              </div>
            ))}
          </div>
          {[
            { title: 'Credentials', rows: [{ label: 'Login Password', value: user.plainPassword || 'Hashed (Cannot decrypt)' }, { label: 'Transaction Password', value: user.plainTransactionPassword || 'Hashed (Cannot decrypt)' }] },
            { title: 'Personal Info', rows: [{ label: 'Username', value: user.username }, { label: 'User ID', value: user.userId }, { label: 'Full Name', value: user.fullName }, { label: 'Email', value: user.email }, { label: 'Phone', value: user.phone ?? user.mobileNo }] },
            { title: 'Network Info', rows: [{ label: 'Sponsor ID', value: user.sponsorId }, { label: 'Sponsor Name', value: user.sponsorName }, { label: 'Package', value: user.registeredPackage }, { label: 'Joined', value: user.joiningDate }] },
            { title: 'Location', rows: [{ label: 'City', value: user.city }, { label: 'State', value: user.state }] },
          ].map(({ title, rows }) => (
            <div key={title}>
              <h4 className="font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#C9A84C] mb-3 flex items-center gap-2">
                <span className="w-8 h-px bg-[#C9A84C]" />{title}
              </h4>
              <div className="space-y-2">
                {rows.filter(r => r.value).map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-start py-2 border-b border-[#0A6E5A]/5 last:border-0">
                    <span className="font-['Roboto'] text-[0.75rem] text-[#333333]/50">{label}</span>
                    <span className="font-['Roboto'] text-[0.8rem] text-[#333333] font-medium max-w-[55%] text-right">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function AdminDashboardUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilter, setShowFilter] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null);
  const [viewUser, setViewUser] = useState<UserRecord | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const searchRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchUsers = useCallback(async (overrides?: Partial<{ search: string; roleFilter: string; typeFilter: string; page: number; sortBy: SortField; sortOrder: SortOrder }>) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(overrides?.page ?? page),
        limit: String(limit),
        search: overrides?.search ?? search,
        role: overrides?.roleFilter ?? roleFilter,
        memberType: overrides?.typeFilter ?? typeFilter,
        sortBy: overrides?.sortBy ?? sortBy,
        sortOrder: overrides?.sortOrder ?? sortOrder,
      });

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error((await res.json()).message ?? 'Failed to fetch users');

      const json = await res.json();
      setUsers(json.data ?? []);
      setPagination(json.pagination ?? null);
      setSummary(json.summary ?? null);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, roleFilter, typeFilter, sortBy, sortOrder]);

  useEffect(() => { fetchUsers(); }, [page, sortBy, sortOrder, roleFilter, typeFilter]);

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { setPage(1); fetchUsers({ search: val, page: 1 }); }, 400);
  };

  const handleSort = (field: SortField) => {
    const newOrder: SortOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(field);
    setSortOrder(newOrder);
  };

  const handleSaveEdit = async (id: string, role: string, memberType: string, isBlocked: boolean, password?: string, transactionPassword?: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role, memberType, isBlocked, password, transactionPassword })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setUsers(prev => prev.map(u => u._id === id ? {
        ...u,
        role,
        memberType,
        isBlocked,
        plainPassword: json.data?.plainPassword ?? u.plainPassword,
        plainTransactionPassword: json.data?.plainTransactionPassword ?? u.plainTransactionPassword
      } : u));
      setEditUser(null);
      toast.success('User updated successfully.');
    } catch (e: any) { toast.error(e.message ?? 'Update failed.'); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setUsers(prev => prev.filter(u => u._id !== id));
      if (pagination) setPagination(p => p ? { ...p, total: p.total - 1 } : p);
      setDeleteUser(null);
      toast.success('User deleted.');
    } catch (e: any) { toast.error(e.message ?? 'Delete failed.'); }
  };

  const exportCSV = () => {
    const headers = ['User ID', 'Full Name', 'Username', 'Email', 'Phone', 'Role', 'Member Type', 'State', 'Package', 'Joined', 'Basic Income', 'Booster Income'];
    const rows = users.map(u => [u.userId ?? '', u.fullName ?? '', u.username, u.email ?? '', u.phone ?? u.mobileNo ?? '', u.role ?? '', u.memberType ?? '', u.state ?? '', u.registeredPackage ?? '', u.joiningDate ?? '', u.basicIncome ?? 0, u.boosterIncome?.amount ?? u.boosterIncomeAmount ?? 0]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `users-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const thClass = "px-4 py-3 text-left font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#333333]/50 whitespace-nowrap select-none";
  const sortable = (field: SortField, label: string) => (
    <th className={`${thClass} cursor-pointer hover:text-[#0A6E5A] transition-colors`} onClick={() => handleSort(field)}>
      <span className="inline-flex items-center gap-1.5">
        {label} <SortIcon field={field} current={sortBy} order={sortOrder} />
      </span>
    </th>
  );

  return (
    <div className="bg-[#F5F7F6] min-h-screen">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="sticky top-0 z-20 bg-[#FFFFFF]/95 backdrop-blur border-b border-[#0A6E5A]/10 px-6 md:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['Fraunces'] text-[2rem] md:text-[2.5rem] text-[#0A6E5A]">User Management</h1>
            <p className="font-['Roboto'] text-[#333333]/60 text-sm mt-1">Manage all registered members and permissions</p>
          </div>
          <button onClick={() => setShowAddUserModal(true)} className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-[#0A6E5A] hover:bg-[#0A6E5A]/90 text-[#FFFFFF] font-['Roboto'] font-semibold text-[0.875rem] transition-all" suppressHydrationWarning={true}>
            <Users className="w-4 h-4" />Add User
          </button>
        </div>
      </motion.div>

      <main className="px-6 md:px-8 py-8">
        <div className="max-w-full">
          {/* Summary Cards */}
          {summary && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users} label="Total Users" value={summary.totalUsers.toLocaleString('en-IN')} />
              <StatCard icon={Crown} label="Booster Members" value={summary.totalBooster.toLocaleString('en-IN')} color="gold" />
              <StatCard icon={UserCheck} label="Active Members" value={summary.totalActive.toLocaleString('en-IN')} />
              <StatCard icon={IndianRupee} label="Total Income" value={`₹${summary.totalIncome.toLocaleString('en-IN')}`} color="gold" />
            </motion.div>
          )}

          {/* Controls Bar */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[#FFFFFF] border border-[#0A6E5A]/10 p-4 md:p-5 mb-6">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A6E5A]/40" />
                <input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search by name, ID, email…" className="w-full pl-10 pr-4 py-2.5 border border-[#0A6E5A]/15 focus:border-[#0A6E5A] focus:outline-none font-['Roboto'] text-[0.875rem] text-[#333333] placeholder:text-[#333333]/30 bg-[#F8FAF9] transition-colors" suppressHydrationWarning={true} />
                {search && <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" suppressHydrationWarning={true}><X className="w-3.5 h-3.5 text-[#333333]/40 hover:text-[#333333]" /></button>}
              </div>
              <button onClick={() => setShowFilter(!showFilter)} className={`flex items-center gap-2 px-4 py-2.5 border font-['Roboto'] text-[0.8rem] font-medium transition-all ${showFilter ? 'bg-[#0A6E5A] text-[#FFFFFF] border-[#0A6E5A]' : 'border-[#0A6E5A]/20 text-[#0A6E5A] hover:bg-[#0A6E5A]/5'}`} suppressHydrationWarning={true}>
                <Filter className="w-4 h-4" />
                Filters
                {(roleFilter || typeFilter) && <span className="w-2 h-2 rounded-full bg-[#C9A84C]" />}
              </button>
              <button onClick={() => fetchUsers()} className="flex items-center gap-2 px-4 py-2.5 border border-[#0A6E5A]/20 text-[#0A6E5A] font-['Roboto'] text-[0.8rem] hover:bg-[#0A6E5A]/5 transition-colors" suppressHydrationWarning={true}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-[#FFFFFF] font-['Roboto'] text-[0.8rem] font-medium hover:bg-[#C9A84C]/90 transition-colors" suppressHydrationWarning={true}>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>

            {/* Expandable Filters */}
            <AnimatePresence>
              {showFilter && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="pt-4 mt-4 border-t border-[#0A6E5A]/10 flex flex-wrap gap-3">
                    <div>
                      <p className="font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#333333]/40 mb-1.5">Role</p>
                      <div className="flex gap-1.5">
                        {['', 'user', 'moderator', 'admin'].map((r) => (
                          <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }} suppressHydrationWarning={true} className={`px-3 py-1.5 text-[0.72rem] font-['Roboto'] font-medium uppercase tracking-wider transition-all ${roleFilter === r ? 'bg-[#0A6E5A] text-[#FFFFFF]' : 'border border-[#0A6E5A]/20 text-[#0A6E5A] hover:bg-[#0A6E5A]/5'}`}>
                            {r || 'All'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#333333]/40 mb-1.5">Member Type</p>
                      <div className="flex gap-1.5">
                        {['', 'active', 'gold'].map((t) => (
                          <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }} suppressHydrationWarning={true} className={`px-3 py-1.5 text-[0.72rem] font-['Roboto'] font-medium uppercase tracking-wider transition-all ${typeFilter === t ? 'bg-[#C9A84C] text-[#FFFFFF]' : 'border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/5'}`}>
                            {t || 'All'}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(roleFilter || typeFilter) && (
                      <button onClick={() => { setRoleFilter(''); setTypeFilter(''); setPage(1); }} className="self-end text-[0.75rem] font-['Roboto'] text-red-400 hover:text-red-600 flex items-center gap-1">
                        <X className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Table */}
          <div className="bg-[#FFFFFF] border border-[#0A6E5A]/10 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#0A6E5A]/8 flex items-center justify-between">
              <p className="font-['Roboto'] text-[0.75rem] text-[#333333]/50">
                {loading ? 'Loading…' : `Showing ${users.length} of ${pagination?.total ?? 0} users`}
              </p>
              {pagination && <p className="font-['Roboto'] text-[0.75rem] text-[#333333]/40">Page {pagination.page} / {pagination.totalPages}</p>}
            </div>

            {error && (
              <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="font-['Roboto'] text-[0.875rem] text-red-600">{error}</p>
              </div>
            )}

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0A6E5A]/3 border-b border-[#0A6E5A]/8">
                  <tr>
                    <th className={thClass}>#</th>
                    {sortable('username', 'User')}
                    <th className={thClass}>Contact</th>
                    <th className={thClass}>Role</th>
                    <th className={thClass}>Type</th>
                    <th className={thClass}>Package</th>
                    <th className={thClass}>Sponsor</th>
                    {sortable('basicIncome', 'Income')}
                    <th className={thClass}>Team</th>
                    {sortable('joiningDate', 'Joined')}
                    <th className={thClass}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0A6E5A]/5">
                  {loading ? (
                    <tr><td colSpan={11} className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-[#0A6E5A] mx-auto" /><p className="font-['Roboto'] text-[0.875rem] text-[#333333]/40 mt-2">Fetching users…</p></td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={11} className="py-16 text-center"><UserX className="w-8 h-8 text-[#0A6E5A]/20 mx-auto mb-2" /><p className="font-['Roboto'] text-[0.875rem] text-[#333333]/40">No users found.</p></td></tr>
                  ) : (
                    users.map((user, i) => {
                    const income = (user.basicIncome ?? 0) + ((user.boosterIncome?.amount ?? user.boosterIncomeAmount) ?? 0);
                      const team = (user.totalTeam?.left ?? 0) + (user.totalTeam?.right ?? 0);
                      return (
                        <motion.tr key={user._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-[#0A6E5A]/2 group transition-colors">
                          <td className="px-4 py-3.5 font-['Roboto'] text-[0.75rem] text-[#333333]/30">{((page - 1) * limit) + i + 1}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#0A6E5A]/10 flex items-center justify-center shrink-0 font-['Fraunces'] text-[0.75rem] text-[#0A6E5A]">
                                {(user.fullName ?? user.username).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-['Roboto'] font-semibold text-[0.8rem] text-[#333333]">{user.fullName ?? user.username}</p>
                                <p className="font-['Roboto'] text-[0.7rem] text-[#C9A84C]">{user.userId ?? user.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="space-y-0.5">
                              {(user.email) && <p className="font-['Roboto'] text-[0.72rem] text-[#333333]/60 flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</p>}
                              {(user.phone ?? user.mobileNo) && <p className="font-['Roboto'] text-[0.72rem] text-[#333333]/60 flex items-center gap-1"><Phone className="w-3 h-3" /> {user.phone ?? user.mobileNo}</p>}
                              {user.city && <p className="font-['Roboto'] text-[0.72rem] text-[#333333]/40 flex items-center gap-1"><MapPin className="w-3 h-3" /> {user.city}{user.state ? `, ${user.state}` : ''}</p>}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col gap-1">
                              <Badge type="role" value={user.role ?? 'user'} />
                              <Badge type="status" isBlocked={user.isBlocked} />
                            </div>
                          </td>
                          <td className="px-4 py-3.5"><Badge type="member" value={user.memberType ?? 'active'} /></td>
                          <td className="px-4 py-3.5"><span className="font-['Roboto'] text-[0.75rem] text-[#333333]/60">{user.registeredPackage ?? '—'}</span></td>
                          <td className="px-4 py-3.5">{user.sponsorId ? (<div><p className="font-['Roboto'] text-[0.72rem] text-[#0A6E5A] font-medium">{user.sponsorId}</p>{user.sponsorName && <p className="font-['Roboto'] text-[0.68rem] text-[#333333]/40">{user.sponsorName}</p>}</div>) : <span className="text-[#333333]/20">—</span>}</td>
                          <td className="px-4 py-3.5"><span className={`font-['Roboto'] text-[0.8rem] font-semibold ${income > 0 ? 'text-[#0A6E5A]' : 'text-[#333333]/30'}`}>{income > 0 ? `₹${income.toLocaleString('en-IN')}` : '—'}</span></td>
                          <td className="px-4 py-3.5">{team > 0 ? (<div><p className="font-['Roboto'] text-[0.8rem] font-semibold text-[#0A6E5A]">{team}</p><p className="font-['Roboto'] text-[0.65rem] text-[#333333]/40">L:{user.totalTeam?.left ?? 0} · R:{user.totalTeam?.right ?? 0}</p></div>) : <span className="text-[#333333]/20">—</span>}</td>
                          <td className="px-4 py-3.5"><span className="font-['Roboto'] text-[0.72rem] text-[#333333]/50">{user.joiningDate ?? (user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—')}</span></td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setViewUser(user)} title="View" className="w-7 h-7 flex items-center justify-center rounded bg-[#0A6E5A]/8 hover:bg-[#0A6E5A]/15 transition-colors text-[#0A6E5A]" suppressHydrationWarning={true}>
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setEditUser(user)} title="Edit" className="w-7 h-7 flex items-center justify-center rounded bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 transition-colors text-[#C9A84C]" suppressHydrationWarning={true}>
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeleteUser(user)} title="Delete" className="w-7 h-7 flex items-center justify-center rounded bg-red-50 hover:bg-red-100 transition-colors text-red-400" suppressHydrationWarning={true}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-[#0A6E5A]/5">
              {loading ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0A6E5A] mx-auto" />
                  <p className="font-['Roboto'] text-[0.875rem] text-[#333333]/40 mt-2">Loading…</p>
                </div>
              ) : users.length === 0 ? (
                <div className="py-16 text-center">
                  <UserX className="w-8 h-8 text-[#0A6E5A]/20 mx-auto mb-2" />
                  <p className="font-['Roboto'] text-[0.875rem] text-[#333333]/40">No users found.</p>
                </div>
              ) : (
                users.map((user, i) => {
                  const income = (user.basicIncome ?? 0) + ((user.boosterIncome?.amount ?? user.boosterIncomeAmount) ?? 0);
                  const team = (user.totalTeam?.left ?? 0) + (user.totalTeam?.right ?? 0);
                  return (
                    <motion.div key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#0A6E5A]/10 flex items-center justify-center font-['Fraunces'] text-[0.9rem] text-[#0A6E5A] shrink-0">
                            {(user.fullName ?? user.username).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-['Roboto'] font-semibold text-[0.875rem] text-[#333333]">{user.fullName ?? user.username}</p>
                            <p className="font-['Roboto'] text-[0.72rem] text-[#C9A84C]">{user.userId ?? user.username}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => setViewUser(user)} className="w-8 h-8 flex items-center justify-center bg-[#0A6E5A]/8 hover:bg-[#0A6E5A]/15 rounded text-[#0A6E5A]" suppressHydrationWarning={true}>
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditUser(user)} className="w-8 h-8 flex items-center justify-center bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 rounded text-[#C9A84C]" suppressHydrationWarning={true}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteUser(user)} className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 rounded text-red-400" suppressHydrationWarning={true}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <Badge type="role" value={user.role ?? 'user'} />
                        <Badge type="member" value={user.memberType ?? 'active'} />
                        <Badge type="status" isBlocked={user.isBlocked} />
                        {user.registeredPackage && (<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[0.65rem] font-['Roboto'] font-semibold uppercase tracking-wider bg-[#333333]/6 text-[#333333]/50 border border-[#333333]/10">
                          <Package className="w-2.5 h-2.5" />{user.registeredPackage}
                        </span>)}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: 'Income', value: income > 0 ? `₹${income.toLocaleString('en-IN')}` : '—' },
                          { label: 'Team', value: team > 0 ? team : '—' },
                          { label: 'Joined', value: user.joiningDate?.split('/').slice(0, 2).join('/') ?? '—' },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-[#0A6E5A]/3 py-2">
                            <p className="font-['Roboto'] font-semibold text-[0.8rem] text-[#0A6E5A]">{value}</p>
                            <p className="font-['Roboto'] text-[0.6rem] uppercase tracking-wider text-[#333333]/40">{label}</p>
                          </div>
                        ))}
                      </div>

                      {(user.phone ?? user.mobileNo) && (
                        <p className="font-['Roboto'] text-[0.72rem] text-[#333333]/40 flex items-center gap-1 mt-2">
                          <Phone className="w-3 h-3" />{user.phone ?? user.mobileNo}
                        </p>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center justify-between bg-[#FFFFFF] border border-[#0A6E5A]/10 px-5 py-4 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrevPage} className="flex items-center gap-2 px-4 py-2 border border-[#0A6E5A]/20 font-['Roboto'] text-[0.8rem] text-[#0A6E5A] hover:bg-[#0A6E5A]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" suppressHydrationWarning={true}>
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
                  let pg: number;
                  const tp = pagination.totalPages;
                  const cp = pagination.page;
                  if (tp <= 7) { pg = i + 1; }
                  else if (cp <= 4) { pg = i + 1; if (i === 6) pg = tp; }
                  else if (cp >= tp - 3) { pg = i === 0 ? 1 : tp - 6 + i + 1; }
                  else { const m = [1, cp - 2, cp - 1, cp, cp + 1, cp + 2, tp]; pg = m[i]; }
                  return (
                    <button key={i} onClick={() => setPage(pg)} className={`w-8 h-8 font-['Roboto'] text-[0.8rem] transition-all ${pagination.page === pg ? 'bg-[#0A6E5A] text-[#FFFFFF]' : 'text-[#333333]/50 hover:bg-[#0A6E5A]/8'}`} suppressHydrationWarning={true}>
                      {pg}
                    </button>
                  );
                })}
              </div>

              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={!pagination.hasNextPage} className="flex items-center gap-2 px-4 py-2 border border-[#0A6E5A]/20 font-['Roboto'] text-[0.8rem] text-[#0A6E5A] hover:bg-[#0A6E5A]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" suppressHydrationWarning={true}>
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showAddUserModal && <AddUserModal onClose={() => setShowAddUserModal(false)} onSuccess={() => fetchUsers()} />}
        {editUser && <EditModal user={editUser} onClose={() => setEditUser(null)} onSave={handleSaveEdit} />}
        {deleteUser && <DeleteModal user={deleteUser} onClose={() => setDeleteUser(null)} onConfirm={handleDelete} />}
        {viewUser && <UserDrawer user={viewUser} onClose={() => setViewUser(null)} />}
      </AnimatePresence>
    </div>
  );
}

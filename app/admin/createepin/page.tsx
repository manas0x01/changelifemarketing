"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Search, User, Package, Hash, Plus, Trash2,
  CheckCircle, AlertCircle, Loader2, Copy, Check,
  Crown, UserCheck, ChevronDown, X, Sparkles,
  ClipboardList, RefreshCw, Info, Shield, ArrowRight,
  Download,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserSuggestion {
  userId?: string;
  username: string;
  fullName?: string;
  phone?: string;
  memberType?: string;
  package?: string;
  activePins: number;
  totalPins: number;
}

interface CreatedPin {
  pin: string;
  packageName: string;
  status: string;
}

interface FormState {
  userId: string;
  packageName: string;
  quantity: number;
  remark: string;
  mode: 'auto' | 'custom';
  customPins: string[];
}

const PACKAGES = [
  { name: 'Silver',   color: 'text-[#9CA3AF]', bg: 'bg-[#9CA3AF]/10', border: 'border-[#9CA3AF]/30', amount: '₹1,000' },
  { name: 'Gold',     color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/10', border: 'border-[#C9A84C]/30', amount: '₹2,000' },
  { name: 'Diamond',  color: 'text-[#60A5FA]', bg: 'bg-[#60A5FA]/10', border: 'border-[#60A5FA]/30', amount: '₹3,000' },
  { name: 'Platinum', color: 'text-[#A78BFA]', bg: 'bg-[#A78BFA]/10', border: 'border-[#A78BFA]/30', amount: '₹5,000' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const StepBadge = ({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) => (
  <div className={`flex items-center gap-2 transition-all duration-300 ${active ? 'opacity-100' : done ? 'opacity-60' : 'opacity-30'}`}>
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[0.75rem] font-['Roboto'] font-bold transition-colors ${done ? 'bg-[#0A6E5A] text-[#FFFFFF]' : active ? 'bg-[#C9A84C] text-[#FFFFFF]' : 'bg-[#0A6E5A]/10 text-[#0A6E5A]'}`}>
      {done ? <Check className="w-3.5 h-3.5" /> : n}
    </div>
    <span className={`font-['Roboto'] text-[0.75rem] uppercase tracking-wider hidden sm:block ${active ? 'text-[#0A6E5A] font-semibold' : 'text-[#333333]/50'}`}>{label}</span>
  </div>
);

const PinChip = ({ pin, onCopy }: { pin: string; onCopy: (p: string) => void }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    onCopy(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center justify-between gap-3 px-4 py-3 bg-[#0A6E5A]/4 border border-[#0A6E5A]/15 group hover:border-[#0A6E5A]/30 transition-all"
    >
      <div className="flex items-center gap-2">
        <Key className="w-3.5 h-3.5 text-[#C9A84C] shrink-0" />
        <span className="font-['Roboto'] text-[0.875rem] tracking-widest text-[#0A6E5A]">{pin}</span>
      </div>
      <button onClick={copy} className="w-7 h-7 flex items-center justify-center rounded bg-[#0A6E5A]/10 hover:bg-[#0A6E5A]/20 transition-colors text-[#0A6E5A]">
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCreateEPinPage() {
  const [form, setForm] = useState<FormState>({
    userId:     '',
    packageName: '',
    quantity:   1,
    remark:     '',
    mode:       'auto',
    customPins: [''],
  });

  const [suggestions,   setSuggestions]   = useState<UserSuggestion[]>([]);
  const [selectedUser,  setSelectedUser]  = useState<UserSuggestion | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown,  setShowDropdown]  = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [result,        setResult]        = useState<{ pins: CreatedPin[]; user: any } | null>(null);
  const [error,         setError]         = useState('');
  const [toast,         setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [allCopied,     setAllCopied]     = useState(false);

  const searchRef  = useRef<NodeJS.Timeout | undefined>(undefined);
  const inputRef   = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Step detection
  const step = !selectedUser ? 1 : !form.packageName ? 2 : 3;

  // ── Click outside close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── User Search ───────────────────────────────────────────────────────────

  const searchUsers = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/admin/createepin?search=${encodeURIComponent(q)}`);
      const json = await res.json();
      setSuggestions(json.data ?? []);
      setShowDropdown(true);
    } catch { setSuggestions([]); }
    finally { setSearchLoading(false); }
  }, []);

  const handleSearchInput = (val: string) => {
    setForm(f => ({ ...f, userId: val }));
    setSelectedUser(null);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => searchUsers(val), 350);
  };

  const selectUser = (u: UserSuggestion) => {
    setSelectedUser(u);
    setForm(f => ({ ...f, userId: u.userId ?? u.username }));
    setShowDropdown(false);
    setSuggestions([]);
  };

  const clearUser = () => {
    setSelectedUser(null);
    setForm(f => ({ ...f, userId: '', packageName: '', quantity: 1, remark: '', mode: 'auto', customPins: [''] }));
    setResult(null);
    setError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ── Custom Pins ───────────────────────────────────────────────────────────

  const updateCustomPin = (idx: number, val: string) => {
    setForm(f => {
      const cp = [...f.customPins];
      cp[idx] = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
      return { ...f, customPins: cp };
    });
  };

  const syncCustomPins = (qty: number) => {
    setForm(f => {
      const cp = [...f.customPins];
      while (cp.length < qty) cp.push('');
      return { ...f, quantity: qty, customPins: cp.slice(0, qty) };
    });
  };

  const handleQuantityChange = (qty: number) => {
    if (form.mode === 'custom') { syncCustomPins(qty); }
    else { setForm(f => ({ ...f, quantity: qty })); }
  };

  const handleModeChange = (mode: 'auto' | 'custom') => {
    setForm(f => ({
      ...f,
      mode,
      customPins: mode === 'custom'
        ? Array(f.quantity).fill('')
        : f.customPins,
    }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setError('');
    setResult(null);

    if (!selectedUser) { setError('Please select a user.'); return; }
    if (!form.packageName) { setError('Please select a package.'); return; }
    if (form.quantity < 1 || form.quantity > 100) { setError('Quantity must be 1–100.'); return; }

    if (form.mode === 'custom') {
      const empty = form.customPins.slice(0, form.quantity).filter(p => p.length < 6);
      if (empty.length > 0) { setError('Each custom pin must be at least 6 characters.'); return; }
    }

    setSubmitting(true);
    try {
      const body: Record<string, any> = {
        userId:      selectedUser.userId ?? selectedUser.username,
        packageName: form.packageName,
        quantity:    form.quantity,
        remark:      form.remark,
      };
      if (form.mode === 'custom') {
        body.customPins = form.customPins.slice(0, form.quantity);
      }

      const res  = await fetch('/api/admin/createepin', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.message ?? 'Something went wrong.');

      setResult({ pins: json.data.pinsCreated, user: json.data.user });
      showToast(json.message, 'success');
    } catch (e: any) {
      setError(e.message ?? 'Request failed.');
      showToast(e.message ?? 'Failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyAll = () => {
    if (!result) return;
    const text = result.pins.map(p => `${p.pin} | ${p.packageName}`).join('\n');
    navigator.clipboard.writeText(text);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2500);
    showToast('All pins copied!', 'success');
  };

  const downloadCSV = () => {
    if (!result) return;
    const rows = [
      ['Pin', 'Package', 'Status', 'User', 'User ID'],
      ...result.pins.map(p => [p.pin, p.packageName, p.status, result.user.fullName ?? '', result.user.userId ?? '']),
    ];
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `epins-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setResult(null);
    setError('');
    clearUser();
  };

  const pkg = PACKAGES.find(p => p.name === form.packageName);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAF9] selection:bg-[#C9A84C]/30 selection:text-[#0A6E5A]">
      <Header />

      {/* ── Page Header ── */}
      <section className="bg-[#0A6E5A] pt-28 pb-14 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-40 -right-40 w-125 h-125 bg-[#C9A84C]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#FFFFFF]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-12 relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="font-['Roboto'] text-[0.7rem] uppercase tracking-[0.25em] text-[#C9A84C] mb-3">Admin Panel</p>
            <h1 className="font-['Fraunces'] text-[2.25rem] sm:text-[3rem] md:text-[3.5rem] text-[#FFFFFF] leading-tight mb-3">
              Create & Assign EPins
            </h1>
            <p className="font-['Roboto'] text-[#FFFFFF]/55 text-[0.9rem] max-w-xl">
              Generate new EPins and credit them directly to any member's account. Supports bulk creation up to 100 pins.
            </p>
          </motion.div>

          {/* Step Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex items-center gap-4 mt-8"
          >
            <StepBadge n={1} label="Select User"    active={step === 1} done={step > 1} />
            <div className="flex-1 h-px bg-[#FFFFFF]/15 max-w-12" />
            <StepBadge n={2} label="Choose Package" active={step === 2} done={step > 2} />
            <div className="flex-1 h-px bg-[#FFFFFF]/15 max-w-12" />
            <StepBadge n={3} label="Configure"      active={step === 3} done={!!result} />
          </motion.div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 md:px-12 py-10">
        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* ══ LEFT FORM COLUMN ══════════════════════════════════════════════ */}
          <div className="lg:col-span-3 space-y-6">

            {/* ── STEP 1: User Search ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#FFFFFF] border border-[#0A6E5A]/10 overflow-visible"
            >
              <div className="px-5 py-4 border-b border-[#0A6E5A]/8 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#0A6E5A] flex items-center justify-center">
                  <span className="font-['Roboto'] text-[0.7rem] font-bold text-[#FFFFFF]">1</span>
                </div>
                <h2 className="font-['Fraunces'] text-[1.1rem] text-[#0A6E5A]">Select Member</h2>
              </div>

              <div className="p-5">
                {selectedUser ? (
                  /* Selected User Card */
                  <motion.div
                    initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="flex items-start justify-between p-4 bg-[#0A6E5A]/4 border border-[#0A6E5A]/15"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#0A6E5A]/10 flex items-center justify-center font-['Fraunces'] text-[1rem] text-[#0A6E5A] shrink-0">
                        {(selectedUser.fullName ?? selectedUser.username).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-['Roboto'] font-semibold text-[0.9rem] text-[#333333]">
                          {selectedUser.fullName ?? selectedUser.username}
                        </p>
                        <p className="font-['Roboto'] text-[0.75rem] text-[#C9A84C]">
                          {selectedUser.userId ?? selectedUser.username}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {selectedUser.memberType && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[0.6rem] font-['Roboto'] font-bold uppercase tracking-wider rounded-sm ${selectedUser.memberType === 'gold' ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'bg-[#0A6E5A]/10 text-[#0A6E5A]'}`}>
                              {selectedUser.memberType === 'gold' ? <Crown className="w-2.5 h-2.5" /> : <UserCheck className="w-2.5 h-2.5" />}
                              {selectedUser.memberType}
                            </span>
                          )}
                          <span className="font-['Roboto'] text-[0.65rem] text-[#333333]/40">
                            {selectedUser.activePins} active pin{selectedUser.activePins !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={clearUser} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#333333]/8 hover:bg-red-50 hover:text-red-400 text-[#333333]/40 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ) : (
                  /* Search Input */
                  <div ref={dropdownRef} className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A6E5A]/40" />
                    <input
                      ref={inputRef}
                      value={form.userId}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      placeholder="Search by User ID, name, username or phone…"
                      className="w-full pl-10 pr-10 py-3 border border-[#0A6E5A]/15 focus:border-[#0A6E5A] focus:outline-none font-['Roboto'] text-[0.875rem] text-[#333333] placeholder:text-[#333333]/30 bg-[#F8FAF9] transition-colors"
                      autoComplete="off"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {searchLoading
                        ? <Loader2 className="w-4 h-4 text-[#0A6E5A] animate-spin" />
                        : form.userId && <button onClick={() => handleSearchInput('')}><X className="w-3.5 h-3.5 text-[#333333]/30 hover:text-[#333333]" /></button>
                      }
                    </div>

                    {/* Dropdown */}
                    <AnimatePresence>
                      {showDropdown && suggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className="absolute top-full left-0 right-0 z-50 bg-[#FFFFFF] border border-[#0A6E5A]/15 shadow-xl mt-1 max-h-64 overflow-y-auto"
                        >
                          {suggestions.map((u, i) => (
                            <button
                              key={i}
                              onClick={() => selectUser(u)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#0A6E5A]/5 transition-colors text-left border-b border-[#0A6E5A]/5 last:border-0"
                            >
                              <div className="w-9 h-9 rounded-full bg-[#0A6E5A]/10 flex items-center justify-center font-['Fraunces'] text-[0.85rem] text-[#0A6E5A] shrink-0">
                                {(u.fullName ?? u.username).charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-['Roboto'] font-semibold text-[0.8rem] text-[#333333] truncate">{u.fullName ?? u.username}</p>
                                <p className="font-['Roboto'] text-[0.7rem] text-[#C9A84C]">{u.userId ?? u.username}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-['Roboto'] text-[0.65rem] text-[#333333]/40">{u.activePins} pins</p>
                                {u.memberType && (
                                  <span className={`text-[0.6rem] font-bold uppercase ${u.memberType === 'gold' ? 'text-[#C9A84C]' : 'text-[#0A6E5A]'}`}>{u.memberType}</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                      {showDropdown && suggestions.length === 0 && !searchLoading && form.userId.length >= 2 && (
                        <motion.div
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="absolute top-full left-0 right-0 z-50 bg-[#FFFFFF] border border-[#0A6E5A]/15 shadow-xl mt-1 px-4 py-6 text-center"
                        >
                          <User className="w-6 h-6 text-[#0A6E5A]/20 mx-auto mb-1" />
                          <p className="font-['Roboto'] text-[0.8rem] text-[#333333]/40">No users found.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── STEP 2: Package Selection ── */}
            <AnimatePresence>
              {selectedUser && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-[#FFFFFF] border border-[#0A6E5A]/10"
                >
                  <div className="px-5 py-4 border-b border-[#0A6E5A]/8 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#C9A84C] flex items-center justify-center">
                      <span className="font-['Roboto'] text-[0.7rem] font-bold text-[#FFFFFF]">2</span>
                    </div>
                    <h2 className="font-['Fraunces'] text-[1.1rem] text-[#0A6E5A]">Select Package</h2>
                  </div>

                  <div className="p-5 grid grid-cols-2 gap-3">
                    {PACKAGES.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => setForm(f => ({ ...f, packageName: p.name }))}
                        className={`relative p-4 text-left border-2 transition-all duration-200 ${
                          form.packageName === p.name
                            ? `${p.border} ${p.bg} shadow-sm`
                            : 'border-[#0A6E5A]/10 hover:border-[#0A6E5A]/25 hover:bg-[#0A6E5A]/2'
                        }`}
                      >
                        {form.packageName === p.name && (
                          <motion.div
                            layoutId="pkg-check"
                            className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#0A6E5A] flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-[#FFFFFF]" />
                          </motion.div>
                        )}
                        <Package className={`w-5 h-5 mb-2 ${p.color}`} />
                        <p className={`font-['Fraunces'] text-[1rem] ${p.color}`}>{p.name}</p>
                        <p className="font-['Roboto'] text-[0.7rem] text-[#333333]/40 mt-0.5">{p.amount}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── STEP 3: Configuration ── */}
            <AnimatePresence>
              {selectedUser && form.packageName && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-[#FFFFFF] border border-[#0A6E5A]/10"
                >
                  <div className="px-5 py-4 border-b border-[#0A6E5A]/8 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#0A6E5A]/15 flex items-center justify-center">
                      <span className="font-['Roboto'] text-[0.7rem] font-bold text-[#0A6E5A]">3</span>
                    </div>
                    <h2 className="font-['Fraunces'] text-[1.1rem] text-[#0A6E5A]">Configure EPins</h2>
                  </div>

                  <div className="p-5 space-y-6">
                    {/* Quantity */}
                    <div>
                      <label className="block font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#333333]/50 mb-2">
                        Quantity <span className="text-[#C9A84C]">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-[#0A6E5A]/20 overflow-hidden">
                          <button
                            onClick={() => handleQuantityChange(Math.max(1, form.quantity - 1))}
                            className="w-10 h-10 flex items-center justify-center bg-[#0A6E5A]/5 hover:bg-[#0A6E5A]/10 text-[#0A6E5A] font-bold transition-colors text-lg"
                          >−</button>
                          <input
                            type="number"
                            min={1} max={100}
                            value={form.quantity}
                            onChange={(e) => handleQuantityChange(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                            className="w-16 h-10 text-center font-['Roboto'] font-semibold text-[#0A6E5A] text-[1rem] focus:outline-none border-x border-[#0A6E5A]/10"
                          />
                          <button
                            onClick={() => handleQuantityChange(Math.min(100, form.quantity + 1))}
                            className="w-10 h-10 flex items-center justify-center bg-[#0A6E5A]/5 hover:bg-[#0A6E5A]/10 text-[#0A6E5A] font-bold transition-colors text-lg"
                          >+</button>
                        </div>
                        {/* Quick select */}
                        <div className="flex gap-1.5">
                          {[5, 10, 25, 50].map(n => (
                            <button
                              key={n}
                              onClick={() => handleQuantityChange(n)}
                              className={`px-2.5 py-1 text-[0.7rem] font-['Roboto'] font-medium transition-all ${form.quantity === n ? 'bg-[#0A6E5A] text-[#FFFFFF]' : 'border border-[#0A6E5A]/20 text-[#0A6E5A] hover:bg-[#0A6E5A]/5'}`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Pin Mode Toggle */}
                    <div>
                      <label className="block font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#333333]/50 mb-2">Pin Generation</label>
                      <div className="flex">
                        <button
                          onClick={() => handleModeChange('auto')}
                          className={`flex-1 py-2.5 flex items-center justify-center gap-2 font-['Roboto'] text-[0.8rem] font-medium transition-all border ${form.mode === 'auto' ? 'bg-[#0A6E5A] text-[#FFFFFF] border-[#0A6E5A]' : 'border-[#0A6E5A]/20 text-[#0A6E5A] hover:bg-[#0A6E5A]/5'}`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />Auto Generate
                        </button>
                        <button
                          onClick={() => handleModeChange('custom')}
                          className={`flex-1 py-2.5 flex items-center justify-center gap-2 font-['Roboto'] text-[0.8rem] font-medium transition-all border-y border-r ${form.mode === 'custom' ? 'bg-[#C9A84C] text-[#FFFFFF] border-[#C9A84C]' : 'border-[#0A6E5A]/20 text-[#0A6E5A] hover:bg-[#0A6E5A]/5'}`}
                        >
                          <Key className="w-3.5 h-3.5" />Custom Pins
                        </button>
                      </div>
                      {form.mode === 'auto' && (
                        <p className="font-['Roboto'] text-[0.7rem] text-[#333333]/40 mt-1.5 flex items-center gap-1">
                          <Info className="w-3 h-3" /> Cryptographically unique 12-char alphanumeric pins will be generated.
                        </p>
                      )}
                    </div>

                    {/* Custom Pins Input */}
                    <AnimatePresence>
                      {form.mode === 'custom' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {Array(form.quantity).fill(null).map((_, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="font-['Roboto'] text-[0.65rem] text-[#333333]/30 w-6 text-right shrink-0">{i + 1}.</span>
                                <input
                                  value={form.customPins[i] ?? ''}
                                  onChange={(e) => updateCustomPin(i, e.target.value)}
                                  placeholder={`PIN-${String(i + 1).padStart(3, '0')}`}
                                  maxLength={16}
                                  className="flex-1 px-3 py-2 border border-[#0A6E5A]/15 focus:border-[#C9A84C] focus:outline-none font-['Roboto'] text-[0.8rem] text-[#333333] placeholder:text-[#333333]/20 bg-[#F8FAF9] tracking-widest transition-colors"
                                />
                                <span className="font-['Roboto'] text-[0.6rem] text-[#333333]/30 w-8 shrink-0">
                                  {(form.customPins[i] ?? '').length}/16
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Remark */}
                    <div>
                      <label className="block font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#333333]/50 mb-2">
                        Remark <span className="text-[#333333]/30">(optional)</span>
                      </label>
                      <textarea
                        value={form.remark}
                        onChange={(e) => setForm(f => ({ ...f, remark: e.target.value }))}
                        placeholder="e.g. Bonus pins for joining, replacement for expired pin…"
                        rows={2}
                        className="w-full px-4 py-3 border border-[#0A6E5A]/15 focus:border-[#0A6E5A] focus:outline-none font-['Roboto'] text-[0.875rem] text-[#333333] placeholder:text-[#333333]/25 bg-[#F8FAF9] resize-none transition-colors"
                      />
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100"
                        >
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <p className="font-['Roboto'] text-[0.8rem] text-red-600">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit */}
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full py-4 bg-[#0A6E5A] hover:bg-[#0A6E5A]/90 disabled:opacity-60 disabled:cursor-not-allowed text-[#FFFFFF] font-['Roboto'] font-semibold text-[0.9rem] flex items-center justify-center gap-3 transition-all group"
                    >
                      {submitting ? (
                        <><Loader2 className="w-5 h-5 animate-spin" />Creating EPins…</>
                      ) : (
                        <><Key className="w-5 h-5" />Create {form.quantity} EPin{form.quantity > 1 ? 's' : ''} — {form.packageName}<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ══ RIGHT PANEL ════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-6">

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="bg-[#0A6E5A] text-[#FFFFFF] p-6 relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#C9A84C]/10 rounded-full blur-2xl pointer-events-none" />
              <h3 className="font-['Fraunces'] text-[1.1rem] mb-5 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#C9A84C]" />
                Order Summary
              </h3>

              <div className="space-y-3">
                {[
                  { label: 'Member',  value: selectedUser ? (selectedUser.fullName ?? selectedUser.username) : '—', gold: false },
                  { label: 'User ID', value: selectedUser?.userId ?? selectedUser?.username ?? '—', gold: true },
                  { label: 'Package', value: form.packageName || '—', gold: false },
                  { label: 'Qty',     value: form.quantity, gold: false },
                  { label: 'Mode',    value: form.mode === 'auto' ? 'Auto Generate' : 'Custom Pins', gold: false },
                ].map(({ label, value, gold }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-[#FFFFFF]/8 last:border-0">
                    <span className="font-['Roboto'] text-[0.72rem] text-[#FFFFFF]/50 uppercase tracking-wider">{label}</span>
                    <span className={`font-['Roboto'] font-semibold text-[0.8rem] ${gold ? 'text-[#C9A84C]' : 'text-[#FFFFFF]'} max-w-[55%] text-right`}>{String(value)}</span>
                  </div>
                ))}
              </div>

              {selectedUser && form.packageName && (
                <div className="mt-5 pt-5 border-t border-[#FFFFFF]/10">
                  <div className="flex justify-between items-center">
                    <span className="font-['Roboto'] text-[0.7rem] text-[#FFFFFF]/40 uppercase tracking-wider">Current Active Pins</span>
                    <span className="font-['Fraunces'] text-[1.5rem] text-[#C9A84C]">{selectedUser.activePins}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-['Roboto'] text-[0.7rem] text-[#FFFFFF]/40 uppercase tracking-wider">After Creation</span>
                    <span className="font-['Fraunces'] text-[1.5rem] text-[#FFFFFF]">{selectedUser.activePins + form.quantity}</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Admin Info Box */}
            <motion.div
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="bg-[#FFFFFF] border border-[#0A6E5A]/10 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-[#C9A84C]" />
                <h3 className="font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333333]/50">Admin Guidelines</h3>
              </div>
              <ul className="space-y-2.5">
                {[
                  'All EPins are added as "Active" status.',
                  'Auto pins are 12-char cryptographically unique.',
                  'Custom pins must be min 6 chars, alphanumeric.',
                  'Transaction is logged in user\'s pin history.',
                  'Download CSV after creation for records.',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] mt-1.5 shrink-0" />
                    <p className="font-['Roboto'] text-[0.72rem] text-[#333333]/55 leading-relaxed">{t}</p>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* ══ RESULT SECTION ════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-8"
            >
              {/* Success Header */}
              <div className="bg-[#0A6E5A] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-[#C9A84C]" />
                  </div>
                  <div>
                    <h3 className="font-['Fraunces'] text-[1.25rem] text-[#FFFFFF]">
                      {result.pins.length} EPin{result.pins.length > 1 ? 's' : ''} Created Successfully
                    </h3>
                    <p className="font-['Roboto'] text-[0.75rem] text-[#FFFFFF]/50">
                      Credited to {result.user.fullName ?? result.user.username} · {result.user.userId}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyAll} className="flex items-center gap-2 px-4 py-2 bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 text-[#FFFFFF] font-['Roboto'] text-[0.75rem] transition-colors">
                    {allCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {allCopied ? 'Copied!' : 'Copy All'}
                  </button>
                  <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-[#FFFFFF] font-['Roboto'] text-[0.75rem] transition-colors">
                    <Download className="w-3.5 h-3.5" />CSV
                  </button>
                  <button onClick={reset} className="flex items-center gap-2 px-4 py-2 bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 text-[#FFFFFF] font-['Roboto'] text-[0.75rem] transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" />New
                  </button>
                </div>
              </div>

              {/* Pin Grid */}
              <div className="bg-[#FFFFFF] border border-[#0A6E5A]/10 border-t-0 p-5">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {result.pins.map((p, i) => (
                    <PinChip key={i} pin={p.pin} onCopy={(pin) => navigator.clipboard.writeText(pin)} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-6 left-1/2 z-100 flex items-center gap-3 px-5 py-3 shadow-xl font-['Roboto'] text-[0.875rem] whitespace-nowrap ${toast.type === 'success' ? 'bg-[#0A6E5A] text-[#FFFFFF]' : 'bg-red-500 text-[#FFFFFF]'}`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
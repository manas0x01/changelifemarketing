"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Trophy, Plus, Search, Edit3, Trash2, Eye, EyeOff,
  Star, Crown, Loader2, X, Check, AlertTriangle, RefreshCw,
  ChevronLeft, ChevronRight, ImageIcon, Award, MapPin, FileText,
  UserCheck, Save, AlertCircle,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Achiever {
  _id: string;
  achieverName: string;
  profilePhoto?: string;
  rankAchievement?: string;
  locationState?: string;
  description?: string;
  memberType?: 'gold' | 'active';
  isFirstBooster?: boolean;
  displayOrder?: number;
  isVisible?: boolean;
  createdAt?: string;
}

interface Pagination {
  page: number; limit: number; total: number;
  totalPages: number; hasNextPage: boolean; hasPrevPage: boolean;
}

const EMPTY: Omit<Achiever, '_id' | 'createdAt'> = {
  achieverName: '', profilePhoto: '', rankAchievement: '',
  locationState: '', description: '', memberType: 'active',
  isFirstBooster: false, displayOrder: 0, isVisible: true,
};

const RANKS = [
  'Silver Star', 'Gold Star', 'Diamond Star', 'Platinum Star',
  'Bronze Booster', 'Silver Booster', 'Gold Booster',
  'Diamond Booster', 'Platinum Booster', 'First Booster',
];

{/* Shared UI Atoms */}
const MemberBadge = ({ type }: { type?: string }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[0.6rem] font-['Roboto'] font-bold uppercase tracking-wider rounded-sm border ${type === 'gold' ? 'bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/20' : 'bg-[#0A6E5A]/10 text-[#0A6E5A] border-[#0A6E5A]/15'}`}>
    {type === 'gold' ? <Crown className="w-2.5 h-2.5" /> : <UserCheck className="w-2.5 h-2.5" />}
    {type ?? 'active'}
  </span>
);

const VisiToggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <button onClick={onToggle}
    className={`flex items-center gap-1.5 px-2.5 py-1 text-[0.62rem] font-['Roboto'] font-bold uppercase tracking-wider transition-all ${on ? 'bg-[#0A6E5A]/10 text-[#0A6E5A]' : 'bg-[#333333]/8 text-[#333333]/40'}`}>
    {on ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
    {on ? 'Visible' : 'Hidden'}
  </button>
);

{/* Form Modal */}
const FormModal = ({
  mode, initial, onClose, onSave,
}: {
  mode: 'create' | 'edit';
  initial: Omit<Achiever, '_id' | 'createdAt'>;
  onClose: () => void;
  onSave: (data: Omit<Achiever, '_id' | 'createdAt'>) => Promise<void>;
}) => {
  const [form,    setForm]    = useState(initial);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  const [imgFail, setImgFail] = useState(false);
  const [custom,  setCustom]  = useState(
    initial.rankAchievement && !RANKS.includes(initial.rankAchievement) ? initial.rankAchievement : ''
  );
  const [useCustomRank, setUseCustomRank] = useState(
    !!(initial.rankAchievement && !RANKS.includes(initial.rankAchievement))
  );

  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleRankSelect = (v: string) => {
    if (v === '__custom__') { setUseCustomRank(true); set('rankAchievement', custom); }
    else { setUseCustomRank(false); set('rankAchievement', v); }
  };

  const submit = async () => {
    setErr('');
    if (!form.achieverName.trim()) { setErr('Achiever name is required.'); return; }
    setSaving(true);
    try { await onSave({ ...form, rankAchievement: useCustomRank ? custom : form.rankAchievement }); }
    catch (e: any) { setErr(e.message ?? 'Save failed.'); }
    finally { setSaving(false); }
  };

  const inp = "w-full px-4 py-2.5 border border-[#0A6E5A]/15 focus:border-[#0A6E5A] focus:outline-none font-['Roboto'] text-[0.875rem] text-[#333333] placeholder:text-[#333333]/25 bg-[#F8FAF9] transition-colors";
  const lbl = "block font-['Roboto'] text-[0.68rem] uppercase tracking-widest text-[#333333]/50 mb-1.5";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-100 flex items-start justify-center p-4 pt-14 bg-[#0A6E5A]/40 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 24 }} transition={{ type: 'spring', damping: 22 }}
        className="bg-[#FFFFFF] w-full max-w-2xl shadow-2xl mb-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0A6E5A] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
              {mode === 'create' ? <Plus className="w-5 h-5 text-[#C9A84C]" /> : <Edit3 className="w-5 h-5 text-[#C9A84C]" />}
            </div>
            <div>
              <h3 className="font-['Fraunces'] text-[1.2rem] text-[#FFFFFF]">
                {mode === 'create' ? 'Add New Achiever' : 'Edit Achiever'}
              </h3>
              <p className="font-['Roboto'] text-[0.68rem] text-[#FFFFFF]/50">
                {mode === 'edit' && initial.achieverName ? `Editing: ${initial.achieverName}` : 'Fill in the details below'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-[#FFFFFF]" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Photo */}
          <div className="flex gap-4 items-start">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#C9A84C]/30 bg-[#0A6E5A]/5 flex items-center justify-center shrink-0">
              {form.profilePhoto && !imgFail ? (
                <Image src={form.profilePhoto} alt="Preview" width={80} height={80}
                  className="w-full h-full object-cover" onError={() => setImgFail(true)} />
              ) : (
                <ImageIcon className="w-8 h-8 text-[#0A6E5A]/20" />
              )}
            </div>
            <div className="flex-1">
              <label className={lbl}>Profile Photo URL</label>
              <input value={form.profilePhoto ?? ''} onChange={e => { set('profilePhoto', e.target.value); setImgFail(false); }}
                placeholder="https://example.com/photo.jpg" className={inp} />
              <p className="font-['Roboto'] text-[0.63rem] text-[#333333]/35 mt-1">Paste image URL — preview updates live.</p>
            </div>
          </div>

          {/* Name + Rank */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Achiever Name <span className="text-[#C9A84C]">*</span></label>
              <input value={form.achieverName} onChange={e => set('achieverName', e.target.value)}
                placeholder="Full name" className={inp} />
            </div>
            <div>
              <label className={lbl}>Rank / Achievement</label>
              <select value={useCustomRank ? '__custom__' : (form.rankAchievement ?? '')}
                onChange={e => handleRankSelect(e.target.value)} className={inp}>
                <option value="">Select rank…</option>
                {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                <option value="__custom__">Custom…</option>
              </select>
            </div>
          </div>

          {useCustomRank && (
            <div>
              <label className={lbl}>Custom Rank</label>
              <input value={custom} onChange={e => { setCustom(e.target.value); set('rankAchievement', e.target.value); }}
                placeholder="Type custom rank…" className={inp} />
            </div>
          )}

          {/* Location + Member Type */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}><MapPin className="w-3 h-3 inline mr-1" />Location / State</label>
              <input value={form.locationState ?? ''} onChange={e => set('locationState', e.target.value)}
                placeholder="e.g. Bihar, Patna" className={inp} />
            </div>
            <div>
              <label className={lbl}>Member Type</label>
              <div className="flex gap-2">
                {(['active', 'gold'] as const).map(m => (
                  <button key={m} type="button" onClick={() => set('memberType', m)}
                    className={`flex-1 py-2.5 flex items-center justify-center gap-2 font-['Roboto'] text-[0.78rem] font-medium uppercase tracking-wider border transition-all ${form.memberType === m ? m === 'gold' ? 'bg-[#C9A84C] text-[#FFFFFF] border-[#C9A84C]' : 'bg-[#0A6E5A] text-[#FFFFFF] border-[#0A6E5A]' : 'border-[#0A6E5A]/20 text-[#0A6E5A] hover:bg-[#0A6E5A]/5'}`}>
                    {m === 'gold' ? <Crown className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}{m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={lbl}><FileText className="w-3 h-3 inline mr-1" />Description / Story</label>
            <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="Achiever's success story or quote…" maxLength={1000}
              className={`${inp} resize-none`} />
            <p className="text-right font-['Roboto'] text-[0.6rem] text-[#333333]/30 mt-0.5">
              {(form.description ?? '').length}/1000
            </p>
          </div>

          {/* Display Order + Toggles */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Display Order</label>
              <input type="number" min={0} value={form.displayOrder ?? 0}
                onChange={e => set('displayOrder', parseInt(e.target.value) || 0)} className={inp} />
            </div>
            <div className="flex flex-col justify-end">
              <label className={lbl}>First Booster</label>
              <button type="button" onClick={() => set('isFirstBooster', !form.isFirstBooster)}
                className={`flex items-center gap-2 px-3 py-2.5 border font-['Roboto'] text-[0.78rem] font-medium transition-all ${form.isFirstBooster ? 'bg-[#C9A84C]/15 border-[#C9A84C]/40 text-[#C9A84C]' : 'border-[#0A6E5A]/20 text-[#333333]/40 hover:bg-[#0A6E5A]/5'}`}>
                <Star className={`w-3.5 h-3.5 ${form.isFirstBooster ? '' : 'opacity-30'}`} />
                {form.isFirstBooster ? '1st Booster' : 'Not 1st'}
              </button>
            </div>
            <div className="flex flex-col justify-end">
              <label className={lbl}>Visibility</label>
              <button type="button" onClick={() => set('isVisible', !form.isVisible)}
                className={`flex items-center gap-2 px-3 py-2.5 border font-['Roboto'] text-[0.78rem] font-medium transition-all ${form.isVisible ? 'bg-[#0A6E5A]/10 border-[#0A6E5A]/25 text-[#0A6E5A]' : 'border-[#333333]/15 text-[#333333]/40 hover:bg-[#333333]/5'}`}>
                {form.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {form.isVisible ? 'Visible' : 'Hidden'}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {err && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="font-['Roboto'] text-[0.8rem] text-red-600">{err}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 border border-[#0A6E5A]/20 font-['Roboto'] text-[0.875rem] text-[#0A6E5A] hover:bg-[#0A6E5A]/5 transition-colors">Cancel</button>
            <button onClick={submit} disabled={saving}
              className="flex-1 py-3 bg-[#0A6E5A] hover:bg-[#0A6E5A]/90 disabled:opacity-60 text-[#FFFFFF] font-['Roboto'] text-[0.875rem] font-semibold flex items-center justify-center gap-2 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : mode === 'create' ? 'Create Achiever' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

{/* Delete Modal */}
const DelModal = ({ a, onClose, onConfirm }: {
  a: Achiever; onClose: () => void; onConfirm: () => Promise<void>;
}) => {
  const [del, setDel] = useState(false);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-[#FFFFFF] w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="font-['Fraunces'] text-[1.2rem] text-[#333333] mb-2">Delete Achiever?</h3>
          <p className="font-['Roboto'] text-[0.875rem] text-[#333333]/60 mb-6">
            Permanently delete <span className="font-semibold text-[#0A6E5A]">{a.achieverName}</span>? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-[#333333]/20 font-['Roboto'] text-[0.875rem] text-[#333333]/60 hover:bg-[#333333]/5 transition-colors">Cancel</button>
            <button onClick={async () => { setDel(true); await onConfirm(); setDel(false); }} disabled={del}
              className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 font-['Roboto'] text-[0.875rem] text-[#FFFFFF] flex items-center justify-center gap-2 transition-colors">
              {del ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {del ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

{/* Skeleton Loader */}
const SkeletonCard = () => (
  <motion.div
    initial={{ opacity: 0.5 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
    className="bg-[#FFFFFF] border border-[#0A6E5A]/10 p-4 space-y-3"
  >
    {/* Photo */}
    <div className="flex items-start gap-3">
      <div className="w-14 h-14 rounded-full bg-[#0A6E5A]/6" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-[#0A6E5A]/6 rounded w-3/4" />
        <div className="h-2 bg-[#0A6E5A]/4 rounded w-1/2" />
      </div>
    </div>
    {/* Description */}
    <div className="space-y-2">
      <div className="h-2 bg-[#0A6E5A]/6 rounded" />
      <div className="h-2 bg-[#0A6E5A]/6 rounded w-5/6" />
    </div>
    {/* Badges */}
    <div className="flex gap-2">
      <div className="h-5 w-16 bg-[#0A6E5A]/6 rounded" />
      <div className="h-5 w-16 bg-[#0A6E5A]/6 rounded" />
    </div>
    {/* Buttons */}
    <div className="flex gap-2 pt-2">
      <div className="h-8 flex-1 bg-[#0A6E5A]/6 rounded" />
      <div className="h-8 flex-1 bg-[#0A6E5A]/6 rounded" />
      <div className="h-8 w-10 bg-[#0A6E5A]/6 rounded" />
    </div>
  </motion.div>
);

{/* Achiever Card */}
const ACard = ({ a, idx, onEdit, onDel, onToggleVis, onToggle1st }: {
  a: Achiever; idx: number;
  onEdit: () => void; onDel: () => void;
  onToggleVis: () => void; onToggle1st: () => void;
}) => {
  const [imgFail, setImgFail] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className={`bg-[#FFFFFF] border transition-all duration-200 group hover:shadow-lg ${a.isFirstBooster ? 'border-[#C9A84C]/40' : 'border-[#0A6E5A]/10'} ${!a.isVisible ? 'opacity-55' : ''}`}
    >
      {a.isFirstBooster && (
        <div className="bg-[#C9A84C] px-3 py-1 flex items-center gap-1.5">
          <Star className="w-3 h-3 text-[#FFFFFF]" />
          <span className="font-['Roboto'] text-[0.58rem] font-bold uppercase tracking-widest text-[#FFFFFF]">First Booster</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="relative shrink-0">
            <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${a.isFirstBooster ? 'border-[#C9A84C]' : 'border-[#0A6E5A]/15'} bg-[#0A6E5A]/5`}>
              {a.profilePhoto && !imgFail ? (
                <Image src={a.profilePhoto} alt={a.achieverName} width={56} height={56} className="w-full h-full object-cover" onError={() => setImgFail(true)} />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-['Fraunces'] text-[1.1rem] text-[#0A6E5A]">
                  {a.achieverName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {a.isFirstBooster && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#C9A84C] flex items-center justify-center">
                <Trophy className="w-2.5 h-2.5 text-[#FFFFFF]" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-['Fraunces'] text-[0.95rem] text-[#0A6E5A] leading-tight truncate">{a.achieverName}</h3>
            {a.rankAchievement && <p className="font-['Roboto'] text-[0.72rem] text-[#C9A84C] font-medium mt-0.5">{a.rankAchievement}</p>}
            {a.locationState && (
              <p className="font-['Roboto'] text-[0.67rem] text-[#333333]/40 flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5" />{a.locationState}
              </p>
            )}
          </div>
          <span className="font-['Roboto'] text-[0.58rem] font-bold text-[#0A6E5A]/30 shrink-0">#{a.displayOrder ?? 0}</span>
        </div>

        {a.description && (
          <p className="font-['Roboto'] text-[0.7rem] text-[#333333]/50 line-clamp-2 mb-3 leading-relaxed">{a.description}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          <MemberBadge type={a.memberType} />
          <VisiToggle on={a.isVisible ?? true} onToggle={onToggleVis} />
        </div>

        <div className="flex gap-2 pt-3 border-t border-[#0A6E5A]/6">
          <button onClick={onToggle1st} title="Toggle First Booster"
            className={`flex-1 py-1.5 flex items-center justify-center gap-1 text-[0.62rem] font-['Roboto'] font-medium uppercase tracking-wider border transition-all ${a.isFirstBooster ? 'bg-[#C9A84C]/15 border-[#C9A84C]/30 text-[#C9A84C]' : 'border-[#0A6E5A]/12 text-[#333333]/35 hover:border-[#C9A84C]/30 hover:text-[#C9A84C]'}`}>
            <Star className="w-3 h-3" />1st
          </button>
          <button onClick={onEdit}
            className="flex-1 py-1.5 flex items-center justify-center gap-1 text-[0.62rem] font-['Roboto'] font-medium uppercase tracking-wider border border-[#0A6E5A]/12 text-[#0A6E5A] hover:bg-[#0A6E5A]/8 transition-all">
            <Edit3 className="w-3 h-3" />Edit
          </button>
          <button onClick={onDel}
            className="py-1.5 px-2.5 flex items-center justify-center border border-red-100 text-red-400 hover:bg-red-50 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

{/* Main Page Component */}
export default function AdminAchieversPage() {
  const [achievers,    setAchievers]    = useState<Achiever[]>([]);
  const [pagination,   setPagination]   = useState<Pagination | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [err,          setErr]          = useState('');
  const [toast,        setToast]        = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [search,       setSearch]       = useState('');
  const [visible,      setVisible]      = useState('');
  const [page,         setPage]         = useState(1);
  const [viewMode,     setViewMode]     = useState<'grid' | 'list'>('grid');

  const [formMode,     setFormMode]     = useState<'create' | 'edit' | null>(null);
  const [editTarget,   setEditTarget]   = useState<Achiever | null>(null);
  const [delTarget,    setDelTarget]    = useState<Achiever | null>(null);

  const searchTimer = useRef<NodeJS.Timeout | undefined>(undefined);

   {/* Fetch */}
  const load = useCallback(async (overrides?: { search?: string; visible?: string; page?: number }) => {
    setLoading(true); setErr('');
    try {
      const params = new URLSearchParams({
        page:    String(overrides?.page    ?? page),
        limit:   '20',
        search:  overrides?.search  ?? search,
        visible: overrides?.visible ?? visible,
      });
      const res  = await fetch(`/api/admin/achievers?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setAchievers(json.data ?? []);
      setPagination(json.pagination ?? null);
    } catch (e: any) { setErr(e.message ?? 'Failed to load achievers.'); }
    finally { setLoading(false); }
  }, [page, search, visible]);

  useEffect(() => { load(); }, [page, visible]);

  const onSearch = (v: string) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load({ search: v, page: 1 }); }, 400);
  };

  // ── Toast ─────────────────────────────────────────────────────────────────

  const toast$ = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleCreate = async (data: Omit<Achiever, '_id' | 'createdAt'>) => {
    const res  = await fetch('/api/admin/achievers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    setFormMode(null);
    toast$('Achiever created!', 'success');
    load();
  };

  const handleUpdate = async (data: Omit<Achiever, '_id' | 'createdAt'>) => {
    if (!editTarget) return;
    const res  = await fetch(`/api/admin/achievers?id=${editTarget._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    setAchievers(p => p.map(a => a._id === editTarget._id ? json.data : a));
    setFormMode(null); setEditTarget(null);
    toast$('Achiever updated!', 'success');
  };

  const handleDelete = async () => {
    if (!delTarget) return;
    const res  = await fetch(`/api/admin/achievers?id=${delTarget._id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    setAchievers(p => p.filter(a => a._id !== delTarget._id));
    if (pagination) setPagination(p => p ? { ...p, total: p.total - 1 } : p);
    setDelTarget(null);
    toast$('Achiever deleted.', 'success');
  };

  const patch = async (a: Achiever, payload: Partial<Achiever>, msg: string) => {
    try {
      const res  = await fetch(`/api/admin/achievers?id=${a._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setAchievers(p => p.map(x => {
        if ('isFirstBooster' in payload && (payload as any).isFirstBooster) {
          return x._id === a._id ? { ...x, ...payload } : { ...x, isFirstBooster: false };
        }
        return x._id === a._id ? { ...x, ...payload } : x;
      }));
      toast$(msg, 'success');
    } catch (e: any) { toast$(e.message, 'error'); }
  };

  const total    = pagination?.total ?? achievers.length;
  const visCount = achievers.filter(a => a.isVisible).length;
  const goldCnt  = achievers.filter(a => a.memberType === 'gold').length;
  const firstCnt = achievers.filter(a => a.isFirstBooster).length;

  return (
    <div className="min-h-screen bg-[#F8FAF9] selection:bg-[#C9A84C]/30 selection:text-[#0A6E5A]">
      <Header />

      {/* Page Header */}
      <section className="bg-[#0A6E5A] pt-28 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-40 -right-40 w-120 h-120 bg-[#C9A84C]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <p className="font-['Roboto'] text-[0.68rem] uppercase tracking-[0.25em] text-[#C9A84C] mb-2">Admin Panel</p>
              <h1 className="font-['Fraunces'] text-[2.25rem] sm:text-[3rem] text-[#FFFFFF] leading-tight">
                Achievers Management
              </h1>
              <p className="font-['Roboto'] text-[#FFFFFF]/50 text-[0.875rem] mt-1.5">
                Manage Hall of Fame achievers displayed on the public gallery.
              </p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}
              onClick={() => { setEditTarget(null); setFormMode('create'); }}
              className="flex items-center gap-2 px-6 py-3.5 bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-[#FFFFFF] font-['Roboto'] font-semibold text-[0.875rem] transition-all shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />Add Achiever
            </motion.button>
          </div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8"
          >
            {[
              { label: 'Total',        value: total,    Icon: Trophy },
              { label: 'Visible',      value: visCount, Icon: Eye },
              { label: 'Gold Members', value: goldCnt,  Icon: Crown },
              { label: '1st Booster',  value: firstCnt, Icon: Star },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="bg-[#FFFFFF]/10 backdrop-blur-sm px-4 py-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <Icon className="w-3.5 h-3.5 text-[#C9A84C]" />
                  <span className="font-['Roboto'] text-[0.62rem] uppercase tracking-wider text-[#FFFFFF]/50">{label}</span>
                </div>
                <span className="font-['Fraunces'] text-[1.5rem] text-[#FFFFFF]">{value}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 space-y-6">

        {/* Controls */}
        <div className="bg-[#FFFFFF] border border-[#0A6E5A]/10 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A6E5A]/35" />
              <input value={search} onChange={e => onSearch(e.target.value)}
                placeholder="Search name, rank, location…"
                className="w-full pl-10 pr-9 py-2.5 border border-[#0A6E5A]/15 focus:border-[#0A6E5A] focus:outline-none font-['Roboto'] text-[0.875rem] text-[#333333] placeholder:text-[#333333]/30 bg-[#F8FAF9] transition-colors" />
              {search && (
                <button onClick={() => onSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-[#333333]/30 hover:text-[#333333]" />
                </button>
              )}
            </div>

            {/* Visibility filter */}
            <div className="flex gap-1.5">
              {[['', 'All'], ['true', 'Visible'], ['false', 'Hidden']].map(([v, l]) => (
                <button key={v} onClick={() => { setVisible(v); setPage(1); }}
                  className={`px-3 py-2.5 font-['Roboto'] text-[0.75rem] font-medium uppercase tracking-wider transition-all ${visible === v ? 'bg-[#0A6E5A] text-[#FFFFFF]' : 'border border-[#0A6E5A]/20 text-[#0A6E5A] hover:bg-[#0A6E5A]/5'}`}>
                  {l}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 border border-[#0A6E5A]/15 p-1">
              {(['grid', 'list'] as const).map(v => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`px-3 py-1.5 font-['Roboto'] text-[0.72rem] font-medium uppercase tracking-wider transition-all ${viewMode === v ? 'bg-[#0A6E5A] text-[#FFFFFF]' : 'text-[#0A6E5A] hover:bg-[#0A6E5A]/5'}`}>
                  {v}
                </button>
              ))}
            </div>

            <button onClick={() => load()} className="flex items-center gap-2 px-4 py-2.5 border border-[#0A6E5A]/20 text-[#0A6E5A] font-['Roboto'] text-[0.8rem] hover:bg-[#0A6E5A]/5 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="font-['Roboto'] text-[0.875rem] text-red-600">{err}</p>
          </div>
        )}

        {/* Content */}
        {loading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="bg-[#FFFFFF] border border-[#0A6E5A]/10 overflow-hidden">
              <div className="hidden md:flex px-5 py-3 bg-[#0A6E5A]/3 border-b border-[#0A6E5A]/8 gap-4">
                {['#', 'Achiever', 'Rank / Achievement', 'Location', 'Type', 'Status', 'Actions'].map(h => (
                  <div key={h} className={`font-['Roboto'] text-[0.63rem] uppercase tracking-widest text-[#333333]/40 ${h === '#' ? 'w-8 shrink-0' : h === 'Achiever' ? 'flex-1' : h === 'Rank / Achievement' ? 'w-36 shrink-0' : h === 'Location' ? 'w-28 shrink-0' : h === 'Type' ? 'w-20 shrink-0' : h === 'Status' ? 'w-20 shrink-0' : 'w-24 shrink-0'}`}>{h}</div>
                ))}
              </div>
              <div className="divide-y divide-[#0A6E5A]/5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-4 md:px-5 py-3 flex gap-4">
                    <div className="w-8 h-6 bg-[#0A6E5A]/6 rounded shrink-0" />
                    <div className="flex-1 h-6 bg-[#0A6E5A]/6 rounded" />
                    <div className="w-36 h-6 bg-[#0A6E5A]/6 rounded shrink-0" />
                    <div className="w-28 h-6 bg-[#0A6E5A]/6 rounded shrink-0 hidden md:block" />
                    <div className="w-20 h-6 bg-[#0A6E5A]/6 rounded shrink-0 hidden md:block" />
                    <div className="w-20 h-6 bg-[#0A6E5A]/6 rounded shrink-0 hidden md:block" />
                    <div className="w-24 h-6 bg-[#0A6E5A]/6 rounded shrink-0 hidden md:block" />
                  </div>
                ))}
              </div>
            </div>
          )
        ) : achievers.length === 0 ? (
          <div className="py-20 text-center bg-[#FFFFFF] border border-[#0A6E5A]/10">
            <Award className="w-12 h-12 text-[#0A6E5A]/15 mx-auto mb-3" />
            <p className="font-['Fraunces'] text-[1.25rem] text-[#0A6E5A]/40 mb-1">No achievers found</p>
            <p className="font-['Roboto'] text-[0.8rem] text-[#333333]/30 mb-5">
              {search ? 'Try a different search.' : 'Add your first achiever to get started.'}
            </p>
            {!search && (
              <button onClick={() => setFormMode('create')}
                className="px-6 py-3 bg-[#0A6E5A] text-[#FFFFFF] font-['Roboto'] font-semibold text-[0.875rem] flex items-center gap-2 mx-auto hover:bg-[#0A6E5A]/90 transition-colors">
                <Plus className="w-4 h-4" />Add First Achiever
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {achievers.map((a, i) => (
              <ACard key={a._id} a={a} idx={i}
                onEdit={() => { setEditTarget(a); setFormMode('edit'); }}
                onDel={() => setDelTarget(a)}
                onToggleVis={() => patch(a, { isVisible: !a.isVisible }, a.isVisible ? 'Hidden.' : 'Now visible.')}
                onToggle1st={() => patch(a, { isFirstBooster: !a.isFirstBooster }, a.isFirstBooster ? 'Removed 1st Booster.' : 'Set as First Booster!')}
              />
            ))}
          </div>
        ) : (
          /* List view */
          <div className="bg-[#FFFFFF] border border-[#0A6E5A]/10 overflow-hidden">
            <div className="hidden md:flex px-5 py-3 bg-[#0A6E5A]/3 border-b border-[#0A6E5A]/8 gap-4">
              {['#', 'Achiever', 'Rank / Achievement', 'Location', 'Type', 'Status', 'Actions'].map(h => (
                <div key={h} className={`font-['Roboto'] text-[0.63rem] uppercase tracking-widest text-[#333333]/40 ${h === '#' ? 'w-8 shrink-0' : h === 'Achiever' ? 'flex-1' : h === 'Rank / Achievement' ? 'w-36 shrink-0' : h === 'Location' ? 'w-28 shrink-0' : h === 'Type' ? 'w-20 shrink-0' : h === 'Status' ? 'w-20 shrink-0' : 'w-24 shrink-0'}`}>{h}</div>
              ))}
            </div>
            <div className="divide-y divide-[#0A6E5A]/5">
              {achievers.map((a, i) => {
                const [imgFail, setIF] = useState(false);
                return (
                  <motion.div key={a._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className={`px-4 md:px-5 py-3 flex flex-col md:flex-row md:items-center gap-3 hover:bg-[#0A6E5A]/2 transition-colors group ${!a.isVisible ? 'opacity-55' : ''}`}>
                    {/* # */}
                    <div className="hidden md:flex w-8 shrink-0 items-center gap-1">
                      {a.isFirstBooster && <Star className="w-3 h-3 text-[#C9A84C]" />}
                      <span className="font-['Roboto'] text-[0.68rem] text-[#333333]/30">#{a.displayOrder ?? 0}</span>
                    </div>
                    {/* Name */}
                    <div className="flex-1 flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-full overflow-hidden border ${a.isFirstBooster ? 'border-[#C9A84C]' : 'border-[#0A6E5A]/10'} bg-[#0A6E5A]/5 shrink-0`}>
                        {a.profilePhoto && !imgFail ? (
                          <Image src={a.profilePhoto} alt={a.achieverName} width={36} height={36} className="w-full h-full object-cover" onError={() => setIF(true)} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-['Fraunces'] text-[0.78rem] text-[#0A6E5A]">{a.achieverName.charAt(0)}</div>
                        )}
                      </div>
                      <span className="font-['Roboto'] font-semibold text-[0.82rem] text-[#333333] truncate">{a.achieverName}</span>
                    </div>
                    {/* Rank */}
                    <div className="hidden md:block w-36 shrink-0">
                      <span className="font-['Roboto'] text-[0.72rem] text-[#C9A84C]">{a.rankAchievement || '—'}</span>
                    </div>
                    {/* Location */}
                    <div className="hidden md:block w-28 shrink-0">
                      <span className="font-['Roboto'] text-[0.72rem] text-[#333333]/45">{a.locationState || '—'}</span>
                    </div>
                    {/* Type */}
                    <div className="hidden md:block w-20 shrink-0"><MemberBadge type={a.memberType} /></div>
                    {/* Visibility */}
                    <div className="hidden md:block w-20 shrink-0">
                      <VisiToggle on={a.isVisible ?? true} onToggle={() => patch(a, { isVisible: !a.isVisible }, a.isVisible ? 'Hidden.' : 'Now visible.')} />
                    </div>
                    {/* Actions */}
                    <div className="w-24 shrink-0 flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => patch(a, { isFirstBooster: !a.isFirstBooster }, a.isFirstBooster ? 'Removed.' : 'Set as 1st!')}
                        className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${a.isFirstBooster ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'bg-[#333333]/6 text-[#333333]/30 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10'}`}>
                        <Star className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setEditTarget(a); setFormMode('edit'); }}
                        className="w-7 h-7 flex items-center justify-center rounded bg-[#0A6E5A]/8 hover:bg-[#0A6E5A]/15 text-[#0A6E5A] transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDelTarget(a)}
                        className="w-7 h-7 flex items-center justify-center rounded bg-red-50 hover:bg-red-100 text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-[#FFFFFF] border border-[#0A6E5A]/10 px-5 py-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrevPage}
              className="flex items-center gap-2 px-4 py-2 border border-[#0A6E5A]/20 font-['Roboto'] text-[0.8rem] text-[#0A6E5A] hover:bg-[#0A6E5A]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />Prev
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => i + 1).map(pg => (
                <button key={pg} onClick={() => setPage(pg)}
                  className={`w-8 h-8 font-['Roboto'] text-[0.8rem] transition-all ${pagination.page === pg ? 'bg-[#0A6E5A] text-[#FFFFFF]' : 'text-[#333333]/50 hover:bg-[#0A6E5A]/8'}`}>
                  {pg}
                </button>
              ))}
            </div>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={!pagination.hasNextPage}
              className="flex items-center gap-2 px-4 py-2 border border-[#0A6E5A]/20 font-['Roboto'] text-[0.8rem] text-[#0A6E5A] hover:bg-[#0A6E5A]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Next<ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {formMode && (
          <FormModal mode={formMode}
            initial={editTarget ? {
              achieverName:    editTarget.achieverName,
              profilePhoto:    editTarget.profilePhoto    ?? '',
              rankAchievement: editTarget.rankAchievement ?? '',
              locationState:   editTarget.locationState   ?? '',
              description:     editTarget.description     ?? '',
              memberType:      editTarget.memberType      ?? 'active',
              isFirstBooster:  editTarget.isFirstBooster  ?? false,
              displayOrder:    editTarget.displayOrder    ?? 0,
              isVisible:       editTarget.isVisible       ?? true,
            } : { ...EMPTY }}
            onClose={() => { setFormMode(null); setEditTarget(null); }}
            onSave={formMode === 'create' ? handleCreate : handleUpdate}
          />
        )}
        {delTarget && (
          <DelModal a={delTarget} onClose={() => setDelTarget(null)} onConfirm={handleDelete} />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-6 left-1/2 z-200 flex items-center gap-3 px-5 py-3 shadow-2xl font-['Roboto'] text-[0.875rem] whitespace-nowrap ${toast.type === 'success' ? 'bg-[#0A6E5A] text-[#FFFFFF]' : 'bg-red-500 text-[#FFFFFF]'}`}>
            {toast.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {toast.msg}
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
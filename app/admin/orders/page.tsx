"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Package, Search, Trash2, Edit3,
  ChevronLeft, ChevronRight, Loader2, X, Check, AlertTriangle,
  RefreshCw, Download, AlertCircle, ArrowUpDown, ArrowDown, ArrowUp,
  Phone, User, CreditCard, Clock, CheckCircle2, XCircle,
  Truck, IndianRupee, Eye, ChevronDown, Tag,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

{/* Types */}
type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
type SortField   = 'createdAt' | 'updatedAt' | 'name' | 'status' | 'productPrice' | 'packPrice';
type SortOrder   = 'asc' | 'desc';

interface Order {
  _id: string;
  userId?: string;
  username?: string;
  name: string;
  mobileNumber: string;
  transactionDetails: string;
  productId?: string;
  productName?: string;
  productPrice?: number;
  packId?: string;
  packName?: string;
  packPrice?: number;
  quantity?: number;
  orderType: 'product' | 'pack';
  status: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
}

interface Pagination {
  page: number; limit: number; total: number;
  totalPages: number; hasNextPage: boolean; hasPrevPage: boolean;
}

interface Summary {
  totalOrders: number; totalPending: number; totalConfirmed: number;
  totalCompleted: number; totalCancelled: number; totalRevenue: number;
}

{/* Status Config */}
const S: Record<OrderStatus, { label: string; color: string; bg: string; border: string; Icon: React.ElementType }> = {
  pending:    { label: 'Pending',    color: 'text-amber-600',   bg: 'bg-amber-50',       border: 'border-amber-200',      Icon: Clock       },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-600',    bg: 'bg-blue-50',         border: 'border-blue-200',       Icon: CheckCircle2 },
  processing: { label: 'Processing', color: 'text-purple-600',  bg: 'bg-purple-50',       border: 'border-purple-200',     Icon: Truck       },
  completed:  { label: 'Completed',  color: 'text-[#0A6E5A]',   bg: 'bg-[#0A6E5A]/8',    border: 'border-[#0A6E5A]/20',  Icon: Check       },
  cancelled:  { label: 'Cancelled',  color: 'text-red-500',     bg: 'bg-red-50',           border: 'border-red-200',        Icon: XCircle     },
};

const ALL_STATUSES = Object.keys(S) as OrderStatus[];

{/* Helper: Item Name + Price */}
function itemName(o: Order)  { return o.orderType === 'product' ? (o.productName ?? '—') : (o.packName ?? '—'); }
function itemPrice(o: Order) { return o.orderType === 'product' ? (o.productPrice ?? 0)  : (o.packPrice  ?? 0); }

{/* Atoms */}
const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const cfg = S[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[0.62rem] font-['Roboto'] font-bold uppercase tracking-wider border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <cfg.Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
};

const SortTh = ({ field, cur, ord, children, onClick, cls }: {
  field: string; cur: string; ord: SortOrder;
  children: React.ReactNode; onClick: () => void; cls?: string;
}) => (
  <th onClick={onClick} className={`px-4 py-3 text-left font-['Roboto'] text-[0.63rem] uppercase tracking-widest text-[#333333]/45 cursor-pointer hover:text-[#0A6E5A] select-none whitespace-nowrap ${cls ?? ''}`}>
    <span className="inline-flex items-center gap-1.5">
      {children}
      {field !== cur ? <ArrowUpDown className="w-3 h-3 opacity-25" /> :
        ord === 'asc' ? <ArrowUp className="w-3 h-3 text-[#C9A84C]" /> : <ArrowDown className="w-3 h-3 text-[#C9A84C]" />}
    </span>
  </th>
);

{/* Status Dropdown Inline */}
const StatusDropdown = ({ current, onChange }: { current: OrderStatus; onChange: (s: OrderStatus) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 focus:outline-none">
        <StatusBadge status={current} />
        <ChevronDown className="w-3 h-3 text-[#333333]/30" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 mt-1 z-40 bg-[#FFFFFF] border border-[#0A6E5A]/15 shadow-xl min-w-35"
          >
            {ALL_STATUSES.map(st => (
              <button key={st} onClick={() => { onChange(st); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-[#0A6E5A]/5 transition-colors ${current === st ? 'bg-[#0A6E5A]/5' : ''}`}>
                <StatusBadge status={st} />
                {current === st && <Check className="w-3 h-3 text-[#0A6E5A] ml-auto" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

{/* Order Detail Drawer */}
const OrderDrawer = ({ order, onClose, onStatusChange }: {
  order: Order;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => Promise<void>;
}) => {
  const price = itemPrice(order);
  const name  = itemName(order);
  const date  = order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : '—';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end bg-[#0A6E5A]/30 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 200 }}
        className="bg-[#FFFFFF] w-full max-w-md h-full overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Drawer Header */}
        <div className="sticky top-0 bg-[#0A6E5A] px-6 py-5 flex items-center justify-between z-10">
          <div>
            <h3 className="font-['Fraunces'] text-[1.2rem] text-[#FFFFFF]">Order Details</h3>
            <p className="font-['Roboto'] text-[0.7rem] text-[#C9A84C] mt-0.5">#{order._id.slice(-8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 flex items-center justify-center">
            <X className="w-4 h-4 text-[#FFFFFF]" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <p className="font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#C9A84C] mb-2 flex items-center gap-2">
              <span className="w-6 h-px bg-[#C9A84C]" />Order Status
            </p>
            <StatusDropdown current={order.status} onChange={s => onStatusChange(order._id, s)} />
          </div>

          {/* Customer Info */}
          <div>
            <p className="font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#C9A84C] mb-3 flex items-center gap-2">
              <span className="w-6 h-px bg-[#C9A84C]" />Customer
            </p>
            <div className="space-y-2.5">
              {[
                { Icon: User,   label: 'Name',     val: order.name },
                { Icon: Tag,    label: 'User ID',  val: order.userId ?? '—' },
                { Icon: User,   label: 'Username', val: order.username ?? '—' },
                { Icon: Phone,  label: 'Mobile',   val: order.mobileNumber },
              ].map(({ Icon, label, val }) => (
                <div key={label} className="flex justify-between items-start py-2 border-b border-[#0A6E5A]/5 last:border-0">
                  <span className="flex items-center gap-2 font-['Roboto'] text-[0.72rem] text-[#333333]/45">
                    <Icon className="w-3.5 h-3.5" />{label}
                  </span>
                  <span className="font-['Roboto'] text-[0.78rem] font-medium text-[#333333] max-w-[55%] text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Info */}
          <div>
            <p className="font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#C9A84C] mb-3 flex items-center gap-2">
              <span className="w-6 h-px bg-[#C9A84C]" />Order Info
            </p>
            <div className="space-y-2.5">
              {[
                { label: 'Type',      val: order.orderType === 'product' ? 'Product' : 'Starter Pack' },
                { label: 'Item',      val: name },
                { label: 'Price',     val: `₹${price.toLocaleString('en-IN')}` },
                { label: 'Quantity',  val: String(order.quantity ?? 1) },
                { label: 'Placed',    val: date },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between items-start py-2 border-b border-[#0A6E5A]/5 last:border-0">
                  <span className="font-['Roboto'] text-[0.72rem] text-[#333333]/45">{label}</span>
                  <span className="font-['Roboto'] text-[0.78rem] font-medium text-[#333333] max-w-[60%] text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction */}
          <div>
            <p className="font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#C9A84C] mb-2 flex items-center gap-2">
              <span className="w-6 h-px bg-[#C9A84C]" />Transaction Details
            </p>
            <div className="bg-[#0A6E5A]/4 border border-[#0A6E5A]/10 p-4">
              <p className="font-['Roboto'] text-[0.8rem] text-[#333333]/70 leading-relaxed whitespace-pre-wrap">
                {order.transactionDetails}
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="bg-[#0A6E5A] p-4 flex justify-between items-center">
            <span className="font-['Roboto'] text-[0.8rem] font-semibold text-[#FFFFFF]/70 uppercase tracking-wider">Total Amount</span>
            <span className="font-['Fraunces'] text-[1.5rem] text-[#C9A84C]">
              ₹{(price * (order.quantity ?? 1)).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

{/* Delete Modal */}
const DeleteModal = ({ order, onClose, onConfirm }: {
  order: Order; onClose: () => void; onConfirm: () => Promise<void>;
}) => {
  const [del, setDel] = useState(false);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-[#FFFFFF] w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="font-['Fraunces'] text-[1.15rem] text-[#333333] mb-2">Delete Order?</h3>
          <p className="font-['Roboto'] text-[0.875rem] text-[#333333]/55 mb-1">
            Order by <span className="font-semibold text-[#0A6E5A]">{order.name}</span>
          </p>
          <p className="font-['Roboto'] text-[0.78rem] text-[#333333]/40 mb-6">
            #{order._id.slice(-8).toUpperCase()} · {itemName(order)}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-[#333333]/20 font-['Roboto'] text-[0.875rem] text-[#333333]/55 hover:bg-[#333333]/5 transition-colors">Cancel</button>
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

{/* Main Page */}
export default function AdminOrdersPage() {
  const [orders,      setOrders]      = useState<Order[]>([]);
  const [pagination,  setPagination]  = useState<Pagination | null>(null);
  const [summary,     setSummary]     = useState<Summary | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [err,         setErr]         = useState('');
  const [toast,       setToast]       = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [search,      setSearch]      = useState('');
  const [statusFilter,setStatusFilter]= useState('');
  const [typeFilter,  setTypeFilter]  = useState('');
  const [page,        setPage]        = useState(1);
  const [sortBy,      setSortBy]      = useState<SortField>('createdAt');
  const [sortOrder,   setSortOrder]   = useState<SortOrder>('desc');
  const [showFilter,  setShowFilter]  = useState(false);
  const [viewOrder,   setViewOrder]   = useState<Order | null>(null);
  const [delOrder,    setDelOrder]    = useState<Order | null>(null);
  const searchTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const load = useCallback(async (overrides?: {
    search?: string; statusFilter?: string; typeFilter?: string;
    page?: number; sortBy?: SortField; sortOrder?: SortOrder;
  }) => {
    setLoading(true); setErr('');
    try {
      const params = new URLSearchParams({
        page:      String(overrides?.page       ?? page),
        limit:     '20',
        search:    overrides?.search             ?? search,
        status:    overrides?.statusFilter       ?? statusFilter,
        orderType: overrides?.typeFilter         ?? typeFilter,
        sortBy:    overrides?.sortBy             ?? sortBy,
        sortOrder: overrides?.sortOrder          ?? sortOrder,
      });
      const res  = await fetch(`/api/admin/orders?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setOrders(json.data ?? []);
      setPagination(json.pagination ?? null);
      setSummary(json.summary ?? null);
    } catch (e: any) { setErr(e.message ?? 'Failed to load orders.'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, typeFilter, sortBy, sortOrder]);

  useEffect(() => { load(); }, [page, statusFilter, typeFilter, sortBy, sortOrder]);

  const onSearch = (v: string) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load({ search: v, page: 1 }); }, 400);
  };

  {/* Sort */}
  const handleSort = (f: SortField) => {
    const next: SortOrder = sortBy === f && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(f); setSortOrder(next);
  };

  {/* Toast */}
  const toast$ = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

    {/* Status Change */}
  const handleStatusChange = async (id: string, status: OrderStatus) => {
    try {
      const res  = await fetch(`/api/admin/orders?id=${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
      if (viewOrder?._id === id) setViewOrder(v => v ? { ...v, status } : v);
      toast$('Status updated.', 'success');
    } catch (e: any) { toast$(e.message, 'error'); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!delOrder) return;
    const res  = await fetch(`/api/admin/orders?id=${delOrder._id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    setOrders(prev => prev.filter(o => o._id !== delOrder._id));
    if (pagination) setPagination(p => p ? { ...p, total: p.total - 1 } : p);
    setDelOrder(null);
    toast$('Order deleted.', 'success');
  };

  // ── Export CSV ────────────────────────────────────────────────────────────

  const exportCSV = () => {
    const hdrs = ['Order ID', 'Name', 'User ID', 'Mobile', 'Type', 'Item', 'Price', 'Qty', 'Status', 'Transaction', 'Date'];
    const rows = orders.map(o => [
      o._id.slice(-8).toUpperCase(), o.name, o.userId ?? '', o.mobileNumber,
      o.orderType, itemName(o), itemPrice(o), o.quantity ?? 1,
      o.status, o.transactionDetails, o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '',
    ]);
    const csv  = [hdrs, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `orders-${Date.now()}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  // ── Stat Cards ────────────────────────────────────────────────────────────

  const statCards = summary ? [
    { label: 'Total Orders',  value: summary.totalOrders,    icon: ShoppingBag,   color: 'text-[#0A6E5A]' },
    { label: 'Pending',       value: summary.totalPending,   icon: Clock,         color: 'text-amber-500' },
    { label: 'Completed',     value: summary.totalCompleted, icon: CheckCircle2,  color: 'text-[#0A6E5A]' },
    { label: 'Revenue',       value: `₹${(summary.totalRevenue ?? 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-[#C9A84C]' },
  ] : [];

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAF9] selection:bg-[#C9A84C]/30 selection:text-[#0A6E5A]">
      <Header />

      {/* ── Page Header ── */}
      <section className="bg-[#0A6E5A] pt-28 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-40 -right-40 w-120 h-120 bg-[#C9A84C]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="font-['Roboto'] text-[0.68rem] uppercase tracking-[0.25em] text-[#C9A84C] mb-2">Admin Panel</p>
            <h1 className="font-['Fraunces'] text-[2.25rem] sm:text-[3rem] text-[#FFFFFF] leading-tight">
              Order Management
            </h1>
            <p className="font-['Roboto'] text-[#FFFFFF]/50 text-[0.875rem] mt-1.5">
              View, manage, and update all customer orders in real time.
            </p>
          </motion.div>

          {/* Summary Cards */}
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8"
            >
              {statCards.map(({ label, value, icon: Ic, color }) => (
                <div key={label} className="bg-[#FFFFFF]/10 backdrop-blur-sm px-4 py-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Ic className="w-3.5 h-3.5 text-[#C9A84C]" />
                    <span className="font-['Roboto'] text-[0.62rem] uppercase tracking-wider text-[#FFFFFF]/50">{label}</span>
                  </div>
                  <span className={`font-['Fraunces'] text-[1.4rem] ${color} text-[#FFFFFF]`}>{value}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 space-y-6">

        {/* ── Controls ── */}
        <div className="bg-[#FFFFFF] border border-[#0A6E5A]/10 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A6E5A]/35" />
              <input value={search} onChange={e => onSearch(e.target.value)}
                placeholder="Search by name, user ID, mobile, item, transaction…"
                className="w-full pl-10 pr-9 py-2.5 border border-[#0A6E5A]/15 focus:border-[#0A6E5A] focus:outline-none font-['Roboto'] text-[0.875rem] text-[#333333] placeholder:text-[#333333]/30 bg-[#F8FAF9] transition-colors" />
              {search && (
                <button onClick={() => onSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-[#333333]/30 hover:text-[#333333]" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button onClick={() => setShowFilter(f => !f)}
              className={`flex items-center gap-2 px-4 py-2.5 border font-['Roboto'] text-[0.8rem] font-medium transition-all ${showFilter ? 'bg-[#0A6E5A] text-[#FFFFFF] border-[#0A6E5A]' : 'border-[#0A6E5A]/20 text-[#0A6E5A] hover:bg-[#0A6E5A]/5'}`}>
              <Search className="w-4 h-4" />Filters
              {(statusFilter || typeFilter) && <span className="w-2 h-2 rounded-full bg-[#C9A84C]" />}
            </button>

            {/* Refresh */}
            <button onClick={() => load()} className="flex items-center gap-2 px-4 py-2.5 border border-[#0A6E5A]/20 text-[#0A6E5A] font-['Roboto'] text-[0.8rem] hover:bg-[#0A6E5A]/5 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export */}
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-[#FFFFFF] font-['Roboto'] text-[0.8rem] font-medium hover:bg-[#C9A84C]/90 transition-colors">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilter && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-4 mt-4 border-t border-[#0A6E5A]/8 flex flex-wrap gap-5">
                  {/* Status */}
                  <div>
                    <p className="font-['Roboto'] text-[0.63rem] uppercase tracking-widest text-[#333333]/40 mb-1.5">Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['', ...ALL_STATUSES].map(st => (
                        <button key={st} onClick={() => { setStatusFilter(st); setPage(1); }}
                          className={`px-2.5 py-1.5 text-[0.7rem] font-['Roboto'] font-medium transition-all ${statusFilter === st ? 'bg-[#0A6E5A] text-[#FFFFFF]' : 'border border-[#0A6E5A]/15 text-[#0A6E5A] hover:bg-[#0A6E5A]/5'}`}>
                          {st === '' ? 'All' : S[st as OrderStatus].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <p className="font-['Roboto'] text-[0.63rem] uppercase tracking-widest text-[#333333]/40 mb-1.5">Order Type</p>
                    <div className="flex gap-1.5">
                      {[['', 'All'], ['product', 'Product'], ['pack', 'Starter Pack']].map(([v, l]) => (
                        <button key={v} onClick={() => { setTypeFilter(v); setPage(1); }}
                          className={`px-2.5 py-1.5 text-[0.7rem] font-['Roboto'] font-medium transition-all ${typeFilter === v ? 'bg-[#C9A84C] text-[#FFFFFF]' : 'border border-[#C9A84C]/25 text-[#C9A84C] hover:bg-[#C9A84C]/5'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(statusFilter || typeFilter) && (
                    <button onClick={() => { setStatusFilter(''); setTypeFilter(''); setPage(1); }}
                      className="self-end text-[0.72rem] font-['Roboto'] text-red-400 hover:text-red-600 flex items-center gap-1">
                      <X className="w-3 h-3" />Clear
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error */}
        {err && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="font-['Roboto'] text-[0.875rem] text-red-600">{err}</p>
          </div>
        )}

        {/* ── Desktop Table ── */}
        <div className="bg-[#FFFFFF] border border-[#0A6E5A]/10 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#0A6E5A]/8 flex items-center justify-between">
            <p className="font-['Roboto'] text-[0.72rem] text-[#333333]/45">
              {loading ? 'Loading…' : `Showing ${orders.length} of ${pagination?.total ?? 0} orders`}
            </p>
            {pagination && (
              <p className="font-['Roboto'] text-[0.72rem] text-[#333333]/35">
                Page {pagination.page}/{pagination.totalPages}
              </p>
            )}
          </div>

          {/* Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0A6E5A]/3 border-b border-[#0A6E5A]/8">
                <tr>
                  <th className="px-4 py-3 text-left font-['Roboto'] text-[0.63rem] uppercase tracking-widest text-[#333333]/45">#</th>
                  <SortTh field="name"       cur={sortBy} ord={sortOrder} onClick={() => handleSort('name')}>Customer</SortTh>
                  <th className="px-4 py-3 text-left font-['Roboto'] text-[0.63rem] uppercase tracking-widest text-[#333333]/45">Item</th>
                  <th className="px-4 py-3 text-left font-['Roboto'] text-[0.63rem] uppercase tracking-widest text-[#333333]/45">Type</th>
                  <SortTh field="productPrice" cur={sortBy} ord={sortOrder} onClick={() => handleSort('productPrice')}>Amount</SortTh>
                  <SortTh field="status"     cur={sortBy} ord={sortOrder} onClick={() => handleSort('status')}>Status</SortTh>
                  <SortTh field="createdAt"  cur={sortBy} ord={sortOrder} onClick={() => handleSort('createdAt')}>Date</SortTh>
                  <th className="px-4 py-3 text-left font-['Roboto'] text-[0.63rem] uppercase tracking-widest text-[#333333]/45">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0A6E5A]/5">
                {loading ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0A6E5A] mx-auto mb-2" />
                    <p className="font-['Roboto'] text-[0.8rem] text-[#333333]/35">Fetching orders…</p>
                  </td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <ShoppingBag className="w-10 h-10 text-[#0A6E5A]/15 mx-auto mb-2" />
                    <p className="font-['Roboto'] text-[0.875rem] text-[#333333]/35">No orders found.</p>
                  </td></tr>
                ) : orders.map((o, i) => {
                  const price = itemPrice(o);
                  const name  = itemName(o);
                  const date  = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—';
                  return (
                    <motion.tr key={o._id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025 }}
                      className="hover:bg-[#0A6E5A]/2 group transition-colors">
                      <td className="px-4 py-3.5 font-['Roboto'] text-[0.7rem] text-[#333333]/30">
                        {((page - 1) * 20) + i + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-['Roboto'] font-semibold text-[0.8rem] text-[#333333]">{o.name}</p>
                        <p className="font-['Roboto'] text-[0.68rem] text-[#C9A84C]">{o.userId ?? o.username ?? '—'}</p>
                        <p className="font-['Roboto'] text-[0.68rem] text-[#333333]/40">{o.mobileNumber}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-['Roboto'] text-[0.78rem] text-[#333333]/80 max-w-40 truncate">{name}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[0.62rem] font-['Roboto'] font-bold uppercase tracking-wider ${o.orderType === 'product' ? 'bg-[#0A6E5A]/8 text-[#0A6E5A]' : 'bg-[#C9A84C]/12 text-[#C9A84C]'}`}>
                          {o.orderType === 'product' ? <ShoppingBag className="w-2.5 h-2.5" /> : <Package className="w-2.5 h-2.5" />}
                          {o.orderType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-['Fraunces'] text-[0.95rem] text-[#0A6E5A]">₹{price.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusDropdown current={o.status} onChange={s => handleStatusChange(o._id, s)} />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-['Roboto'] text-[0.7rem] text-[#333333]/45">{date}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setViewOrder(o)} title="View Details"
                            className="w-7 h-7 flex items-center justify-center rounded bg-[#0A6E5A]/8 hover:bg-[#0A6E5A]/15 text-[#0A6E5A] transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDelOrder(o)} title="Delete"
                            className="w-7 h-7 flex items-center justify-center rounded bg-red-50 hover:bg-red-100 text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="lg:hidden divide-y divide-[#0A6E5A]/5">
            {loading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#0A6E5A] mx-auto mb-2" />
                <p className="font-['Roboto'] text-[0.8rem] text-[#333333]/35">Loading…</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center">
                <ShoppingBag className="w-10 h-10 text-[#0A6E5A]/15 mx-auto mb-2" />
                <p className="font-['Roboto'] text-[0.875rem] text-[#333333]/35">No orders found.</p>
              </div>
            ) : orders.map((o, i) => {
              const price = itemPrice(o);
              const name  = itemName(o);
              return (
                <motion.div key={o._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-['Roboto'] font-semibold text-[0.875rem] text-[#333333]">{o.name}</p>
                      <p className="font-['Roboto'] text-[0.7rem] text-[#C9A84C]">{o.userId ?? o.username ?? '—'}</p>
                      <p className="font-['Roboto'] text-[0.68rem] text-[#333333]/40">{o.mobileNumber}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setViewOrder(o)}
                        className="w-8 h-8 flex items-center justify-center rounded bg-[#0A6E5A]/8 hover:bg-[#0A6E5A]/15 text-[#0A6E5A]">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDelOrder(o)}
                        className="w-8 h-8 flex items-center justify-center rounded bg-red-50 hover:bg-red-100 text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="font-['Roboto'] text-[0.78rem] text-[#333333]/70 mb-3 truncate">{name}</p>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <StatusDropdown current={o.status} onChange={s => handleStatusChange(o._id, s)} />
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[0.6rem] font-['Roboto'] font-bold uppercase tracking-wider ${o.orderType === 'product' ? 'bg-[#0A6E5A]/8 text-[#0A6E5A]' : 'bg-[#C9A84C]/12 text-[#C9A84C]'}`}>
                      {o.orderType === 'product' ? <ShoppingBag className="w-2.5 h-2.5" /> : <Package className="w-2.5 h-2.5" />}
                      {o.orderType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-['Fraunces'] text-[1.1rem] text-[#0A6E5A]">₹{price.toLocaleString('en-IN')}</span>
                    <span className="font-['Roboto'] text-[0.68rem] text-[#333333]/35">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Pagination ── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-[#FFFFFF] border border-[#0A6E5A]/10 px-5 py-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrevPage}
              className="flex items-center gap-2 px-4 py-2 border border-[#0A6E5A]/20 font-['Roboto'] text-[0.8rem] text-[#0A6E5A] hover:bg-[#0A6E5A]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />Prev
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
                const tp = pagination.totalPages, cp = pagination.page;
                let pg: number;
                if (tp <= 7) pg = i + 1;
                else if (cp <= 4) pg = i < 6 ? i + 1 : tp;
                else if (cp >= tp - 3) pg = i === 0 ? 1 : tp - 6 + i + 1;
                else { const m = [1, cp - 2, cp - 1, cp, cp + 1, cp + 2, tp]; pg = m[i]; }
                return (
                  <button key={i} onClick={() => setPage(pg)}
                    className={`w-8 h-8 font-['Roboto'] text-[0.8rem] transition-all ${pagination.page === pg ? 'bg-[#0A6E5A] text-[#FFFFFF]' : 'text-[#333333]/50 hover:bg-[#0A6E5A]/8'}`}>
                    {pg}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={!pagination.hasNextPage}
              className="flex items-center gap-2 px-4 py-2 border border-[#0A6E5A]/20 font-['Roboto'] text-[0.8rem] text-[#0A6E5A] hover:bg-[#0A6E5A]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Next<ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* ── Modals ── */}
      <AnimatePresence>
        {viewOrder && (
          <OrderDrawer order={viewOrder} onClose={() => setViewOrder(null)} onStatusChange={handleStatusChange} />
        )}
        {delOrder && (
          <DeleteModal order={delOrder} onClose={() => setDelOrder(null)} onConfirm={handleDelete} />
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-6 left-1/2 z-100 flex items-center gap-3 px-5 py-3 shadow-2xl font-['Roboto'] text-[0.875rem] whitespace-nowrap ${toast.type === 'success' ? 'bg-[#0A6E5A] text-[#FFFFFF]' : 'bg-red-500 text-[#FFFFFF]'}`}>
            {toast.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {toast.msg}
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}
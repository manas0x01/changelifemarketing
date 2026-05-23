"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Search, User, Key, CheckCircle,
  Loader2, Copy, Check, RefreshCw, ArrowRightLeft,
  Calendar, Info
} from "lucide-react";

interface PinTransfer {
  ePin: string;
  package: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  date: string;
  time: string;
  status: string;
  remark: string;
}

export default function PinTransfersPage() {
  const [transfers, setTransfers] = useState<PinTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/pintransfers");
      const json = await res.json();
      if (res.ok) {
        setTransfers(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch transfer logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered transfers
  const filteredTransfers = transfers.filter((t) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      t.ePin.toLowerCase().includes(searchLower) ||
      t.senderId.toLowerCase().includes(searchLower) ||
      t.senderName.toLowerCase().includes(searchLower) ||
      t.recipientId.toLowerCase().includes(searchLower) ||
      t.recipientName.toLowerCase().includes(searchLower) ||
      t.package.toLowerCase().includes(searchLower);

    let matchesDate = true;
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      const tDate = new Date(t.date);
      if (tDate < from) matchesDate = false;
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      const tDate = new Date(t.date);
      if (tDate > to) matchesDate = false;
    }

    return matchesSearch && matchesDate;
  });

  // Calculate statistics
  const totalTransfers = filteredTransfers.length;
  const uniqueSenders = new Set(filteredTransfers.map((t) => t.senderId)).size;
  const uniqueRecipients = new Set(filteredTransfers.map((t) => t.recipientId)).size;

  return (
    <div className="bg-[#F5F7F6] min-h-screen pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 bg-[#FFFFFF]/95 backdrop-blur border-b border-[#0A6E5A]/10 px-6 md:px-8 py-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['Fraunces'] text-[2rem] md:text-[2.5rem] text-[#0A6E5A]">E-Pin Transfer Logs</h1>
            <p className="font-['Roboto'] text-[#333333]/60 text-sm mt-1">Monitor Member-to-Member E-Pin transfers</p>
          </div>
          <button
            onClick={fetchTransfers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-[#0A6E5A]/15 text-[#0A6E5A] hover:bg-[#0A6E5A]/5 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </motion.div>

      <main className="px-6 md:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Total Transfers", val: totalTransfers, icon: ArrowRightLeft, color: "text-[#0A6E5A]", bg: "bg-[#0A6E5A]/5" },
              { label: "Unique Senders", val: uniqueSenders, icon: User, color: "text-amber-500", bg: "bg-amber-50" },
              { label: "Unique Recipients", val: uniqueRecipients, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" }
            ].map((st, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={i}
                className="bg-[#FFFFFF] border border-[#0A6E5A]/10 p-5 flex items-center justify-between"
              >
                <div>
                  <span className="font-['Roboto'] text-[0.72rem] text-[#333333]/50 uppercase tracking-wider block mb-1">{st.label}</span>
                  <span className="font-['Fraunces'] text-[1.5rem] md:text-[2rem] text-[#333333] font-bold">{st.val}</span>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${st.bg}`}>
                  <st.icon className={`w-5 h-5 ${st.color}`} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filters Panel */}
          <div className="bg-[#FFFFFF] border border-[#0A6E5A]/10 p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            
            {/* Search */}
            <div className="flex-1 min-w-[280px]">
              <label className="block text-xs font-semibold text-[#0A6E5A] mb-1.5">Search Transfers</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A6E5A]/40" />
                <input
                  type="text"
                  placeholder="Search by E-Pin, Sender ID/Name, Recipient ID/Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-[#0A6E5A]/15 focus:border-[#0A6E5A] focus:outline-none font-['Roboto'] text-[0.875rem] text-[#333333]"
                />
              </div>
            </div>

            {/* Date Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="w-[160px]">
                <label className="block text-xs font-semibold text-[#0A6E5A] mb-1.5">From Date</label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#0A6E5A]/40 pointer-events-none" />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#0A6E5A]/15 focus:border-[#0A6E5A] focus:outline-none font-['Roboto'] text-[0.85rem] text-[#333333]"
                  />
                </div>
              </div>

              <div className="w-[160px]">
                <label className="block text-xs font-semibold text-[#0A6E5A] mb-1.5">To Date</label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#0A6E5A]/40 pointer-events-none" />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#0A6E5A]/15 focus:border-[#0A6E5A] focus:outline-none font-['Roboto'] text-[0.85rem] text-[#333333]"
                  />
                </div>
              </div>

              {(fromDate || toDate || searchTerm) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFromDate("");
                    setToDate("");
                  }}
                  className="px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 font-['Roboto'] text-[0.8rem] self-end mt-5"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-[#FFFFFF] border border-[#0A6E5A]/10 overflow-hidden">
            {loading ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="h-10 bg-[#0A6E5A]/5 animate-pulse flex-1" />
                    <div className="h-10 bg-[#0A6E5A]/5 animate-pulse w-32" />
                    <div className="h-10 bg-[#0A6E5A]/5 animate-pulse w-24" />
                  </div>
                ))}
              </div>
            ) : filteredTransfers.length === 0 ? (
              <div className="py-16 text-center text-[#333333]/40">
                <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#0A6E5A]" />
                <p className="font-['Roboto'] text-sm">No transfer logs found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-['Roboto']">
                  <thead>
                    <tr className="bg-[#0A6E5A]/3 border-b border-[#0A6E5A]/10">
                      <th className="px-6 py-4 text-[0.72rem] uppercase tracking-widest text-[#0A6E5A] font-bold">Sl No.</th>
                      <th className="px-6 py-4 text-[0.72rem] uppercase tracking-widest text-[#0A6E5A] font-bold">Date & Time</th>
                      <th className="px-6 py-4 text-[0.72rem] uppercase tracking-widest text-[#0A6E5A] font-bold">E-Pin</th>
                      <th className="px-6 py-4 text-[0.72rem] uppercase tracking-widest text-[#0A6E5A] font-bold">Package</th>
                      <th className="px-6 py-4 text-[0.72rem] uppercase tracking-widest text-[#0A6E5A] font-bold">Sender Details</th>
                      <th className="px-6 py-4 text-[0.72rem] uppercase tracking-widest text-[#0A6E5A] font-bold">Recipient Details</th>
                      <th className="px-6 py-4 text-[0.72rem] uppercase tracking-widest text-[#0A6E5A] font-bold">Status</th>
                      <th className="px-6 py-4 text-[0.72rem] uppercase tracking-widest text-[#0A6E5A] font-bold">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransfers.map((t, idx) => (
                      <tr key={idx} className="border-b border-[#0A6E5A]/5 hover:bg-[#0A6E5A]/2 transition-colors">
                        <td className="px-6 py-4 text-xs font-semibold text-[#333333]/50">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-[#333333] block">
                            {new Date(t.date).toLocaleDateString("en-GB")}
                          </span>
                          <span className="text-[0.7rem] text-[#333333]/50 block mt-0.5">
                            {t.time}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-bold text-[#0A6E5A]">
                          {t.ePin}
                        </td>
                        <td className="px-6 py-4 text-xs text-[#333333]">
                          {t.package}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[#C9A84C] font-semibold">{t.senderId}</span>
                            <button
                              onClick={() => copyText(t.senderId, `sender-${idx}`)}
                              className="text-[#333333]/30 hover:text-[#C9A84C] transition-colors"
                            >
                              {copiedId === `sender-${idx}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                          <span className="text-[0.7rem] text-[#333333]/60 block mt-0.5">{t.senderName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[#C9A84C] font-semibold">{t.recipientId}</span>
                            <button
                              onClick={() => copyText(t.recipientId, `recip-${idx}`)}
                              className="text-[#333333]/30 hover:text-[#C9A84C] transition-colors"
                            >
                              {copiedId === `recip-${idx}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                          <span className="text-[0.7rem] text-[#333333]/60 block mt-0.5">{t.recipientName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-200">
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-[#333333]/70 italic">
                          {t.remark}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Check, X, Shield, Search, RefreshCw, AlertTriangle,
  Loader2, ArrowUpDown, CreditCard, User, Landmark, HelpCircle, Download
} from "lucide-react";
import { toast } from "sonner";

interface PendingBankDetails {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branchName?: string;
  accountType?: string;
}

interface UserApprovalRecord {
  _id: string;
  username: string;
  userId?: string;
  fullName?: string;
  email?: string;
  mobileNo?: string;
  bankDetailsStatus?: string;
  pendingBankAccountDetails?: PendingBankDetails;
  createdAt: string;
}

export default function AdminBankApprovalsPage() {
  const [records, setRecords] = useState<UserApprovalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<UserApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Reject Modal State
  const [rejectUser, setRejectUser] = useState<UserApprovalRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  const fetchPendingApprovals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/bank-approvals");
      if (!res.ok) {
        throw new Error((await res.json()).message ?? "Failed to fetch approvals");
      }
      const json = await res.json();
      setRecords(json.data ?? []);
      setFilteredRecords(json.data ?? []);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong while fetching requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingApprovals();
  }, [fetchPendingApprovals]);

  // Handle Search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredRecords(records);
      return;
    }
    const term = search.toLowerCase();
    const filtered = records.filter(
      (r) =>
        r.fullName?.toLowerCase().includes(term) ||
        r.username.toLowerCase().includes(term) ||
        r.userId?.toLowerCase().includes(term) ||
        r.pendingBankAccountDetails?.bankName?.toLowerCase().includes(term) ||
        r.pendingBankAccountDetails?.accountNumber?.includes(term)
    );
    setFilteredRecords(filtered);
  }, [search, records]);

  // Handle Approve
  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      const res = await fetch("/api/admin/bank-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "approve" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      
      toast.success("Bank details approved successfully!");
      setRecords((prev) => prev.filter((r) => r._id !== userId));
    } catch (e: any) {
      toast.error(e.message ?? "Approval failed.");
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Reject Submit
  const handleRejectSubmit = async () => {
    if (!rejectUser) return;
    if (!rejectReason.trim()) {
      toast.error("Please enter a reason for rejection");
      return;
    }

    setSubmittingReject(true);
    try {
      const res = await fetch("/api/admin/bank-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: rejectUser._id,
          action: "reject",
          rejectReason: rejectReason.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      
      toast.success("Bank details verification request rejected.");
      setRecords((prev) => prev.filter((r) => r._id !== rejectUser._id));
      setRejectUser(null);
      setRejectReason("");
    } catch (e: any) {
      toast.error(e.message ?? "Rejection failed.");
    } finally {
      setSubmittingReject(false);
    }
  };

  const exportToCSV = () => {
    if (filteredRecords.length === 0) {
      toast.error("No records to export.");
      return;
    }
    const headers = [
      "User ID",
      "Username",
      "Full Name",
      "Email",
      "Mobile No",
      "Proposed Account Holder Name",
      "Proposed Bank Name",
      "Proposed Account Number",
      "Proposed IFSC Code",
      "Proposed Branch Name",
      "Proposed Account Type",
      "Submitted At"
    ];

    const rows = filteredRecords.map(r => {
      const pending = r.pendingBankAccountDetails || {};
      return [
        r.userId || r.username,
        r.username,
        r.fullName || "",
        r.email || "",
        r.mobileNo || "",
        pending.accountHolderName || r.fullName || "",
        pending.bankName || "",
        pending.accountNumber || "",
        pending.ifscCode || "",
        pending.branchName || "",
        pending.accountType || "",
        r.createdAt ? new Date(r.createdAt).toISOString() : ""
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bank_detail_approvals_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file exported successfully!");
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-[#F5F7F6] min-h-screen">
      {/* Sticky Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-20 bg-[#FFFFFF]/95 backdrop-blur border-b border-[#0A6E5A]/10 px-6 md:px-8 py-6"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-['Fraunces'] text-[2rem] md:text-[2.5rem] text-[#0A6E5A]">
              Bank Detail Approvals
            </h1>
            <p className="font-['Roboto'] text-[#333333]/60 text-sm mt-1">
              Verify and approve user bank details before they are activated
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] hover:bg-[#B8963B] text-white font-['Roboto'] text-[0.8rem] font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={fetchPendingApprovals}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#0A6E5A]/20 text-[#0A6E5A] font-['Roboto'] text-[0.8rem] font-semibold hover:bg-[#0A6E5A]/5 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="px-6 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats & Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-6">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A6E5A]/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, username, bank account..."
                className="w-full pl-10 pr-4 py-2.5 border border-[#0A6E5A]/15 focus:border-[#0A6E5A] focus:outline-none font-['Roboto'] text-[0.875rem] text-[#333333] placeholder:text-[#333333]/30 bg-[#FFFFFF] transition-colors shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-[0.8rem] font-['Roboto'] font-semibold text-[#0A6E5A]">
              Pending Requests: <span className="bg-[#0A6E5A]/10 px-2.5 py-1 text-[#0A6E5A] rounded-full ml-1">{records.length}</span>
            </div>
          </div>

          {/* Records Grid */}
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-[#0A6E5A] mx-auto" />
              <p className="font-['Roboto'] text-[0.875rem] text-[#333333]/50 mt-4">
                Loading verification requests...
              </p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 p-6 text-center max-w-lg mx-auto my-8">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h3 className="font-['Fraunces'] text-[1.1rem] text-[#333333] mb-1">
                Failed to load requests
              </h3>
              <p className="font-['Roboto'] text-[0.875rem] text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchPendingApprovals}
                className="px-4 py-2 bg-red-600 text-white font-semibold text-xs font-['Roboto'] uppercase tracking-wider"
              >
                Try Again
              </button>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#0A6E5A]/10 py-20 text-center shadow-sm">
              <Landmark className="w-12 h-12 text-[#0A6E5A]/20 mx-auto mb-3" />
              <h3 className="font-['Fraunces'] text-[1.25rem] text-[#0A6E5A]">
                No Pending Approvals
              </h3>
              <p className="font-['Roboto'] text-[0.875rem] text-[#333333]/50 mt-1 max-w-sm mx-auto">
                {search ? "No matching records found for your search term." : "All user bank detail updates have been processed."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredRecords.map((record) => {
                  const pending = record.pendingBankAccountDetails || {};
                  const isProcessing = processingId === record._id;

                  return (
                    <motion.div
                      key={record._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", damping: 20 }}
                      className="bg-[#FFFFFF] border border-[#0A6E5A]/10 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md hover:border-[#0A6E5A]/20 transition-all duration-300"
                    >
                      {/* Top Bar Accent */}
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-[#C9A84C]" />

                      {/* Header */}
                      <div className="px-6 pt-6 pb-4 border-b border-[#0A6E5A]/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#0A6E5A]/8 text-[#0A6E5A] font-['Fraunces'] text-[1rem] font-bold flex items-center justify-center">
                            {(record.fullName || record.username).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-['Roboto'] font-bold text-[0.95rem] text-[#333333]">
                              {record.fullName || "N/A"}
                            </h3>
                            <p className="font-['Roboto'] text-[0.75rem] text-[#C9A84C]">
                              ID: {record.userId || record.username} (@{record.username})
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Bank Details Table */}
                      <div className="px-6 py-4 flex-grow space-y-3">
                        <h4 className="font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#0A6E5A] font-bold flex items-center gap-2 mb-2">
                          <Landmark className="w-3.5 h-3.5 text-[#C9A84C]" /> Proposed Bank Details
                        </h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm font-['Roboto']">
                          <div>
                            <span className="text-[#333333]/40 text-[0.7rem] uppercase tracking-wider block">
                              Account Holder
                            </span>
                            <span className="font-medium text-[#333333] break-all">
                              {pending.accountHolderName || record.fullName || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#333333]/40 text-[0.7rem] uppercase tracking-wider block">
                              Bank Name
                            </span>
                            <span className="font-medium text-[#333333]">
                              {pending.bankName || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#333333]/40 text-[0.7rem] uppercase tracking-wider block">
                              Account Number
                            </span>
                            <span className="font-bold text-[#0A6E5A] break-all font-mono">
                              {pending.accountNumber || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#333333]/40 text-[0.7rem] uppercase tracking-wider block">
                              IFSC Code
                            </span>
                            <span className="font-bold text-[#333333] font-mono">
                              {pending.ifscCode || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#333333]/40 text-[0.7rem] uppercase tracking-wider block">
                              Branch
                            </span>
                            <span className="font-medium text-[#333333]">
                              {pending.branchName || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#333333]/40 text-[0.7rem] uppercase tracking-wider block">
                              Account Type
                            </span>
                            <span className="font-medium text-[#333333]">
                              {pending.accountType || "—"}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#0A6E5A]/5 text-[0.7rem] text-[#333333]/40 flex items-center justify-between">
                          <span>Submitted on: {formatDate(record.createdAt)}</span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="px-6 py-4 bg-[#F8FAF9] border-t border-[#0A6E5A]/5 flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => setRejectUser(record)}
                          disabled={isProcessing}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 font-['Roboto'] font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(record._id)}
                          disabled={isProcessing}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0A6E5A] hover:bg-[#0A6E5A]/90 text-white font-['Roboto'] font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 min-w-[100px]"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Approve
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setRejectUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#FFFFFF] w-full max-w-md shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-red-600 px-6 py-5 flex items-center justify-between text-white">
                <div>
                  <h3 className="font-['Fraunces'] text-[1.25rem]">Reject Bank Details</h3>
                  <p className="text-white/60 text-xs font-['Roboto'] mt-0.5">
                    User: {rejectUser.fullName || rejectUser.username} (@{rejectUser.username})
                  </p>
                </div>
                <button
                  onClick={() => setRejectUser(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333333]/60 mb-2">
                    Reason for Rejection *
                  </label>
                  <textarea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason (e.g., IFSC code is incorrect, Name mismatch on account, Account number missing digits)..."
                    className="w-full px-3 py-2 border border-red-200 focus:border-red-500 focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] text-[#333333] placeholder:text-[#333333]/30 transition-colors"
                  />
                </div>
              </div>

              <div className="px-6 pb-6 flex gap-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setRejectUser(null)}
                  className="flex-1 py-2.5 border border-[#333333]/20 font-['Roboto'] text-[0.875rem] text-[#333333]/60 hover:bg-[#333333]/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={submittingReject}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-['Roboto'] font-bold text-[0.875rem] uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  {submittingReject ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  Reject Request
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

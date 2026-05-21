"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Search, User, Key, CheckCircle, AlertCircle,
  Loader2, Copy, Check, X, Shield, ArrowRight,
  Eye, RefreshCw, XCircle, ShoppingCart, IndianRupee
} from "lucide-react";

interface UserDetails {
  fullName: string;
  email: string;
  mobileNo: string;
  userId: string;
}

interface PinRequest {
  _id: string;
  userId: string;
  transactionId: string;
  transactionDetails?: string;
  quantity: number;
  amount: number;
  screenshotUrl?: string;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  user: UserDetails | null;
}

export default function PinRequestsPage() {
  const [requests, setRequests] = useState<PinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Modals & Actions
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{
    type: "approve" | "reject";
    req: PinRequest;
  } | null>(null);
  
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/pinrequests");
      const json = await res.json();
      if (res.ok) {
        setRequests(json.data || []);
      } else {
        showToast(json.message || "Failed to load requests.", "error");
      }
    } catch (err) {
      showToast("Network error. Failed to load pin requests.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAction = async () => {
    if (!actionModal) return;
    const { type, req } = actionModal;
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/pinrequests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: req._id,
          action: type === "approve" ? "approve" : "reject",
          remark,
        }),
      });
      const json = await res.json();

      if (res.ok) {
        showToast(
          type === "approve"
            ? `Approved successfully! Generated and credited ${req.quantity} pin(s).`
            : "Request rejected & cancelled.",
          "success"
        );
        setActionModal(null);
        setRemark("");
        fetchRequests(); // reload list
      } else {
        showToast(json.message || "Request failed.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Something went wrong.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculation
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const completedCount = requests.filter((r) => r.status === "completed").length;
  const totalPinsCount = requests
    .filter((r) => r.status === "completed")
    .reduce((acc, curr) => acc + (curr.quantity || 0), 0);

  // Filtered requests
  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      r.userId.toLowerCase().includes(searchLower) ||
      (r.transactionId || "").toLowerCase().includes(searchLower) ||
      (r.transactionDetails || "").toLowerCase().includes(searchLower) ||
      (r.user?.fullName || "").toLowerCase().includes(searchLower) ||
      (r.user?.mobileNo || "").toLowerCase().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="bg-[#F5F7F6] min-h-screen pb-12">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 bg-[#FFFFFF]/95 backdrop-blur border-b border-[#0A6E5A]/10 px-6 md:px-8 py-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['Fraunces'] text-[2rem] md:text-[2.5rem] text-[#0A6E5A]">PIN Requests</h1>
            <p className="font-['Roboto'] text-[#333333]/60 text-sm mt-1">Review payments and distribute E-Pins to members</p>
          </div>
          <button 
            onClick={fetchRequests} 
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
          
          {/* Stats Section */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Requests", val: totalCount, icon: FileText, color: "text-[#0A6E5A]", bg: "bg-[#0A6E5A]/5" },
              { label: "Pending Verification", val: pendingCount, icon: Loader2, color: "text-amber-500", bg: "bg-amber-50" },
              { label: "Approved (Completed)", val: completedCount, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
              { label: "Total E-Pins Issued", val: totalPinsCount, icon: Key, color: "text-[#C9A84C]", bg: "bg-[#C9A84C]/5" }
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
                  <st.icon className={`w-5 h-5 ${st.color} ${st.label.includes("Pending") && loading ? 'animate-spin' : ''}`} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filtering and Actions Panel */}
          <div className="bg-[#FFFFFF] border border-[#0A6E5A]/10 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A6E5A]/40" />
              <input
                type="text"
                placeholder="Search by Member ID, name, phone or Txn ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[#0A6E5A]/15 focus:border-[#0A6E5A] focus:outline-none font-['Roboto'] text-[0.875rem] text-[#333333]"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 self-start md:self-auto">
              {[
                { label: "All Statuses", val: "all" },
                { label: "Pending", val: "pending" },
                { label: "Completed", val: "completed" },
                { label: "Cancelled", val: "cancelled" }
              ].map((btn) => (
                <button
                  key={btn.val}
                  onClick={() => setStatusFilter(btn.val)}
                  className={`px-4 py-2 text-[0.8rem] font-['Roboto'] transition-all ${
                    statusFilter === btn.val
                      ? "bg-[#0A6E5A] text-[#FFFFFF]"
                      : "border border-[#0A6E5A]/15 text-[#333333]/70 hover:bg-[#0A6E5A]/5"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-[#FFFFFF] border border-[#0A6E5A]/10 overflow-hidden">
            {loading ? (
              /* Skeleton Loader */
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="h-10 bg-[#0A6E5A]/5 animate-pulse flex-1" />
                    <div className="h-10 bg-[#0A6E5A]/5 animate-pulse w-32" />
                    <div className="h-10 bg-[#0A6E5A]/5 animate-pulse w-24" />
                  </div>
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-16 text-center text-[#333333]/40">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#0A6E5A]" />
                <p className="font-['Roboto'] text-sm">No pin requests match your current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-['Roboto']">
                  <thead>
                    <tr className="bg-[#0A6E5A]/3 border-b border-[#0A6E5A]/10">
                      <th className="px-6 py-4 text-[0.72rem] uppercase tracking-widest text-[#0A6E5A] font-bold">Request Info</th>
                      <th className="px-6 py-4 text-[0.72rem] uppercase tracking-widest text-[#0A6E5A] font-bold">Member Details</th>
                      <th className="px-6 py-4 text-[0.72rem] uppercase tracking-widest text-[#0A6E5A] font-bold text-center">E-Pins</th>
                      <th className="px-6 py-4 text-[0.72rem] uppercase tracking-widest text-[#0A6E5A] font-bold">Amount</th>
                      <th className="px-6 py-4 text-[0.72rem] uppercase tracking-widest text-[#0A6E5A] font-bold">Transaction / Screenshot</th>
                      <th className="px-6 py-4 text-[0.72rem] uppercase tracking-widest text-[#0A6E5A] font-bold">Status</th>
                      <th className="px-6 py-4 text-[0.72rem] uppercase tracking-widest text-[#0A6E5A] font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((req) => (
                      <tr key={req._id} className="border-b border-[#0A6E5A]/5 hover:bg-[#0A6E5A]/2 transition-colors">
                        {/* Request Info */}
                        <td className="px-6 py-4">
                          <span className="font-medium text-xs text-[#0A6E5A] block">
                            REQ-{req._id.slice(-8).toUpperCase()}
                          </span>
                          <span className="text-[0.7rem] text-[#333333]/50 block mt-1">
                            {new Date(req.createdAt).toLocaleString("en-IN")}
                          </span>
                        </td>
                        {/* Member Details */}
                        <td className="px-6 py-4">
                          {req.user ? (
                            <div>
                              <p className="font-semibold text-sm text-[#333333]">{req.user.fullName}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-[#C9A84C] font-semibold">{req.user.userId}</span>
                                <button 
                                  onClick={() => copyText(req.user!.userId, req._id)} 
                                  className="text-[#333333]/30 hover:text-[#C9A84C] transition-colors"
                                >
                                  {copiedId === req._id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                              <span className="text-[0.7rem] text-[#333333]/60 block mt-0.5">{req.user.mobileNo}</span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-xs text-[#C9A84C] font-semibold block">{req.userId}</span>
                              <span className="text-[0.7rem] text-red-400 block mt-0.5">User info missing</span>
                            </div>
                          )}
                        </td>
                        {/* E-Pins (Quantity) */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#0A6E5A]/5 text-[#0A6E5A] font-bold text-sm">
                            {req.quantity}
                          </span>
                        </td>
                        {/* Amount */}
                        <td className="px-6 py-4">
                          <span className="font-semibold text-[#333333] flex items-center gap-0.5 text-sm">
                            <IndianRupee className="w-3.5 h-3.5 inline text-[#333333]/60" />
                            {(req.amount || (req.quantity * 1299)).toLocaleString("en-IN")}
                          </span>
                        </td>
                        {/* Transaction Details / Screenshot */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-xs text-[#333333] font-medium break-all">
                              Txn ID: {req.transactionId || req.transactionDetails || "N/A"}
                            </p>
                            {req.screenshotUrl ? (
                              <button
                                onClick={() => setPreviewImage(req.screenshotUrl!)}
                                className="inline-flex items-center gap-1 text-[0.7rem] text-[#0A6E5A] hover:underline font-semibold"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View Payment Proof
                              </button>
                            ) : (
                              <span className="text-[0.7rem] text-[#333333]/30 italic">No proof uploaded</span>
                            )}
                          </div>
                        </td>
                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold uppercase tracking-wider ${
                              req.status === "completed"
                                ? "bg-green-50 text-green-600 border border-green-200"
                                : req.status === "cancelled"
                                ? "bg-red-50 text-red-500 border border-red-150"
                                : "bg-amber-50 text-amber-500 border border-amber-200"
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          {req.status === "pending" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setActionModal({ type: "approve", req })}
                                className="px-3 py-1.5 bg-[#0A6E5A] hover:bg-[#0A6E5A]/90 text-[#FFFFFF] text-xs font-semibold tracking-wide transition-all"
                              >
                                Approve & Send
                              </button>
                              <button
                                onClick={() => setActionModal({ type: "reject", req })}
                                className="px-3 py-1.5 border border-red-200 hover:border-red-300 text-red-500 hover:bg-red-50 text-xs font-semibold tracking-wide transition-all"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-[#333333]/30">Processed</span>
                          )}
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

      {/* ACTION DIALOG MODAL (APPROVE/REJECT) */}
      <AnimatePresence>
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setActionModal(null)}
              className="absolute inset-0 bg-[#000000]/60 backdrop-blur-sm"
            />
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FFFFFF] border border-[#0A6E5A]/10 w-full max-w-md relative z-10 overflow-hidden shadow-2xl p-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#0A6E5A]/8">
                <h3 className="font-['Fraunces'] text-[1.25rem] text-[#0A6E5A] flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#C9A84C]" />
                  Confirm Request {actionModal.type === "approve" ? "Approval" : "Rejection"}
                </h3>
                <button
                  disabled={submitting}
                  onClick={() => setActionModal(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#333333]/5 text-[#333333]/50 hover:bg-red-50 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 font-['Roboto']">
                <p className="text-sm text-[#333333]/70">
                  Are you sure you want to <span className="font-semibold">{actionModal.type}</span> this request?
                </p>

                <div className="bg-[#0A6E5A]/4 border border-[#0A6E5A]/10 p-3 text-xs space-y-1.5">
                  <p><strong className="text-[#0A6E5A]">Member:</strong> {actionModal.req.user?.fullName || actionModal.req.userId} ({actionModal.req.user?.userId || actionModal.req.userId})</p>
                  <p><strong className="text-[#0A6E5A]">EPin Quantity:</strong> {actionModal.req.quantity} pin(s)</p>
                  <p><strong className="text-[#0A6E5A]">Amount:</strong> ₹{(actionModal.req.amount || (actionModal.req.quantity * 1299)).toLocaleString("en-IN")}</p>
                  <p><strong className="text-[#0A6E5A]">Transaction ID:</strong> {actionModal.req.transactionId || actionModal.req.transactionDetails}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase tracking-widest text-[#333333]/40">
                    Remark (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder={
                      actionModal.type === "approve"
                        ? "e.g. Verified. EPins credited successfully."
                        : "e.g. Invalid transaction proof. Please resubmit."
                    }
                    className="w-full border border-[#0A6E5A]/15 focus:border-[#0A6E5A] focus:outline-none p-2.5 text-xs bg-[#F8FAF9]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-[#0A6E5A]/8">
                <button
                  disabled={submitting}
                  onClick={handleAction}
                  className={`flex-1 py-3 text-xs font-semibold tracking-wide text-[#FFFFFF] flex items-center justify-center gap-2 ${
                    actionModal.type === "approve" ? "bg-[#0A6E5A] hover:bg-[#0A6E5A]/95" : "bg-red-500 hover:bg-red-600"
                  } disabled:opacity-50`}
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                  ) : (
                    <>Confirm {actionModal.type === "approve" ? "Approve" : "Reject"}</>
                  )}
                </button>
                <button
                  disabled={submitting}
                  onClick={() => setActionModal(null)}
                  className="flex-1 py-3 border border-[#0A6E5A]/15 hover:bg-[#0A6E5A]/5 text-[#333333]/70 text-xs font-semibold tracking-wide transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PAYMENT PROOF PREVIEW MODAL */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewImage(null)}
              className="absolute inset-0 bg-[#000000]/80 backdrop-blur-md"
            />
            {/* Image Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FFFFFF] border border-[#0A6E5A]/10 max-w-2xl max-h-[85vh] w-full relative z-10 overflow-hidden shadow-2xl p-2"
            >
              <div className="flex justify-end p-2">
                <button
                  onClick={() => setPreviewImage(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#333333]/5 text-[#333333]/50 hover:bg-red-50 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-auto max-h-[75vh] flex justify-center items-center bg-[#F5F7F6]">
                <img
                  src={previewImage}
                  alt="Payment Receipt Screenshot"
                  className="max-w-full h-auto object-contain"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST ALERTS */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className={`fixed bottom-6 left-1/2 z-50 flex items-center gap-3 px-5 py-3 shadow-xl font-['Roboto'] text-[0.875rem] ${
              toast.type === "success" ? "bg-[#0A6E5A] text-[#FFFFFF]" : "bg-red-500 text-[#FFFFFF]"
            }`}
          >
            {toast.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

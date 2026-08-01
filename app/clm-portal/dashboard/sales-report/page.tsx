"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Download,
  IndianRupee,
  ShoppingBag,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  Loader2,
  Calendar as CalendarIcon,
} from "lucide-react";

// Types
interface SalesRow {
  date: string;
  name: string;
  userId: string;
  location: string;
  amount: number;
  status: string;
  type: string;
}

interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  dateRange: {
    from: string;
    to: string;
  };
}

interface SalesData {
  success: boolean;
  summary: SalesSummary;
  rows: SalesRow[];
}

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#FFFFFF] border border-[#0A6E5A]/10 rounded-sm shadow-sm ${className}`}>
    {children}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { icon: React.ElementType; cls: string }> = {
    Completed: { icon: CheckCircle, cls: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    Confirmed: { icon: CheckCircle, cls: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    Pending: { icon: Clock, cls: "text-amber-600 bg-amber-50 border-amber-100" },
    Cancelled: { icon: XCircle, cls: "text-rose-500 bg-rose-50 border-rose-100" },
    Rejected: { icon: XCircle, cls: "text-rose-500 bg-rose-50 border-rose-100" },
  };
  const { icon: Icon, cls } = map[status] ?? map.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-[0.72rem] font-['Roboto'] font-semibold uppercase tracking-wide ${cls}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
};

export default function SalesReportPage() {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Default dates: start of current month to today
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [fromDate, setFromDate] = useState(startOfMonth.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today.toISOString().split('T')[0]);
  
  const [searchTerm, setSearchTerm] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sales-report?from=${fromDate}&to=${toDate}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        console.error("Failed to fetch report", json.error);
      }
    } catch (err) {
      console.error("Error fetching report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [fromDate, toDate]);

  const handleDownloadExcel = () => {
    if (!data?.rows || data.rows.length === 0) return;
    
    // Create CSV headers
    const headers = ["Date", "Name", "Client User ID", "Location", "Amount", "Status", "Type"];
    
    // Create CSV rows
    const csvRows = data.rows.map(row => {
      // Escape fields with quotes
      const escape = (field: any) => `"${String(field).replace(/"/g, '""')}"`;
      return [
        escape(row.date),
        escape(row.name),
        escape(row.userId),
        escape(row.location),
        escape(row.amount),
        escape(row.status),
        escape(row.type)
      ].join(",");
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    
    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Sales_Report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRows = data?.rows.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.type.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-[#F5F7F6] p-6 lg:p-8 font-['Roboto']">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[0.75rem] uppercase tracking-widest text-[#C9A84C] font-semibold mb-1">Analytics</p>
          <h1 className="font-['Fraunces'] text-[1.875rem] md:text-[2.25rem] text-[#0A6E5A] leading-tight">
            Total Sales Report
          </h1>
        </motion.div>

        {/* Date Filter & Export */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-sm border border-[#0A6E5A]/15 shadow-sm">
            <CalendarIcon className="w-4 h-4 text-[#0A6E5A]/60" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-[0.85rem] text-[#333] outline-none bg-transparent"
            />
            <span className="text-[0.85rem] text-[#333]/50">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-[0.85rem] text-[#333] outline-none bg-transparent"
            />
          </div>
          
          <button
            onClick={handleDownloadExcel}
            disabled={loading || !data?.rows.length}
            className="flex items-center gap-2 px-4 py-2 bg-[#0A6E5A] text-white rounded-sm text-[0.85rem] font-semibold hover:bg-[#0A6E5A]/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </motion.div>
      </div>

      {/* ── Summary Cards ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
      >
        <Card className="p-4 md:p-5">
          <div className="flex items-start justify-between mb-2">
            <p className="text-[0.7rem] uppercase tracking-wider text-[#333333]/60 font-semibold">Total Revenue</p>
            <div className="w-7 h-7 rounded bg-[#C9A84C]/10 flex items-center justify-center">
              <IndianRupee className="w-3.5 h-3.5 text-[#C9A84C]" />
            </div>
          </div>
          <p className="font-['Fraunces'] text-[1.5rem] md:text-[1.75rem] text-[#0A6E5A]">
            ₹{loading ? "..." : (data?.summary?.totalRevenue || 0).toLocaleString("en-IN")}
          </p>
        </Card>
        
        <Card className="p-4 md:p-5">
          <div className="flex items-start justify-between mb-2">
            <p className="text-[0.7rem] uppercase tracking-wider text-[#333333]/60 font-semibold">Total Orders</p>
            <div className="w-7 h-7 rounded bg-[#0A6E5A]/10 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-[#0A6E5A]" />
            </div>
          </div>
          <p className="font-['Fraunces'] text-[1.5rem] md:text-[1.75rem] text-[#0A6E5A]">
            {loading ? "..." : (data?.summary?.totalOrders || 0)}
          </p>
        </Card>

        <Card className="p-4 md:p-5 border-emerald-100">
          <div className="flex items-start justify-between mb-2">
            <p className="text-[0.7rem] uppercase tracking-wider text-[#333333]/60 font-semibold">Confirmed</p>
            <div className="w-7 h-7 rounded bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <p className="font-['Fraunces'] text-[1.5rem] md:text-[1.75rem] text-emerald-700">
            {loading ? "..." : (data?.summary?.confirmed || 0)}
          </p>
        </Card>

        <Card className="p-4 md:p-5 border-amber-100">
          <div className="flex items-start justify-between mb-2">
            <p className="text-[0.7rem] uppercase tracking-wider text-[#333333]/60 font-semibold">Pending</p>
            <div className="w-7 h-7 rounded bg-amber-50 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>
          <p className="font-['Fraunces'] text-[1.5rem] md:text-[1.75rem] text-amber-700">
            {loading ? "..." : (data?.summary?.pending || 0)}
          </p>
        </Card>

        <Card className="p-4 md:p-5 border-rose-100">
          <div className="flex items-start justify-between mb-2">
            <p className="text-[0.7rem] uppercase tracking-wider text-[#333333]/60 font-semibold">Cancelled</p>
            <div className="w-7 h-7 rounded bg-rose-50 flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
            </div>
          </div>
          <p className="font-['Fraunces'] text-[1.5rem] md:text-[1.75rem] text-rose-600">
            {loading ? "..." : (data?.summary?.cancelled || 0)}
          </p>
        </Card>
      </motion.div>

      {/* ── Detailed Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card className="flex flex-col min-h-[500px]">
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-[#0A6E5A]/10">
            <h3 className="font-['Fraunces'] text-[1.1rem] text-[#0A6E5A]">Detailed Report</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333]/40" />
              <input
                type="text"
                placeholder="Search name, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-[0.85rem] bg-[#F5F7F6] border border-[#0A6E5A]/15 rounded-sm outline-none focus:border-[#0A6E5A]/50 transition-colors"
              />
            </div>
          </div>

          {/* Table Area */}
          <div className="flex-1 overflow-x-auto relative">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                <Loader2 className="w-8 h-8 text-[#0A6E5A] animate-spin mb-3" />
                <p className="text-[#333]/60 text-sm font-medium">Generating Report...</p>
              </div>
            ) : null}
            
            <table className="w-full text-[0.85rem] min-w-[700px]">
              <thead className="bg-[#F9FAFA] sticky top-0 z-0">
                <tr className="border-b border-[#0A6E5A]/10">
                  {["Date", "Name", "Client User ID", "Location", "Type", "Amount", "Status"].map((h) => (
                    <th key={h} className="px-5 py-4 text-left font-semibold text-[0.75rem] uppercase tracking-wider text-[#333333]/60">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0A6E5A]/5">
                {!loading && filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-[#333]/50">
                      No sales found for this date range.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, i) => (
                    <tr key={i} className="hover:bg-[#0A6E5A]/[0.02] transition-colors">
                      <td className="px-5 py-3.5 text-[#333]/80 whitespace-nowrap">{row.date}</td>
                      <td className="px-5 py-3.5 font-medium text-[#0A6E5A] whitespace-nowrap">{row.name}</td>
                      <td className="px-5 py-3.5 text-[#333]/70 font-mono text-[0.8rem] whitespace-nowrap">{row.userId}</td>
                      <td className="px-5 py-3.5 text-[#333]/70">{row.location}</td>
                      <td className="px-5 py-3.5 text-[#333]/60 text-[0.8rem] whitespace-nowrap">{row.type}</td>
                      <td className="px-5 py-3.5 font-semibold text-[#333]">₹{row.amount.toLocaleString("en-IN")}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

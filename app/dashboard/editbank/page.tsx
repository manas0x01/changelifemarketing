"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const accountTypes = ["-- Select --", "Saving", "Current", "Salary", "NRI", "Joint"];

export default function EditBankPage() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bankData, setBankData] = useState({
    bankName: "",
    ifsc: "",
    accountNo: "",
    branchName: "",
    accountType: "-- Select --",
    panNo: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    const fetchBankDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/user/update-profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!response.ok) {
          let errorData;
          const contentType = response.headers.get("content-type");
          
          try {
            if (contentType?.includes("application/json")) {
              errorData = await response.json();
            } else {
              const text = await response.text();
              errorData = { error: text?.substring(0, 200) || "Unknown error" };
            }
          } catch (parseErr) {
            errorData = { error: "Failed to parse server response" };
          }
          if (response.status === 401) {
            router.push("/auth/login");
            return;
          }
          
          throw new Error(errorData.error || "Failed to fetch bank details");
        }
        const data = await response.json();
        if (data.data) {
          setBankData({
            bankName: data.data.bankName || "",
            ifsc: data.data.ifsc || "",
            accountNo: data.data.accountNo || "",
            branchName: data.data.branchName || "",
            accountType: data.data.accountType || "-- Select --",
            panNo: data.data.panNo || "",
          });
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchBankDetails();
  }, [router]);
  const handleInputChange = (field: keyof typeof bankData, value: string) => {
    setBankData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleUpdate = async () => {
    try {
      setSaving(true);
      setError(null);
      // Validate account type is not default placeholder
      if (bankData.accountType === "-- Select --") {
        setError("Please select an account type");
        setSaving(false);
        return;
      }
      // Validate IFSC code if provided
      if (bankData.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankData.ifsc)) {
        setError("Invalid IFSC code format (e.g., CBIN0284349)");
        setSaving(false);
        return;
      }
      // Validate PAN if provided
      if (bankData.panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(bankData.panNo)) {
        setError("Invalid PAN number format (e.g., ABCDE1234F)");
        setSaving(false);
        return;
      }
      // Convert "-- Select --" to empty string for accountType
      const submitData = {
        ...bankData,
        accountType: bankData.accountType === "-- Select --" ? "" : bankData.accountType
      };
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
        credentials: "include",
      });
      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get("content-type");
        try {
          if (contentType?.includes("application/json")) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            errorData = { error: text?.substring(0, 200) || "Unknown error" };
          }
        } catch (parseErr) {
          errorData = { error: "Failed to parse server response" };
        }
        throw new Error(errorData.error || "Failed to update bank details");
      }
      const data = await response.json();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .eb-root {
          font-family: 'Poppins', sans-serif;
          background: #f0f2f5;
          min-height: 100vh;
        }
        /* ── GREEN BAR ── */
        .green-bar { height: 8px; background: linear-gradient(90deg, #00c853, #1de9b6); }

        /* ── BREADCRUMB ROW ── */
        .breadcrumb-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .breadcrumb-left {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: #555;
        }
        .breadcrumb-left a { color: #555; text-decoration: none; }
        .breadcrumb-left a:hover { text-decoration: underline; }
        .breadcrumb-left .sep { color: #999; }
        .breadcrumb-left .current { color: #333; font-weight: 500; }

        .return-btn {
          background: #546e7a;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 9px 20px;
          font-size: 13px;
          font-weight: 500;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: background 0.18s;
          white-space: nowrap;
        }
        .return-btn:hover { background: #455a64; }
        /* ── PAGE BODY ── */
        .page-body { padding: 0 20px 30px; }

        /* ── SECTION CARD ── */
        .section-card {
          background: #fff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }
        .section-header {
          background: linear-gradient(90deg, #26a69a, #1de9b6);
          padding: 13px 20px;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        /* ── FORM BODY ── */
        .form-body { padding: 24px 20px 20px; }

        /* 2-col grid */
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px 28px;
          margin-bottom: 28px;
        }
        @media (max-width: 680px) {
          .form-grid { grid-template-columns: 1fr; }
        }

        .form-group { display: flex; flex-direction: column; gap: 7px; }

        .form-label {
          font-size: 13.5px;
          font-weight: 400;
          color: #333;
        }

        .form-input, .form-select {
          width: 100%;
          border: 1px solid #d0d0d0;
          border-radius: 5px;
          padding: 10px 13px;
          font-size: 13.5px;
          font-family: 'Poppins', sans-serif;
          color: #333;
          background: #fff;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .form-input:focus, .form-select:focus {
          border-color: #26a69a;
          box-shadow: 0 0 0 2px rgba(38,166,154,0.12);
        }
        .form-select {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
          cursor: pointer;
        }

        /* ── UPDATE BUTTON ── */
        .update-wrap {
          display: flex;
          justify-content: center;
          padding-top: 4px;
        }
        .update-btn {
          background: #1976d2;
          color: #fff;
          border: none;
          border-radius: 7px;
          padding: 11px 36px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          letter-spacing: 0.3px;
          transition: background 0.18s, transform 0.15s;
        }
        .update-btn:hover { background: #1565c0; transform: translateY(-1px); }
        .update-btn:active { transform: scale(0.98); }

        /* ── TOAST ── */
        .toast {
          position: fixed;
          bottom: 28px; right: 28px;
          background: #26a69a;
          color: #fff;
          padding: 12px 22px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 500;
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
          z-index: 999;
          animation: fadeUp 0.3s ease;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── SKELETON LOADER ── */
        .skeleton-group { display: flex; flex-direction: column; gap: 7px; }
        .skeleton-label {
          height: 12px;
          width: 90px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: 3px;
          animation: shimmer 2s infinite;
        }
        .skeleton-input {
          height: 40px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: 5px;
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="eb-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* Navbar Component */}
        <Navbar
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          setActivePage={() => {}}
        />
        {/* Green bar */}
        <div className="green-bar" />
        {/* ── BREADCRUMB ── */}
        <div className="breadcrumb-row">
          <div className="breadcrumb-left">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#555">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <Link href="/dashboard">Home</Link>
            <span className="sep">/</span>
            <Link href="/dashboard/profile">Profile</Link>
            <span className="sep">/</span>
            <span className="current">Edit Bank</span>
          </div>
          <Link href="/dashboard/profile" className="return-btn">Return to Profile</Link>
        </div>
        {/* ── MAIN CARD ── */}
        <div className="page-body">
          <div className="section-card">
            <div className="section-header">Edit Bank Details</div>
            <div className="form-body">
              {loading ? (
                <>
                  {/* Skeleton Row 1 */}
                  <div className="form-grid">
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "80px" }} />
                      <div className="skeleton-input" />
                    </div>
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "90px" }} />
                      <div className="skeleton-input" />
                    </div>
                  </div>

                  {/* Skeleton Row 2 */}
                  <div className="form-grid">
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "100px" }} />
                      <div className="skeleton-input" />
                    </div>
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "80px" }} />
                      <div className="skeleton-input" />
                    </div>
                  </div>

                  {/* Skeleton Row 3 */}
                  <div className="form-grid">
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "110px" }} />
                      <div className="skeleton-input" />
                    </div>
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "70px" }} />
                      <div className="skeleton-input" />
                    </div>
                  </div>

                  {/* Skeleton Button */}
                  <div className="update-wrap">
                    <div className="skeleton-input" style={{ width: "200px", height: "42px" }} />
                  </div>
                </>
              ) : (
                <>
                  {error && (
                    <div style={{
                      background: "#ffebee",
                      color: "#c62828",
                      padding: "12px 16px",
                      borderRadius: "6px",
                      marginBottom: "20px",
                      fontSize: "13px",
                      border: "1px solid #ef5350"
                    }}>
                      ❌ {error}
                    </div>
                  )}

                  <div className="form-grid">

                    {/* Bank Name */}
                    <div className="form-group">
                      <label className="form-label">Bank Name :</label>
                      <input
                        className="form-input"
                        type="text"
                        suppressHydrationWarning
                        value={bankData.bankName}
                        onChange={(e) => handleInputChange("bankName", e.target.value)}
                        placeholder="Enter bank name"
                      />
                    </div>

                    {/* IFSC Code */}
                    <div className="form-group">
                      <label className="form-label">IFSC Code :</label>
                      <input
                        className="form-input"
                        type="text"
                        suppressHydrationWarning
                        value={bankData.ifsc}
                        onChange={(e) => handleInputChange("ifsc", e.target.value.toUpperCase())}
                        placeholder="e.g., CBIN0284349"
                      />
                    </div>

                    {/* Account No. */}
                    <div className="form-group">
                      <label className="form-label">Account No. :</label>
                      <input
                        className="form-input"
                        type="text"
                        suppressHydrationWarning
                        value={bankData.accountNo}
                        onChange={(e) => handleInputChange("accountNo", e.target.value)}
                        placeholder="Enter account number"
                      />
                    </div>

                    {/* Branch */}
                    <div className="form-group">
                      <label className="form-label">Branch :</label>
                      <input
                        className="form-input"
                        type="text"
                        suppressHydrationWarning
                        value={bankData.branchName}
                        onChange={(e) => handleInputChange("branchName", e.target.value)}
                        placeholder="Enter branch name"
                      />
                    </div>

                    {/* Account Type */}
                    <div className="form-group">
                      <label className="form-label">Account Type :</label>
                      <select
                        className="form-select"
                        value={bankData.accountType}
                        onChange={(e) => handleInputChange("accountType", e.target.value)}
                      >
                        {accountTypes.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* PAN */}
                    <div className="form-group">
                      <label className="form-label">PAN :</label>
                      <input
                        className="form-input"
                        type="text"
                        suppressHydrationWarning
                        value={bankData.panNo}
                        onChange={(e) => handleInputChange("panNo", e.target.value.toUpperCase())}
                        placeholder="e.g., ABCDE1234F"
                      />
                    </div>

                  </div>

                  {/* Update Button */}
                  <div className="update-wrap">
                    <button
                      className="update-btn"
                      onClick={handleUpdate}
                      disabled={saving}
                      style={{
                        opacity: saving ? 0.7 : 1,
                        cursor: saving ? "not-allowed" : "pointer"
                      }}
                    >
                      {saving ? "Saving..." : "Update Bank Details"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Toast */}
        {success && (
          <div className="toast">✓ Bank details updated successfully!</div>
        )}

      </div>
    </>
  );
}
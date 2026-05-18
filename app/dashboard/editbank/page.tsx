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
  const [bankStatus, setBankStatus] = useState("none");
  const [rejectReason, setRejectReason] = useState("");
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
          setBankStatus(data.data.bankDetailsStatus || "none");
          setRejectReason(data.data.bankDetailsRejectReason || "");
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
      
      setSuccess(true);
      setBankStatus("pending"); // Lock immediately on success
      setRejectReason("");
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const isLocked = bankStatus === "pending" || bankStatus === "approved";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .eb-root {
          font-family: 'Poppins', sans-serif;
          background: #1a0533;
          background-image:
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(168,85,247,0.2) 0%, transparent 65%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,215,0,0.12) 0%, transparent 65%);
          min-height: 100vh;
          color: #fff;
        }

        /* GOLD BAR */
        .gold-bar { height:4px; background:linear-gradient(90deg, #FFD700, #f0a500); }

        /* BREADCRUMB ROW */
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
          font-size: 13px; color: rgba(255,215,0,0.7);
        }
        .breadcrumb-left a { color: rgba(255,215,0,0.7); text-decoration: none; }
        .breadcrumb-left a:hover { color:#FFD700; text-decoration: underline; }
        .breadcrumb-left .sep { color: rgba(255,215,0,0.4); }
        .breadcrumb-left .current { color: #FFD700; font-weight: 700; }

        .return-btn {
          background: rgba(255,215,0,0.1);
          color: #FFD700;
          border: 1.5px solid rgba(255,215,0,0.25);
          border-radius: 6px;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          text-decoration: none;
        }
        .return-btn:hover { background: rgba(255,215,0,0.25); border-color:#FFD700; transform: translateY(-1px); }

        /* PAGE BODY */
        .page-body { padding: 0 20px 30px; }

        /* CARD */
        .section-card {
          background: linear-gradient(135deg, #1d033a 0%, #110122 100%);
          border: 1.5px solid rgba(255,215,0,0.22);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0,0,0,0.65), 0 0 20px rgba(168,85,247,0.15);
        }
        .section-header {
          background: linear-gradient(90deg, #1d033a, #110122);
          border-bottom: 1.5px solid rgba(255,215,0,0.22);
          padding: 16px 20px;
          font-size: 14px;
          font-weight: 800;
          color: #FFD700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          text-shadow: 0 0 8px rgba(255,215,0,0.3);
        }

        /* FORM BODY */
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
          font-weight: 600;
          color: rgba(255,215,0,0.85);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input, .form-select {
          width: 100%;
          border: 1.5px solid rgba(255,215,0,0.25);
          border-radius: 6px;
          padding: 10px 13px;
          font-size: 13.5px;
          font-family: 'Poppins', sans-serif;
          color: #fff;
          background: rgba(0,0,0,0.25);
          outline: none;
          transition: all 0.2s;
        }
        .form-input:focus, .form-select:focus {
          border-color: #FFD700;
          box-shadow: 0 0 10px rgba(255,215,0,0.2);
        }
        .form-input:disabled, .form-select:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          border-color: rgba(255,215,0,0.1);
          background: rgba(255,215,0,0.02);
        }
        .form-select {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23FFD700'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
          cursor: pointer;
        }
        .form-select option {
          background: #1d033a;
          color: #fff;
        }

        /* UPDATE BUTTON */
        .update-wrap {
          display: flex;
          justify-content: center;
          padding-top: 4px;
        }
        .update-btn {
          background: linear-gradient(135deg, #FFD700 0%, #f0a500 100%);
          color: #120228;
          border: none;
          border-radius: 7px;
          padding: 11px 36px;
          font-size: 14px;
          font-weight: 800;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          transition: all 0.2s, transform 0.15s;
          box-shadow: 0 4px 12px rgba(255,215,0,0.2);
        }
        .update-btn:hover { background: linear-gradient(135deg, #FFE042 0%, #f0b500 100%); transform: translateY(-1px); }
        .update-btn:active { transform: scale(0.98); }

        /* TOAST */
        .toast {
          position: fixed;
          bottom: 28px; right: 28px;
          background: linear-gradient(135deg, #FFD700 0%, #f0a500 100%);
          color: #120228;
          padding: 12px 22px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 800;
          box-shadow: 0 6px 20px rgba(255,215,0,0.3);
          z-index: 999;
          animation: fadeUp 0.3s ease;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* SKELETON LOADER */
        .skeleton-group { display: flex; flex-direction: column; gap: 7px; }
        .skeleton-label {
          height: 12px;
          width: 90px;
          background: linear-gradient(90deg, rgba(29,3,58,0.5) 25%, rgba(168,85,247,0.2) 50%, rgba(29,3,58,0.5) 75%);
          background-size: 200% 100%;
          border-radius: 3px;
          animation: shimmer 2s infinite;
        }
        .skeleton-input {
          height: 40px;
          background: linear-gradient(90deg, rgba(29,3,58,0.5) 25%, rgba(168,85,247,0.2) 50%, rgba(29,3,58,0.5) 75%);
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
        {/* Gold bar */}
        <div className="gold-bar" />

        {/* BREADCRUMB */}
        <div className="breadcrumb-row">
          <div className="breadcrumb-left">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700">
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

        {/* MAIN CARD */}
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
                      background: "rgba(239, 68, 68, 0.12)",
                      color: "#ff8888",
                      padding: "12px 16px",
                      borderRadius: "6px",
                      marginBottom: "20px",
                      fontSize: "13px",
                      border: "1px solid rgba(239, 68, 68, 0.3)"
                    }}>
                      ❌ {error}
                    </div>
                  )}

                  {/* Status Banners */}
                  {bankStatus === "pending" && (
                    <div style={{
                      background: "rgba(251, 191, 36, 0.12)",
                      color: "#fbbf24",
                      padding: "14px 18px",
                      borderRadius: "6px",
                      marginBottom: "24px",
                      fontSize: "13.5px",
                      border: "1px solid rgba(251, 191, 36, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}>
                      ⏳ <span>Your bank details are pending Admin approval. You cannot modify them at this time.</span>
                    </div>
                  )}

                  {bankStatus === "approved" && (
                    <div style={{
                      background: "rgba(16, 185, 129, 0.12)",
                      color: "#34d399",
                      padding: "14px 18px",
                      borderRadius: "6px",
                      marginBottom: "24px",
                      fontSize: "13.5px",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}>
                      ✅ <span>Your bank details have been approved. To request changes, please contact the Administrator.</span>
                    </div>
                  )}

                  {bankStatus === "rejected" && (
                    <div style={{
                      background: "rgba(239, 68, 68, 0.12)",
                      color: "#f87171",
                      padding: "14px 18px",
                      borderRadius: "6px",
                      marginBottom: "24px",
                      fontSize: "13.5px",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "6px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "700" }}>
                        ❌ <span>Submission Rejected</span>
                      </div>
                      <span style={{ fontSize: "13px", opacity: 0.9 }}>Reason: {rejectReason || "Not specified by Admin"}</span>
                      <span style={{ fontSize: "12px", opacity: 0.75, marginTop: "4px" }}>Please correct the details below and re-submit for approval.</span>
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
                        disabled={isLocked}
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
                        disabled={isLocked}
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
                        disabled={isLocked}
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
                        disabled={isLocked}
                      />
                    </div>

                    {/* Account Type */}
                    <div className="form-group">
                      <label className="form-label">Account Type :</label>
                      <select
                        className="form-select"
                        value={bankData.accountType}
                        onChange={(e) => handleInputChange("accountType", e.target.value)}
                        disabled={isLocked}
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
                        disabled={isLocked}
                      />
                    </div>

                  </div>

                  {/* Update Button */}
                  {!isLocked && (
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
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Toast */}
        {success && (
          <div className="toast">✓ Bank details submitted successfully!</div>
        )}

      </div>
    </>
  );
}
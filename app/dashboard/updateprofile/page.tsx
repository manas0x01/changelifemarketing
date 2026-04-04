"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const indianStates = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
];

const days   = Array.from({ length: 31 }, (_, i) => String(i + 1));
const months = ["January","February","March","April","May","June",
                 "July","August","September","October","November","December"];
const years  = Array.from({ length: 60 }, (_, i) => String(2005 - i));

const nomineeRelations = ["Son","Daughter","Wife","Husband","Father","Mother","Brother","Sister","Other"];

export default function EditProfilePage() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState<"dashboard" | "profile">("profile");
  
  // Form data states
  const [formData, setFormData] = useState({
    fullName: "",
    gender: "Male" as "Male" | "Female",
    email: "",
    phone: "91",
    mobileNo: "",
    panNo: "",
    dateOfBirth: "",
    state: "Bihar",
    district: "Patna",
    city: "Patna",
    address: "",
    pincode: "",
    bankName: "",
    branchName: "",
    accountNo: "",
    ifsc: "",
    accountType: "",
    nomineeName: "",
    nomineeRelation: "Son",
    joiningDate: "",
    sponsorId: "",
    sponsorName: "",
    placementId: "",
    placementName: "",
  });

  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [placementData, setPlacementData] = useState({
    memberId: "",
    joiningDate: "",
    sponsorId: "",
    sponsorName: "",
    placementId: "",
    placementName: "",
  });

  // Date of birth states
  const [dobDay, setDobDay] = useState("1");
  const [dobMonth, setDobMonth] = useState("January");
  const [dobYear, setDobYear] = useState("1991");

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("� [UpdateProfile] Starting to fetch profile data...");

        const response = await fetch("/api/user/update-profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        console.log("📥 [UpdateProfile] Response received:", {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get("content-type"),
        });

        if (!response.ok) {
          // Try to parse as JSON, fallback to text
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
            console.error("❌ [UpdateProfile] Error parsing response:", parseErr);
            errorData = { error: "Failed to parse server response" };
          }
          
          console.error("❌ [UpdateProfile] Profile fetch error:", errorData);
          
          if (response.status === 401) {
            router.push("/auth/login");
            return;
          }
          
          throw new Error(errorData.error || "Failed to fetch profile");
        }

        const data = await response.json();
        console.log("✅ [UpdateProfile] Full profile data fetched:", JSON.stringify(data, null, 2));

        if (data.data) {
          setFormData(data.data);
          console.log("✅ [UpdateProfile] Form data set successfully");
          console.log("🔍 [UpdateProfile] DEBUG - Full data.data object:");
          console.log("   userId:", data.data.userId || data.data.username);
          console.log("   fullName:", data.data.fullName);
          console.log("   joiningDate:", data.data.joiningDate);
          console.log("   sponsorId:", data.data.sponsorId);
          console.log("   sponsorName:", data.data.sponsorName);
          console.log("   placementId:", data.data.placementId);
          console.log("   placementName:", data.data.placementName);

          // Parse date of birth
          if (data.data.dateOfBirth) {
            const dob = new Date(data.data.dateOfBirth);
            setDobDay(String(dob.getDate()).padStart(2, "0"));
            setDobMonth(months[dob.getMonth()]);
            setDobYear(String(dob.getFullYear()));
            console.log("✅ [UpdateProfile] DOB parsed:", dob);
          }

          const newPlacementData = {
            memberId: data.data.userId || data.data.username || "",
            joiningDate: data.data.joiningDate || "",
            sponsorId: data.data.sponsorId || "",
            sponsorName: data.data.sponsorName || "",
            placementId: data.data.placementId || "",
            placementName: data.data.placementName || "",
          };
          
          console.log("🔍 [UpdateProfile] Creating placement data:");
          console.log("   memberId:", newPlacementData.memberId);
          console.log("   joiningDate:", newPlacementData.joiningDate);
          console.log("   sponsorId:", newPlacementData.sponsorId);
          console.log("   sponsorName:", newPlacementData.sponsorName);
          console.log("   placementId:", newPlacementData.placementId);
          console.log("   placementName:", newPlacementData.placementName);
          
          setPlacementData(newPlacementData);
          console.log("✅ [UpdateProfile] Placement data state updated:", newPlacementData);
        } else {
          console.warn("⚠️ [UpdateProfile] No data.data found in response");
        }

        setError(null);
      } catch (err) {
        console.error("❌ [UpdateProfile] Error fetching profile:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // Handle input change
  const handleInputChange = (
    field: keyof typeof formData,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle date change
  const handleDateChange = (type: "day" | "month" | "year", value: string) => {
    if (type === "day") setDobDay(value);
    if (type === "month") setDobMonth(value);
    if (type === "year") setDobYear(value);

    // Update formData with the new date
    const monthIndex = months.indexOf(type === "month" ? value : dobMonth);
    const year = type === "year" ? value : dobYear;
    const day = type === "day" ? value : dobDay;
    const newDate = new Date(parseInt(year), monthIndex, parseInt(day));
    handleInputChange("dateOfBirth", newDate.toISOString());
  };
  const handleUpdate = async () => {
    try {
      setSaving(true);
      setError(null);
      console.log("💾 Saving profile data...");
      console.log("📋 Form data:", formData);
      if (formData.mobileNo.trim() && !/^\d{10}$/.test(formData.mobileNo)) {
        setError("Mobile number must be 10 digits");
        setSaving(false);
        return;
      }
      if (formData.panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNo)) {
        setError("Invalid PAN number format");
        setSaving(false);
        return;
      }
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      console.log("📥 Update response status:", response.status);
      console.log("📥 Response content-type:", response.headers.get("content-type"));

      if (!response.ok) {
        // Try to parse as JSON, fallback to text
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
          console.error("❌ Error parsing response:", parseErr);
          errorData = { error: "Failed to parse server response" };
        }
        
        console.error("❌ Update error:", errorData);
        throw new Error(errorData.error || "Failed to update profile");
      }

      const data = await response.json();
      console.log("✅ Profile updated successfully");

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      console.error("❌ Error updating profile:", err);
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

        .ep-root {
          font-family: 'Poppins', sans-serif;
          background: #f0f2f5;
          min-height: 100vh;
        }

        /* ── GREEN BAR ── */
        .green-bar { height: 8px; background: linear-gradient(90deg, #00c853, #1de9b6); }

        /* ── BREADCRUMB ── */
        .breadcrumb {
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
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
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 500;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: background 0.18s;
          display: inline-block;
          text-decoration: none;
        }
        .return-btn:hover { 
          background: #455a64;
          text-decoration: none;
        }

        /* ── PAGE BODY ── */
        .page-body { padding: 0 20px 30px; }

        /* ── SECTION CARD ── */
        .section-card {
          background: #fff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
          margin-bottom: 20px;
        }
        .section-header {
          background: linear-gradient(90deg, #26a69a, #1de9b6);
          padding: 12px 20px;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        /* ── PLACEMENT INFO ── */
        .placement-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 20px;
          padding: 18px 20px;
        }
        @media (max-width: 600px) { .placement-grid { grid-template-columns: 1fr; } }

        .placement-item {
          font-size: 13.5px;
          color: #333;
          font-weight: 400;
        }
        .placement-item span { font-weight: 400; }

        /* ── FORM SECTION ── */
        .form-body { padding: 20px; }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
          align-items: start;
        }
        @media (max-width: 700px) { .form-row { grid-template-columns: 1fr; } }

        .form-group { display: flex; flex-direction: column; gap: 6px; }

        .form-label {
          font-size: 13px;
          font-weight: 500;
          color: #333;
        }
        .form-label .req { color: #e53935; margin-right: 1px; }

        /* Inputs */
        .form-input, .form-select {
          width: 100%;
          border: 1px solid #d0d0d0;
          border-radius: 5px;
          padding: 9px 12px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          color: #333;
          background: #f9f9f9;
          outline: none;
          transition: border-color 0.18s, background 0.18s;
          appearance: none;
          -webkit-appearance: none;
        }
        .form-input:focus, .form-select:focus {
          border-color: #26a69a;
          background: #fff;
        }
        .form-select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 30px;
          cursor: pointer;
        }

        /* Gender radio */
        .gender-group {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 10px 12px;
          border: 1px solid #d0d0d0;
          border-radius: 5px;
          background: #f9f9f9;
          min-height: 40px;
        }
        .radio-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #333;
          cursor: pointer;
        }
        .radio-label input[type="radio"] {
          accent-color: #1976d2;
          width: 15px;
          height: 15px;
          cursor: pointer;
        }

        /* Mobile split */
        .mobile-split {
          display: flex;
          gap: 8px;
        }
        .mobile-code {
          width: 80px;
          flex-shrink: 0;
        }
        .mobile-num { flex: 1; }

        /* DOB split */
        .dob-split {
          display: flex;
          gap: 8px;
        }
        .dob-split .form-select { flex: 1; }

        /* ── UPDATE BUTTON ── */
        .update-wrap {
          display: flex;
          justify-content: center;
          padding: 10px 0 4px;
        }
        .update-btn {
          background: #1976d2;
          color: #fff;
          border: none;
          border-radius: 7px;
          padding: 11px 40px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: background 0.18s, transform 0.15s;
          letter-spacing: 0.3px;
        }
        .update-btn:hover { background: #1565c0; transform: translateY(-1px); }
        .update-btn:active { transform: scale(0.98); }

        /* ── SUCCESS TOAST ── */
        .toast {
          position: fixed;
          bottom: 28px;
          right: 28px;
          background: #26a69a;
          color: #fff;
          padding: 12px 22px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 500;
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
          z-index: 999;
          animation: fadeInUp 0.3s ease;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── SKELETON LOADER ── */
        .skeleton-group { display: flex; flex-direction: column; gap: 6px; }
        .skeleton-label {
          height: 12px;
          width: 80px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: 3px;
          animation: shimmer 2s infinite;
        }
        .skeleton-input {
          height: 38px;
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

      <div className="ep-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* ── NAVBAR COMPONENT ── */}
        <Navbar
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          setActivePage={setActivePage}
        />

        {/* Green bar */}
        <div className="green-bar" />

        {/* ── BREADCRUMB ── */}
        <div className="breadcrumb">
          <div className="breadcrumb-left">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#555">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <Link href="/dashboard">Home</Link>
            <span className="sep">/</span>
            <Link href="/dashboard/profile">Profile</Link>
            <span className="sep">/</span>
            <span className="current">Edit Profile</span>
          </div>
          <Link href="/dashboard/profile" className="return-btn">Return to Profile</Link>
        </div>

        <div className="page-body">

          {/* ── PLACEMENT & SPONSOR DETAILS ── */}
          <div className="section-card">
            <div className="section-header">Placement &amp; Sponsor Details</div>
            <div className="placement-grid">
              <div className="placement-item">Member ID : <strong>{placementData.memberId}</strong></div>
              <div className="placement-item">Joining Date : <strong>{placementData.joiningDate}</strong></div>
              <div className="placement-item">Sponsor ID : <strong>{placementData.sponsorId}</strong></div>
              <div className="placement-item">Sponsor Name : <strong>{placementData.sponsorName}</strong></div>
              <div className="placement-item">Placement ID : <strong>{placementData.placementId}</strong></div>
              <div className="placement-item">Placement Name : <strong>{placementData.placementName}</strong></div>
            </div>
          </div>

          {/* ── EDIT PERSONAL INFORMATION ── */}
          <div className="section-card">
            <div className="section-header">Edit Personal Information</div>
            <div className="form-body">

              {loading ? (
                <>
                  {/* Skeleton Row 1 */}
                  <div className="form-row">
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "70px" }} />
                      <div className="skeleton-input" />
                    </div>
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "60px" }} />
                      <div className="skeleton-input" />
                    </div>
                  </div>

                  {/* Skeleton Row 2 */}
                  <div className="form-row">
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "70px" }} />
                      <div className="skeleton-input" />
                    </div>
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "90px" }} />
                      <div className="skeleton-input" />
                    </div>
                  </div>

                  {/* Skeleton Row 3 */}
                  <div className="form-row">
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "70px" }} />
                      <div className="skeleton-input" />
                    </div>
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "80px" }} />
                      <div className="skeleton-input" />
                    </div>
                  </div>

                  {/* Skeleton Row 4 */}
                  <div className="form-row">
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "120px" }} />
                      <div className="skeleton-input" />
                    </div>
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "80px" }} />
                      <div className="skeleton-input" />
                    </div>
                  </div>

                  {/* Skeleton Row 5 */}
                  <div className="form-row">
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "60px" }} />
                      <div className="skeleton-input" />
                    </div>
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "80px" }} />
                      <div className="skeleton-input" />
                    </div>
                  </div>

                  {/* Skeleton Row 6 */}
                  <div className="form-row">
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "60px" }} />
                      <div className="skeleton-input" />
                    </div>
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "100px" }} />
                      <div className="skeleton-input" />
                    </div>
                  </div>

                  {/* Skeleton Row 7 - Nominee */}
                  <div className="form-row">
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "90px" }} />
                      <div className="skeleton-input" />
                    </div>
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "110px" }} />
                      <div className="skeleton-input" />
                    </div>
                  </div>

                  {/* Skeleton Row 8 - Placement dates */}
                  <div className="form-row">
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "85px" }} />
                      <div className="skeleton-input" />
                    </div>
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "75px" }} />
                      <div className="skeleton-input" />
                    </div>
                  </div>

                  {/* Skeleton Row 9 - Sponsor details */}
                  <div className="form-row">
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "95px" }} />
                      <div className="skeleton-input" />
                    </div>
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "80px" }} />
                      <div className="skeleton-input" />
                    </div>
                  </div>

                  {/* Skeleton Row 10 - Placement name */}
                  <div className="form-row">
                    <div className="skeleton-group">
                      <div className="skeleton-label" style={{ width: "100px" }} />
                      <div className="skeleton-input" />
                    </div>
                    <div className="skeleton-group"></div>
                  </div>

                  {/* Skeleton Button */}
                  <div className="update-wrap">
                    <div className="skeleton-input" style={{ width: "160px", height: "42px" }} />
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

                  {/* Row 1: Name | Gender */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Name :</label>
                      <input
                        className="form-input"
                        type="text"
                        suppressHydrationWarning
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gender :</label>
                      <div className="gender-group">
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="gender"
                            checked={formData.gender === "Male"}
                            onChange={() => handleInputChange("gender", "Male")}
                          />
                          Male
                        </label>
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="gender"
                            checked={formData.gender === "Female"}
                            onChange={() => handleInputChange("gender", "Female")}
                          />
                          Female
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Country | Mobile No. */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Country :</label>
                      <select
                        className="form-select"
                        value="India"
                        disabled
                      >
                        <option>India</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mobile No. :</label>
                      <div className="mobile-split">
                        <input
                          className="form-input mobile-code"
                          type="text"
                          suppressHydrationWarning
                          value="+ 91"
                          disabled
                        />
                        <input
                          className="form-input mobile-num"
                          type="text"
                          suppressHydrationWarning
                          value={formData.mobileNo}
                          onChange={(e) => handleInputChange("mobileNo", e.target.value)}
                          placeholder="10-digit mobile number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Email | PAN No. */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Email ID :</label>
                      <input
                        className="form-input"
                        type="email"
                        suppressHydrationWarning
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">PAN No. :</label>
                      <input
                        className="form-input"
                        type="text"
                        suppressHydrationWarning
                        value={formData.panNo}
                        onChange={(e) => handleInputChange("panNo", e.target.value.toUpperCase())}
                        placeholder="e.g., ABCDE1234F"
                      />
                    </div>
                  </div>

                  {/* Row 4: Date of Birth | Pin Code */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Date of Birth :</label>
                      <div className="dob-split">
                        <select
                          className="form-select"
                          value={dobDay}
                          onChange={(e) => handleDateChange("day", e.target.value)}
                        >
                          {days.map(d => <option key={d}>{d}</option>)}
                        </select>
                        <select
                          className="form-select"
                          value={dobMonth}
                          onChange={(e) => handleDateChange("month", e.target.value)}
                        >
                          {months.map(m => <option key={m}>{m}</option>)}
                        </select>
                        <select
                          className="form-select"
                          value={dobYear}
                          onChange={(e) => handleDateChange("year", e.target.value)}
                        >
                          {years.map(y => <option key={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pin Code :</label>
                      <input
                        className="form-input"
                        type="text"
                        suppressHydrationWarning
                        value={formData.pincode}
                        onChange={(e) => handleInputChange("pincode", e.target.value)}
                        placeholder="6-digit pincode"
                      />
                    </div>
                  </div>

                  {/* Row 5: State | District */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">State :</label>
                      <select
                        className="form-select"
                        value={formData.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                      >
                        {indianStates.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">District :</label>
                      <select
                        className="form-select"
                        value={formData.district}
                        onChange={(e) => handleInputChange("district", e.target.value)}
                      >
                        {["Patna","Gaya","Bhagalpur","Muzaffarpur","Nalanda","Vaishali","Saran","Darbhanga"].map(d => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 6: City | Street/Landmark */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">City :</label>
                      <select
                        className="form-select"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                      >
                        {["Masaurhi","Patna","Barh","Danapur","Fatuha","Punpun"].map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Street/Landmark/Building (Address Block) :</label>
                      <input
                        className="form-input"
                        type="text"
                        suppressHydrationWarning
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Row 7: Nominee Name | Nominee Relation */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Nominee Name :</label>
                      <input
                        className="form-input"
                        type="text"
                        suppressHydrationWarning
                        value={formData.nomineeName}
                        onChange={(e) => handleInputChange("nomineeName", e.target.value)}
                        placeholder="Enter nominee name"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nominee Relation :</label>
                      <select
                        className="form-select"
                        value={formData.nomineeRelation}
                        onChange={(e) => handleInputChange("nomineeRelation", e.target.value)}
                      >
                        {nomineeRelations.map(r => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
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
                      {saving ? "Saving..." : "Update Profile"}
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>

        {/* Toast */}
        {success && (
          <div className="toast">✓ Profile updated successfully!</div>
        )}

      </div>
    </>
  );
}
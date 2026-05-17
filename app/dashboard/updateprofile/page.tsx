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
  
  // Form data states (personal info only - bank details edited in editbank)
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


        const response = await fetch("/api/user/update-profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          // Handle specific status codes
          if (response.status === 401) {
            router.push("/auth/login");
            return;
          }
          
          // Try to parse error response
          let errorMessage = "Failed to fetch profile";
          try {
            const contentType = response.headers.get("content-type");
            if (contentType?.includes("application/json")) {
              const errorData = await response.json();
              errorMessage = errorData.error || errorData.message || errorMessage;
            } else {
              const text = await response.text();
              errorMessage = text?.substring(0, 200) || errorMessage;
            }
          } catch (parseErr) {
            // Keep default error message if parsing fails
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (data.data) {
          // Only set personal info fields, exclude bank details
          const personalData = { ...data.data };
          delete (personalData as any).bankName;
          delete (personalData as any).branchName;
          delete (personalData as any).accountNo;
          delete (personalData as any).ifsc;
          delete (personalData as any).accountType;
          setFormData(personalData);

          // Parse date of birth
          if (data.data.dateOfBirth) {
            const dob = new Date(data.data.dateOfBirth);
            setDobDay(String(dob.getDate()).padStart(2, "0"));
            setDobMonth(months[dob.getMonth()]);
            setDobYear(String(dob.getFullYear()));
          }

          let sponsorName = data.data.sponsorName || "";
          let placementName = data.data.placementName || "";

          // Fetch sponsor name from database if not available
          if (data.data.sponsorId && !sponsorName) {
            try {
              const sponsorResponse = await fetch('/api/user/get-name', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: data.data.sponsorId }),
                credentials: 'include',
              });
              const sponsorData = await sponsorResponse.json();
              if (sponsorData.name) {
                sponsorName = sponsorData.name;
              }
            } catch (err) {
              // Keep existing sponsor name if fetch fails
            }
          }

          // Fetch placement name from database if not available
          if (data.data.placementId && !placementName) {
            try {
              const placementResponse = await fetch('/api/user/get-name', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: data.data.placementId }),
                credentials: 'include',
              });
              const placementDataResponse = await placementResponse.json();
              if (placementDataResponse.name) {
                placementName = placementDataResponse.name;
              }
            } catch (err) {
              // Keep existing placement name if fetch fails
            }
          }

          const newPlacementData = {
            memberId: data.data.userId || data.data.username || "",
            joiningDate: data.data.joiningDate || (data.data.createdAt ? (() => {
              const d = new Date(data.data.createdAt);
              const formatted = d.toLocaleString('en-GB', { hour12: false });
              const session = d.getHours() < 12 ? "Morning" : "Evening";
              return `${formatted} (${session})`;
            })() : ""),
            sponsorId: data.data.sponsorId || "",
            sponsorName: sponsorName,
            placementId: data.data.placementId || "",
            placementName: placementName,
          };
          
          setPlacementData(newPlacementData);
        } else {
          // No data available
        }

        setError(null);
      } catch (err) {
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
      // Validate mobile number
      if (formData.mobileNo.trim() && !/^\d{10}$/.test(formData.mobileNo)) {
        setError("Mobile number must be 10 digits");
        setSaving(false);
        return;
      }
      // Validate PAN number format
      if (formData.panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNo)) {
        setError("Invalid PAN number format");
        setSaving(false);
        return;
      }
      // Remove bank-related fields before sending (edited in editbank page)
      const sendData = { ...formData };
      delete (sendData as any).bankName;
      delete (sendData as any).branchName;
      delete (sendData as any).accountNo;
      delete (sendData as any).ifsc;
      delete (sendData as any).accountType;
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendData),
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
        
        throw new Error(errorData.error || "Failed to update profile");
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
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .ep-root {
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

        /* BREADCRUMB */
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

        /* ── PAGE BODY ── */
        .page-body { padding: 0 20px 30px; }

        /* ── SECTION CARD ── */
        .section-card {
          background: linear-gradient(135deg, #1d033a 0%, #110122 100%);
          border: 1.5px solid rgba(255,215,0,0.22);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0,0,0,0.65), 0 0 20px rgba(168,85,247,0.15);
          margin-bottom: 20px;
        }
        .section-header {
          background: linear-gradient(90deg, rgba(255,215,0,0.15), rgba(168,85,247,0.12));
          border-bottom: 1.5px solid rgba(255,215,0,0.25);
          padding: 12px 20px;
          font-size: 13px;
          font-weight: 700;
          color: #FFD700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          text-shadow: 0 0 8px rgba(255,215,0,0.45);
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
          color: rgba(255,215,0,0.8);
          font-weight: 400;
        }
        .placement-item strong { color: #FFD700; font-weight: 700; }

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
          font-weight: 600;
          color: #FFD700;
        }
        .form-label .req { color: #FFD700; margin-right: 1px; }

        /* Inputs */
        .form-input, .form-select {
          width: 100%;
          border: 1.5px solid rgba(255,215,0,0.22);
          border-radius: 6px;
          padding: 9px 12px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          color: #FFD700;
          background: rgba(0,0,0,0.25);
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
          appearance: none;
          -webkit-appearance: none;
          height: 40px;
        }
        .form-input:focus, .form-select:focus {
          border-color: #FFD700;
          background: rgba(0,0,0,0.35);
          box-shadow: 0 0 0 3px rgba(255,215,0,0.15);
        }
        .form-select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23FFD700'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 30px;
          cursor: pointer;
        }
        .form-select option {
          background-color: #1a0533;
          color: #FFD700;
        }
        .form-input:disabled, .form-select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Gender radio */
        .gender-group {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 10px 12px;
          border: 1.5px solid rgba(255,215,0,0.22);
          border-radius: 6px;
          background: rgba(0,0,0,0.25);
          min-height: 40px;
        }
        .radio-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #FFD700;
          cursor: pointer;
          font-weight: 500;
        }
        .radio-label input[type="radio"] {
          accent-color: #FFD700;
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
          background: linear-gradient(135deg, #FFD700 0%, #f0a500 100%);
          color: #120228;
          border: none;
          border-radius: 7px;
          padding: 11px 40px;
          font-size: 14px;
          font-weight: 800;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          box-shadow: 0 4px 15px rgba(255,215,0,0.25);
        }
        .update-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(255,215,0,0.35); }
        .update-btn:active { transform: scale(0.98); }
        .update-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── SUCCESS TOAST ── */
        .toast {
          position: fixed;
          bottom: 28px;
          right: 28px;
          background: linear-gradient(135deg, #FFD700 0%, #f0a500 100%);
          color: #120228;
          padding: 12px 22px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 700;
          box-shadow: 0 6px 22px rgba(255,215,0,0.4);
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
          background: linear-gradient(90deg, #2d0a5c 25%, #3d1475 50%, #2d0a5c 75%);
          background-size: 200% 100%;
          border-radius: 3px;
          animation: shimmer 2s infinite;
        }
        .skeleton-input {
          height: 38px;
          background: linear-gradient(90deg, #2d0a5c 25%, #3d1475 50%, #2d0a5c 75%);
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

        {/* Gold bar */}
        <div className="gold-bar" />

        {/* ── BREADCRUMB ── */}
        <div className="breadcrumb">
          <div className="breadcrumb-left">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700">
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
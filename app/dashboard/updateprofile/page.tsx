"use client";

import { useState } from "react";
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState<"dashboard" | "profile">("profile");
  const [gender, setGender]             = useState<"Male" | "Female">("Male");
  const [state,  setState]              = useState("Bihar");
  const [district, setDistrict]         = useState("Patna");
  const [city, setCity]                 = useState("Masaurhi");
  const [dobDay,   setDobDay]           = useState("1");
  const [dobMonth, setDobMonth]         = useState("January");
  const [dobYear,  setDobYear]          = useState("1991");
  const [nomineeRelation, setNomineeRelation] = useState("Son");
  const [saved, setSaved]               = useState(false);

  const handleUpdate = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
              <div className="placement-item">Member ID : <strong>Sm674643</strong></div>
              <div className="placement-item">Joining Date : <strong>24-May-2020</strong></div>
              <div className="placement-item">Sponsor ID : <strong>SM956718</strong></div>
              <div className="placement-item">Sponsor Name : <strong>ANKIT KUMAR</strong></div>
              <div className="placement-item">Placement ID : <strong>SM956718</strong></div>
              <div className="placement-item">Placement Name : <strong>ANKIT KUMAR</strong></div>
            </div>
          </div>

          {/* ── EDIT PERSONAL INFORMATION ── */}
          <div className="section-card">
            <div className="section-header">Edit Personal Information</div>
            <div className="form-body">

              {/* Row 1: Name | Gender */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><span className="req">*</span>Name :</label>
                  <input className="form-input" type="text" defaultValue="AJAY KUMAR" />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender :</label>
                  <div className="gender-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="gender"
                        checked={gender === "Male"}
                        onChange={() => setGender("Male")}
                      />
                      Male
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="gender"
                        checked={gender === "Female"}
                        onChange={() => setGender("Female")}
                      />
                      Female
                    </label>
                  </div>
                </div>
              </div>

              {/* Row 2: Country | Mobile No. */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><span className="req">*</span>Country :</label>
                  <select className="form-select" defaultValue="India">
                    <option>India</option>
                    <option>Nepal</option>
                    <option>Bangladesh</option>
                    <option>Sri Lanka</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label"><span className="req">*</span>Mobile No. :</label>
                  <div className="mobile-split">
                    <input className="form-input mobile-code" type="text" defaultValue="91" />
                    <input className="form-input mobile-num"  type="text" defaultValue="6204720770" />
                  </div>
                </div>
              </div>

              {/* Row 3: Email | PAN No. */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email ID :</label>
                  <input className="form-input" type="email" defaultValue="AJAYSHARMAMLM71@GMAIL.COM" />
                </div>
                <div className="form-group">
                  <label className="form-label"><span className="req">*</span>PAN No. :</label>
                  <input className="form-input" type="text" defaultValue="FVEPK3555E" />
                </div>
              </div>

              {/* Row 4: Date of Birth | Pin Code */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><span className="req">*</span>Date of Birth :</label>
                  <div className="dob-split">
                    <select className="form-select" value={dobDay} onChange={e => setDobDay(e.target.value)}>
                      {days.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <select className="form-select" value={dobMonth} onChange={e => setDobMonth(e.target.value)}>
                      {months.map(m => <option key={m}>{m}</option>)}
                    </select>
                    <select className="form-select" value={dobYear} onChange={e => setDobYear(e.target.value)}>
                      {years.map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label"><span className="req">*</span>Pin Code :</label>
                  <input className="form-input" type="text" defaultValue="804452" />
                </div>
              </div>

              {/* Row 5: State | District */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><span className="req">*</span> State :</label>
                  <select className="form-select" value={state} onChange={e => setState(e.target.value)}>
                    {indianStates.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">District :</label>
                  <select className="form-select" value={district} onChange={e => setDistrict(e.target.value)}>
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
                  <select className="form-select" value={city} onChange={e => setCity(e.target.value)}>
                    {["Masaurhi","Patna","Barh","Danapur","Fatuha","Punpun"].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Street/Landmark/Building (Address Block) :</label>
                  <input className="form-input" type="text" defaultValue="KAILUACHK" />
                </div>
              </div>

              {/* Row 7: Nominee Name | Nominee Relation */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nominee Name :</label>
                  <input className="form-input" type="text" defaultValue="Dhadkan Kumar" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nominee Relation :</label>
                  <select className="form-select" value={nomineeRelation} onChange={e => setNomineeRelation(e.target.value)}>
                    {nomineeRelations.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Update Button */}
              <div className="update-wrap">
                <button className="update-btn" onClick={handleUpdate}>
                  Update Profile
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Toast */}
        {saved && (
          <div className="toast">✓ Profile updated successfully!</div>
        )}

      </div>
    </>
  );
}
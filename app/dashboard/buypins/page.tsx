"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { Upload, Check, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PIN_COST = 1299;

const packages = [
  { id: "basic", name: "Basic Package", icon: "📦" },
];

export default function BuyEPinPage() {
  const { data: session } = useSession();
  const [numPins, setNumPins] = useState(1);
  const [step, setStep] = useState<"form" | "success" | "error">("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState<"dashboard" | "profile">("dashboard");
  const [userData, setUserData] = useState({ userName: "", memberId: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(packages[0].id);
  const [transactionId, setTransactionId] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState("");
  const [cloudinaryUrl, setCloudinaryUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    if (!session) {
      window.location.href = "/auth/login";
      return;
    }
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/user/get-profile", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUserData({
              userName: data.user.fullName || session.user?.name || "User",
              memberId: data.user.userId || "N/A",
              email: data.user.email || session.user?.email || "",
              phone: data.user.mobileNo || data.user.phone || "",
            });
          }
        }
      } catch (error: any) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [session]);

  const totalAmount = numPins * PIN_COST;
  const pkg = packages.find((p) => p.id === selectedPkg)!;

  const handlePinChange = (val: number) => {
    if (val < 1) val = 1;
    if (val > 99) val = 99;
    setNumPins(val);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("File size must be less than 5MB");
        toast.error("File size must be less than 5MB");
        return;
      }
      
      setUploadedFile(file);
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload to Cloudinary
      setUploading(true);
      uploadToCloudinary(file);
    }
  };

  const uploadToCloudinary = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "changelife");
      formData.append("cloud_name", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "changelife");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setCloudinaryUrl(data.secure_url);
      toast.success("Screenshot uploaded successfully!");
      setUploading(false);
    } catch (error: any) {
      console.error("Cloudinary upload error:", error);
      setErrorMsg("Failed to upload screenshot to cloud. Please try again.");
      toast.error("Failed to upload screenshot");
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg("");

    if (!transactionId.trim()) {
      setErrorMsg("Please enter Transaction ID");
      toast.error("Please enter Transaction ID");
      return;
    }

    if (!uploadedFile) {
      setErrorMsg("Please upload payment screenshot");
      toast.error("Please upload payment screenshot");
      return;
    }

    if (!cloudinaryUrl) {
      setErrorMsg("Screenshot is still uploading. Please wait...");
      toast.error("Screenshot is still uploading. Please wait...");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("userId", userData.memberId);
      formData.append("transactionId", transactionId);
      formData.append("quantity", String(numPins));
      formData.append("packageName", pkg.name);
      formData.append("amount", String(totalAmount));
      formData.append("screenshotUrl", cloudinaryUrl);
      formData.append("orderType", "pack");
      formData.append("packName", pkg.name);
      formData.append("packPrice", String(totalAmount));

      const res = await fetch("/api/orders/create", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Failed to submit order");
        setStep("error");
        toast.error(data.message || "Failed to submit order");
        return;
      }

      setSuccessData({
        orderId: data.orderId,
        userName: userData.userName,
        memberId: userData.memberId,
        email: userData.email,
        pins: numPins,
        amount: totalAmount,
        transactionId: transactionId,
      });
      setStep("success");
      toast.success("Payment details submitted successfully! Admin will verify within 24 hours.");
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong");
      setStep("error");
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .bp-root { font-family:'Poppins',sans-serif; background:#f0f2f5; min-height:100vh; }

        .green-bar { height:8px; background:linear-gradient(90deg,#00c853,#1de9b6); }

        .breadcrumb { padding:12px 20px; font-size:13px; color:#555; display:flex; align-items:center; gap:6px; }
        .breadcrumb a { color:#555; text-decoration:none; }
        .breadcrumb a:hover { text-decoration:underline; }
        .breadcrumb .sep { color:#999; }

        .page-body { padding:20px; display:flex; justify-content:center; }

        .buy-card {
          width:100%; max-width:620px;
          background:#fff; border-radius:14px;
          box-shadow:0 4px 24px rgba(0,0,0,0.10);
          overflow:hidden;
        }

        .card-header {
          background:linear-gradient(90deg,#26a69a,#1de9b6);
          padding:18px 24px;
          display:flex; align-items:center; gap:12px;
        }
        .card-header-icon {
          width:42px; height:42px; border-radius:50%;
          background:rgba(255,255,255,0.22);
          display:flex; align-items:center; justify-content:center;
          font-size:20px;
        }
        .card-header-text h2 { font-size:16px; font-weight:700; color:#fff; }
        .card-header-text p  { font-size:12.5px; color:rgba(255,255,255,0.85); }

        .price-banner {
          background:linear-gradient(135deg,#1b5e20 0%,#2e7d32 100%);
          margin:0; padding:14px 24px;
          display:flex; align-items:center; justify-content:space-between;
          flex-wrap:wrap; gap:8px;
        }
        .price-per {
          font-size:13px; color:rgba(255,255,255,0.8);
        }
        .price-per strong { font-size:22px; color:#69f0ae; font-weight:700; }
        .price-per span   { font-size:13px; color:rgba(255,255,255,0.7); }

        .total-price {
          text-align:right;
        }
        .total-label { font-size:12px; color:rgba(255,255,255,0.7); }
        .total-val   { font-size:26px; font-weight:800; color:#fff; line-height:1; }
        .total-pins  { font-size:11.5px; color:rgba(255,255,255,0.6); }

        .form-body { padding:24px; }

        .form-group { margin-bottom:20px; }
        .form-label { font-size:13px; font-weight:600; color:#333; display:block; margin-bottom:7px; }
        .form-label .req { color:#e53935; margin-right:2px; }

        .form-input {
          width:100%; border:1.5px solid #d0d0d0; border-radius:8px;
          padding:11px 14px; font-size:13.5px;
          font-family:'Poppins',sans-serif; color:#333;
          outline:none; transition:border-color .18s, box-shadow .18s;
        }
        .form-input:focus { border-color:#26a69a; box-shadow:0 0 0 3px rgba(38,166,154,0.12); }
        .form-input::placeholder { color:#bbb; }

        .form-error {
          background:#fdecea; border-left:4px solid #e53935; border-radius:4px;
          padding:9px 13px; font-size:13px; color:#c62828;
          margin-bottom:16px; display:flex; align-items:center; gap:6px;
        }

        .file-upload-box {
          border:2px dashed #26a69a; border-radius:10px; padding:20px;
          text-align:center; cursor:pointer; transition:all .18s;
          background:#f0fdf9;
        }
        .file-upload-box:hover { background:#e0f7f4; border-color:#1de9b6; }
        .file-upload-input { display:none; }
        .upload-icon { font-size:32px; margin-bottom:8px; }
        .upload-text { font-size:13px; color:#333; font-weight:600; }
        .upload-hint { font-size:11.5px; color:#888; margin-top:4px; }

        .file-preview {
          margin-top:12px; padding:12px; background:#f5f5f5; border-radius:8px;
          display:flex; align-items:center; gap:12px;
        }
        .file-preview img { width:60px; height:60px; border-radius:6px; object-fit:cover; }
        .file-info { text-align:left; flex:1; }
        .file-name { font-size:12px; font-weight:600; color:#333; }
        .file-size { font-size:11px; color:#888; margin-top:2px; }
        .remove-file { color:#e53935; cursor:pointer; font-weight:600; font-size:12px; }

        .amount-box {
          background:linear-gradient(135deg,#f0fdf9,#e8f5e9);
          border:1px solid #b2dfdb; border-radius:10px;
          padding:14px 16px;
        }
        .amount-row {
          display:flex; justify-content:space-between; align-items:center;
          padding:5px 0;
        }
        .amount-row + .amount-row { border-top:1px dashed #c8e6c9; }
        .amount-label { font-size:13px; color:#555; }
        .amount-val   { font-size:13px; font-weight:600; color:#1b5e20; }
        .amount-row.total .amount-label { font-size:14px; font-weight:700; color:#1b5e20; }
        .amount-row.total .amount-val   { font-size:18px; font-weight:800; color:#26a69a; }

        .submit-btn {
          width:100%; background:linear-gradient(90deg,#1976d2,#1565c0);
          color:#fff; border:none; border-radius:10px;
          padding:14px; font-size:15px; font-weight:700;
          font-family:'Poppins',sans-serif; cursor:pointer;
          transition:opacity .18s, transform .15s;
          display:flex; align-items:center; justify-content:center; gap:8px;
          box-shadow:0 4px 14px rgba(25,118,210,0.35);
          margin-top:4px;
        }
        .submit-btn:hover  { opacity:0.91; transform:translateY(-1px); }
        .submit-btn:active { transform:scale(0.99); }
        .submit-btn:disabled { opacity:0.55; cursor:not-allowed; }

        .success-state {
          padding:40px 24px; text-align:center;
        }
        .success-icon {
          width:72px; height:72px; border-radius:50%;
          background:linear-gradient(135deg,#26a69a,#1de9b6);
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 18px;
          box-shadow:0 6px 20px rgba(38,166,154,0.35);
          animation:popIn .4s cubic-bezier(.175,.885,.32,1.275);
        }
        @keyframes popIn {
          from { transform:scale(0); opacity:0; }
          to   { transform:scale(1); opacity:1; }
        }
        .success-title { font-size:20px; font-weight:800; color:#1b5e20; margin-bottom:8px; }
        .success-sub   { font-size:13.5px; color:#555; margin-bottom:20px; line-height:1.6; }

        .success-details {
          background:#f0fdf9; border:1px solid #b2dfdb; border-radius:10px;
          padding:16px; text-align:left; margin-bottom:22px;
        }
        .detail-row { display:flex; justify-content:space-between; padding:5px 0; font-size:13px; }
        .detail-row + .detail-row { border-top:1px dashed #c8e6c9; }
        .detail-key { color:#555; }
        .detail-val { font-weight:600; color:#1b5e20; }

        .error-state {
          padding:48px 24px; text-align:center;
        }
        .error-icon {
          width:64px; height:64px; border-radius:50%; background:#fdecea;
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 16px; font-size:28px;
        }
        .error-title { font-size:17px; font-weight:700; color:#c62828; margin-bottom:6px; }
        .error-sub   { font-size:13px; color:#888; margin-bottom:20px; }
        .retry-btn {
          background:#1976d2; color:#fff; border:none; border-radius:8px;
          padding:11px 32px; font-size:14px; font-weight:600;
          font-family:'Poppins',sans-serif; cursor:pointer;
        }
      `}</style>

      <div className="bp-root">
        <Navbar
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          setActivePage={setActivePage}
        />

        <div className="green-bar" />

        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="#">Home</a>
          <span className="sep">/</span>
          <a href="#">E-Pin Management</a>
          <span className="sep">/</span>
          <span>Buy E-Pin</span>
        </div>

        <div className="page-body">
          <div className="buy-card">

            {/* ── HEADER ── */}
            <div className="card-header">
              <div className="card-header-icon">🔑</div>
              <div className="card-header-text">
                <h2>Buy E-Pin</h2>
                <p>Submit payment details & screenshot</p>
              </div>
            </div>

            {/* ── PRICE BANNER ── */}
            <div className="price-banner">
              <div className="price-per">
                Price per pin<br />
                <strong>₹{PIN_COST.toLocaleString("en-IN")}</strong>
                <span> / pin</span>
              </div>
              <div className="total-price">
                <div className="total-label">Total Amount</div>
                <div className="total-val">₹{totalAmount.toLocaleString("en-IN")}</div>
                <div className="total-pins">{numPins} pin{numPins > 1 ? "s" : ""} × ₹{PIN_COST}</div>
              </div>
            </div>

            {/* ── SUCCESS STATE ── */}
            {step === "success" && successData && (
              <div className="success-state">
                <div className="success-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </div>
                <div className="success-title">Order Submitted! ✅</div>
                <div className="success-sub">
                  Your payment request has been submitted successfully.<br />
                  Admin will verify and credit the EPins within 24 hours.
                </div>

                <div className="success-details">
                  <div className="detail-row"><span className="detail-key">Order ID</span><span className="detail-val">{successData.orderId}</span></div>
                  <div className="detail-row"><span className="detail-key">Member Name</span><span className="detail-val">{successData.userName}</span></div>
                  <div className="detail-row"><span className="detail-key">Member ID</span><span className="detail-val">{successData.memberId}</span></div>
                  <div className="detail-row"><span className="detail-key">Pins Ordered</span><span className="detail-val">{successData.pins} Pin{successData.pins > 1 ? "s" : ""}</span></div>
                  <div className="detail-row"><span className="detail-key">Amount</span><span className="detail-val">₹{successData.amount.toLocaleString("en-IN")}</span></div>
                  <div className="detail-row"><span className="detail-key">Transaction ID</span><span className="detail-val" style={{fontSize:11.5}}>{successData.transactionId}</span></div>
                </div>
              </div>
            )}

            {/* ── ERROR STATE ── */}
            {step === "error" && (
              <div className="error-state">
                <div className="error-icon">❌</div>
                <div className="error-title">Submission Failed</div>
                <div className="error-sub">{errorMsg}</div>
                <button className="retry-btn" onClick={() => setStep("form")}>Try Again</button>
              </div>
            )}

            {/* ── FORM STATE ── */}
            {step === "form" && (
              <div className="form-body">

                {/* Payment Image */}
                <div className="form-group" style={{
                  marginBottom: '24px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <div style={{
                    textAlign: 'center',
                    width: '100%'
                  }}>
                    <img 
                      src="/images/payment.png" 
                      alt="Payment" 
                      style={{
                        width: '280px',
                        height: 'auto',
                        borderRadius: '8px',
                        margin: '0 auto 12px',
                        display: 'block'
                      }}
                    />
                  </div>
                </div>

                {/* User Details - Read Only */}
                <div className="form-group">
                  <label className="form-label">Member Name :</label>
                  <input type="text" className="form-input" value={userData.userName} disabled />
                </div>

                <div className="form-group">
                  <label className="form-label">Member ID :</label>
                  <input type="text" className="form-input" value={userData.memberId} disabled />
                </div>

                <div className="form-group">
                  <label className="form-label">Email :</label>
                  <input type="email" className="form-input" value={userData.email} disabled />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number :</label>
                  <input type="tel" className="form-input" value={userData.phone} disabled />
                </div>

                {/* Transaction ID */}
                <div className="form-group">
                  <label className="form-label"><span className="req">*</span>Transaction ID :</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter payment transaction ID (e.g., TXN123456)"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>

                {/* Number of Pins */}
                <div className="form-group">
                  <label className="form-label"><span className="req">*</span>Number of E-Pins :</label>
                  <div style={{display:'flex', alignItems:'center', gap:'8px', marginTop:'8px'}}>
                    <button
                      style={{width:'44px', height:'44px', border:'1.5px solid #d0d0d0', borderRadius:'8px', background:'#f5f5f5', cursor:'pointer', fontSize:'18px', fontWeight:'700'}}
                      onClick={() => handlePinChange(numPins - 1)}
                    >−</button>
                    <input
                      type="number"
                      min={1} max={99}
                      value={numPins}
                      onChange={(e) => handlePinChange(parseInt(e.target.value) || 1)}
                      style={{width:'70px', height:'44px', textAlign:'center', border:'1.5px solid #d0d0d0', borderRadius:'8px', fontSize:'18px', fontWeight:'700', outline:'none'}}
                    />
                    <button
                      style={{width:'44px', height:'44px', border:'1.5px solid #d0d0d0', borderRadius:'8px', background:'#f5f5f5', cursor:'pointer', fontSize:'18px', fontWeight:'700'}}
                      onClick={() => handlePinChange(numPins + 1)}
                    >+</button>
                  </div>
                </div>

                {/* Amount Breakdown */}
                <div className="form-group">
                  <label className="form-label">Amount Breakdown :</label>
                  <div className="amount-box">
                    <div className="amount-row">
                      <span className="amount-label">Price per Pin</span>
                      <span className="amount-val">₹{PIN_COST.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="amount-row">
                      <span className="amount-label">Number of Pins</span>
                      <span className="amount-val">× {numPins}</span>
                    </div>
                    <div className="amount-row total">
                      <span className="amount-label">Total Payable</span>
                      <span className="amount-val">₹{totalAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div className="form-group">
                  <label className="form-label"><span className="req">*</span>Payment Screenshot :</label>
                  <div style={{
                    border: '2px dashed #26a69a',
                    borderRadius: '10px',
                    padding: '30px 20px',
                    textAlign: 'center',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    backgroundColor: '#f0fdf9',
                    transition: 'all 0.2s ease',
                    marginTop: '8px',
                    opacity: uploading ? 0.6 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!uploading) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#e0f7f4';
                      (e.currentTarget as HTMLElement).style.borderColor = '#1de9b6';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!uploading) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#f0fdf9';
                      (e.currentTarget as HTMLElement).style.borderColor = '#26a69a';
                    }
                  }}
                  onClick={() => !uploading && document.getElementById('fileInput')?.click()}
                  >
                    {uploading ? (
                      <>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                        <div style={{ fontSize: '13px', color: '#333', fontWeight: '600' }}>Uploading to cloud...</div>
                        <div style={{ fontSize: '11.5px', color: '#888', marginTop: '4px' }}>Please wait</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
                        <div style={{ fontSize: '13px', color: '#333', fontWeight: '600' }}>Click to upload payment screenshot</div>
                        <div style={{ fontSize: '11.5px', color: '#888', marginTop: '4px' }}>JPG, PNG up to 5MB</div>
                      </>
                    )}
                    <input
                      id="fileInput"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                  </div>

                  {filePreview && (
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <img src={filePreview} alt="Preview" style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '6px',
                        objectFit: 'cover'
                      }} />
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>{uploadedFile?.name}</div>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{((uploadedFile?.size ?? 0) / 1024).toFixed(2)} KB</div>
                        {cloudinaryUrl && <div style={{ fontSize: '11px', color: '#26a69a', marginTop: '2px' }}>✓ Uploaded to cloud</div>}
                      </div>
                      <div 
                        style={{ 
                          color: '#e53935', 
                          cursor: 'pointer', 
                          fontWeight: '600', 
                          fontSize: '12px',
                          padding: '6px 12px',
                          backgroundColor: '#fff',
                          borderRadius: '6px',
                          border: '1px solid #e53935',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => { 
                          setUploadedFile(null); 
                          setFilePreview(""); 
                          setCloudinaryUrl("");
                        }}
                        onMouseOver={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#e53935';
                          (e.currentTarget as HTMLElement).style.color = '#fff';
                        }}
                        onMouseOut={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#fff';
                          (e.currentTarget as HTMLElement).style.color = '#e53935';
                        }}
                      >
                        Remove
                      </div>
                    </div>
                  )}
                </div>

                {/* Error */}
                {errorMsg && (
                  <div className="form-error">
                    <AlertCircle size={16} />
                    {errorMsg}
                  </div>
                )}

                {/* Submit */}
                <button className="submit-btn" onClick={handleSubmit} disabled={submitting || uploading || !cloudinaryUrl}>
                  {submitting ? (
                    <><Loader2 size={18} className="animate-spin" />Submitting...</>
                  ) : uploading ? (
                    <><Loader2 size={18} className="animate-spin" />Uploading Screenshot...</>
                  ) : !cloudinaryUrl ? (
                    <><AlertCircle size={18} />Upload Screenshot First</>
                  ) : (
                    <><Upload size={18} />Submit Payment Details</>
                  )}
                </button>

              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

  
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  User,
  Phone,
  Mail,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  Shield,
  Tag,
  Package,
  ChevronRight,
  Loader2,
  AlertCircle,
  BadgeIndianRupee,
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface UserDetails {
  username: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  userId: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

const SkeletonLoader = () => (
  <div className="min-h-screen bg-[#F8FAF9]">
    <Header />

    {/* Top Banner Skeleton */}
    <div className="bg-[#0A6E5A] py-4 px-6">
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
        <div className="h-4 w-4 bg-white/20 rounded animate-pulse" />
        <div className="h-4 w-24 bg-[#C9A84C]/30 rounded animate-pulse" />
      </div>
    </div>

    {/* Page Header Skeleton */}
    <section className="bg-[#0A6E5A] pb-16 pt-8">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
            <div className="h-4 w-4 bg-white/20 rounded animate-pulse" />
            <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
          </div>
          <div className="h-12 w-64 bg-white/20 rounded animate-pulse mx-auto" />
          <div className="h-5 w-96 bg-white/20 rounded animate-pulse mx-auto" />
        </div>
      </div>
    </section>

    {/* Step Indicator Skeleton */}
    <div className="max-w-6xl mx-auto px-6 -mt-6 mb-8">
      <div className="bg-white rounded-2xl shadow-lg px-6 py-4">
        <div className="flex items-center justify-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse hidden sm:block" />
          </div>
          <div className="h-0.5 w-24 bg-gray-200 animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse hidden sm:block" />
          </div>
        </div>
      </div>
    </div>

    {/* Main Content Skeleton */}
    <div className="max-w-6xl mx-auto px-4 md:px-6 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Forms Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Profile Card Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-linear-to-r from-[#0A6E5A] to-[#9aa09f] px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-32 bg-white/20 rounded animate-pulse" />
                <div className="h-3 w-40 bg-white/20 rounded animate-pulse" />
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-20 bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="h-12 w-full bg-gray-100 rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Details Card Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-linear-to-r from-[#C9A84C] to-[#d4b05a] px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-32 bg-white/20 rounded animate-pulse" />
                <div className="h-3 w-40 bg-white/20 rounded animate-pulse" />
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 h-16 animate-pulse" />
              <div>
                <div className="h-3 w-24 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-24 w-full bg-gray-100 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Summary Skeleton */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* Item Summary Skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-[#0A6E5A] px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#C9A84C]/30 rounded animate-pulse" />
                  <div className="h-5 w-32 bg-white/20 rounded animate-pulse" />
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-6 w-full bg-gray-200 rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="border-t border-dashed border-gray-200 pt-4 space-y-3">
                  <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                  <div className="h-6 w-full bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Security Badge Skeleton */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 h-20 animate-pulse" />

            {/* Button Skeleton */}
            <div className="h-16 w-full bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>

    <Footer />
  </div>
);

function CheckoutContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const itemId = searchParams.get('itemId') || '';
  const itemName = searchParams.get('itemName') || '';
  const itemPrice = Number(searchParams.get('itemPrice')) || 0;
  const orderType = (searchParams.get('orderType') as 'product' | 'pack') || 'product';
  const bvValue = searchParams.get('bvValue') || '';
  const pvValue = searchParams.get('pvValue') || '';

  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const [userDetails, setUserDetails] = useState<UserDetails>({
    username: '',
    fullName: '',
    mobileNumber: '',
    email: '',
    userId: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [transactionDetails, setTransactionDetails] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof UserDetails | 'transactionDetails', string>>>({});

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Redirect if no item info
  useEffect(() => {
    if (!itemId || !itemName || !itemPrice) {
      router.push('/products');
    }
  }, [itemId, itemName, itemPrice, router]);

  // Fetch user details
  useEffect(() => {
    if (session?.user) {
      fetchUserDetails();
    }
  }, [session]);

  const fetchUserDetails = async () => {
    setIsFetchingUser(true);
    try {
      const res = await fetch('/api/user/get-profile', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        const u = data.user;
        setUserDetails({
          username: u?.username || session?.user?.name || '',
          fullName: u?.fullName || '',
          mobileNumber: u?.mobileNo || '',
          email: u?.email || session?.user?.email || '',
          userId: u?.userId || '',
          address: u?.address || '',
          city: u?.city || '',
          state: u?.state || '',
          pincode: u?.pincode || '',
        });
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setIsFetchingUser(false);
    }
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!userDetails.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!userDetails.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile number is required';
    else if (!/^[0-9]{10}$/.test(userDetails.mobileNumber)) newErrors.mobileNumber = 'Enter a valid 10-digit number';
    if (!transactionDetails.trim()) newErrors.transactionDetails = 'Transaction details are required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const orderData = {
        userId: userDetails.userId || session?.user?.name || null,
        username: userDetails.username || session?.user?.name || null,
        name: userDetails.fullName,
        mobileNumber: userDetails.mobileNumber,
        transactionDetails,
        orderType,
        ...(orderType === 'product' && { productId: itemId, productName: itemName, productPrice: itemPrice }),
        ...(orderType === 'pack' && { packId: itemId, packName: itemName, packPrice: itemPrice }),
      };

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        const result = await res.json();
        setOrderNumber(result.orderId || `ORD-${Date.now()}`);
        setOrderSuccess(true);
      } else {
        const err = await res.json();
        setErrors({ transactionDetails: err.error || 'Order failed. Please try again.' });
      }
    } catch (e) {
      console.error('Submit error:', e);
      setErrors({ transactionDetails: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || isFetchingUser) {
    return <SkeletonLoader />;
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#FFFFFF]">
        <Header />
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="max-w-md w-full text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 bg-[#0A6E5A] rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-14 h-14 text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="font-['Fraunces'] text-3xl text-[#0A6E5A] mb-3"
            >
              Order Placed Successfully!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="font-['Roboto'] text-[#333333]/70 mb-2"
            >
              Thank you for your order. We will contact you shortly.
            </motion.p>
            {orderNumber && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-[#0A6E5A]/10 border-2 border-[#0A6E5A] rounded-xl px-6 py-3 inline-block mb-8"
              >
                <p className="font-['Roboto'] text-sm text-[#0A6E5A]">Order ID</p>
                <p className="font-['Fraunces'] text-lg text-[#0A6E5A] font-semibold">{orderNumber}</p>
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Link
                href="/products"
                className="bg-[#0A6E5A] text-white px-8 py-3 rounded-xl font-['Roboto'] font-semibold hover:bg-[#085a49] transition-colors"
              >
                Continue Shopping
              </Link>
              <Link
                href="/dashboard"
                className="border-2 border-[#0A6E5A] text-[#0A6E5A] px-8 py-3 rounded-xl font-['Roboto'] font-semibold hover:bg-[#0A6E5A] hover:text-white transition-colors"
              >
                Go to Dashboard
              </Link>
            </motion.div>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const total = itemPrice;

  return (
    <div className="min-h-screen bg-[#F8FAF9]">
      <Header />

      {/* Top Banner */}
      <div className="bg-[#0A6E5A] py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/products" className="text-white/70 hover:text-white transition-colors flex items-center gap-1 text-sm font-['Roboto']">
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
          <ChevronRight className="w-4 h-4 text-white/40" />
          <span className="text-[#C9A84C] font-['Roboto'] text-sm font-semibold">Checkout</span>
        </div>
      </div>

      {/* Page Header */}
      <section className="bg-[#0A6E5A] pb-16 pt-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-['Roboto'] mb-4">
              <Shield className="w-4 h-4 text-[#C9A84C]" />
              Secure Checkout
            </div>
            <h1 className="font-['Fraunces'] text-3xl md:text-5xl text-white mb-3">Complete Your Order</h1>
            <p className="font-['Roboto'] text-white/70 text-base">Review your details and confirm your order below</p>
          </motion.div>
        </div>
      </section>

      {/* Step Indicator */}
      <div className="max-w-6xl mx-auto px-6 -mt-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg px-6 py-4 flex items-center justify-center gap-4 md:gap-8">
          {[
            { num: 1, label: 'Review Details' },
            { num: 2, label: 'Confirm Order' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-['Roboto'] transition-all ${
                    step >= s.num ? 'bg-[#0A6E5A] text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <span className={`font-['Roboto'] text-sm font-semibold hidden sm:inline ${step >= s.num ? 'text-[#0A6E5A]' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < 1 && <div className={`w-12 md:w-24 h-0.5 ${step > 1 ? 'bg-[#0A6E5A]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Forms */}
          <div className="lg:col-span-2 space-y-6">

            {/* User Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="bg-linear-to-r from-[#0A6E5A] to-[#0d8a72] px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-['Fraunces'] text-xl text-white">Your Information</h2>
                  <p className="font-['Roboto'] text-white/70 text-xs">Auto-filled from your profile</p>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Username */}
                <div>
                  <label className="block font-['Roboto'] text-xs font-semibold text-[#0A6E5A] uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-['Roboto'] text-gray-600 text-sm">{userDetails.username || '—'}</span>
                  </div>
                </div>

                {/* User ID */}
                <div>
                  <label className="block font-['Roboto'] text-xs font-semibold text-[#0A6E5A] uppercase tracking-wider mb-1.5">
                    User ID
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3">
                    <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-['Roboto'] text-gray-600 text-sm">{userDetails.userId || '—'}</span>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block font-['Roboto'] text-xs font-semibold text-[#0A6E5A] uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userDetails.fullName}
                    onChange={(e) => {
                      setUserDetails((p) => ({ ...p, fullName: e.target.value }));
                      if (errors.fullName) setErrors((p) => ({ ...p, fullName: '' }));
                    }}
                    placeholder="Enter your full name"
                    className={`w-full border-2 rounded-xl px-4 py-3 font-['Roboto'] text-sm outline-none transition-all ${
                      errors.fullName
                        ? 'border-red-400 bg-red-50 focus:border-red-500'
                        : 'border-[#0A6E5A]/30 focus:border-[#0A6E5A] bg-white'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block font-['Roboto'] text-xs font-semibold text-[#0A6E5A] uppercase tracking-wider mb-1.5">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A6E5A]/50" />
                    <input
                      type="tel"
                      value={userDetails.mobileNumber}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setUserDetails((p) => ({ ...p, mobileNumber: v }));
                        if (errors.mobileNumber) setErrors((p) => ({ ...p, mobileNumber: '' }));
                      }}
                      placeholder="10-digit mobile number"
                      className={`w-full pl-10 border-2 rounded-xl px-4 py-3 font-['Roboto'] text-sm outline-none transition-all ${
                        errors.mobileNumber
                          ? 'border-red-400 bg-red-50 focus:border-red-500'
                          : 'border-[#0A6E5A]/30 focus:border-[#0A6E5A] bg-white'
                      }`}
                    />
                  </div>
                  {errors.mobileNumber && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.mobileNumber}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="sm:col-span-2">
                  <label className="block font-['Roboto'] text-xs font-semibold text-[#0A6E5A] uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-['Roboto'] text-gray-600 text-sm">{userDetails.email || '—'}</span>
                  </div>
                </div>

                {/* Address Fields */}
                {(userDetails.address || userDetails.city || userDetails.state) && (
                  <div className="sm:col-span-2">
                    <label className="block font-['Roboto'] text-xs font-semibold text-[#0A6E5A] uppercase tracking-wider mb-1.5">
                      Address
                    </label>
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3">
                      <p className="font-['Roboto'] text-gray-600 text-sm">
                        {[userDetails.address, userDetails.city, userDetails.state, userDetails.pincode]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Transaction Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="bg-linear-to-r from-[#C9A84C] to-[#d4b05a] px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-['Fraunces'] text-xl text-white">Payment Details</h2>
                  <p className="font-['Roboto'] text-white/80 text-xs">Enter your UPI or Bank transfer details</p>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex gap-3">
                  <BadgeIndianRupee className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-['Roboto'] text-sm font-semibold text-amber-700">Payment Instructions</p>
                    <p className="font-['Roboto'] text-xs text-amber-600 mt-1">
                      Please complete payment first, then enter the transaction reference number / UPI transaction ID / Bank transfer details below.
                    </p>
                  </div>
                </div>

                <label className="block font-['Roboto'] text-xs font-semibold text-[#0A6E5A] uppercase tracking-wider mb-1.5">
                  Transaction Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={transactionDetails}
                  onChange={(e) => {
                    setTransactionDetails(e.target.value);
                    if (errors.transactionDetails) setErrors((p) => ({ ...p, transactionDetails: '' }));
                  }}
                  placeholder="Enter UPI Transaction ID, Bank Reference Number, or any payment details..."
                  className={`w-full border-2 rounded-xl px-4 py-3 font-['Roboto'] text-sm outline-none resize-none transition-all ${
                    errors.transactionDetails
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-[#0A6E5A]/30 focus:border-[#0A6E5A] bg-white'
                  }`}
                />
                {errors.transactionDetails && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.transactionDetails}
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="sticky top-6 space-y-4"
            >
              {/* Item Summary */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-[#0A6E5A] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#C9A84C]" />
                    <h3 className="font-['Fraunces'] text-lg text-white">Order Summary</h3>
                  </div>
                </div>

                <div className="p-5">
                  {/* Item Type Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-[#0A6E5A]/10 text-[#0A6E5A] px-3 py-1 rounded-full text-xs font-['Roboto'] font-bold uppercase tracking-wide flex items-center gap-1">
                      {orderType === 'pack' ? <Package className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                      {orderType === 'pack' ? 'Starter Pack' : 'Product'}
                    </span>
                  </div>

                  {/* Item Name */}
                  <h4 className="font-['Fraunces'] text-lg text-[#0A6E5A] leading-snug mb-4">{itemName}</h4>

                  {/* BV / PV */}
                  {(bvValue || pvValue) && (
                    <div className="flex gap-2 mb-4">
                      {bvValue && (
                        <span className="bg-[#0A6E5A] text-white px-3 py-1 rounded-lg text-xs font-['Roboto'] font-semibold">
                          {bvValue} BV
                        </span>
                      )}
                      {pvValue && (
                        <span className="bg-[#C9A84C] text-white px-3 py-1 rounded-lg text-xs font-['Roboto'] font-semibold">
                          {pvValue} PV
                        </span>
                      )}
                    </div>
                  )}

                  <div className="border-t border-dashed border-gray-200 pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-['Roboto'] text-sm text-gray-500">Item Price</span>
                      <span className="font-['Roboto'] text-sm font-semibold text-[#333333]">
                        ₹{itemPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                      <span className="font-['Fraunces'] text-base text-[#0A6E5A] font-semibold">Total Amount</span>
                      <span className="font-['Fraunces'] text-2xl text-[#C9A84C] font-bold">
                        ₹{total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Badges */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-[#0A6E5A]" />
                  <span className="font-['Roboto'] text-sm font-semibold text-[#0A6E5A]">100% Secure Order</span>
                </div>
                <p className="font-['Roboto'] text-xs text-gray-400">
                  Your personal information and transaction details are safe with us.
                </p>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-[#C9A84C] hover:bg-[#b8952f] disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-['Roboto'] font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-[#C9A84C]/30 hover:shadow-xl hover:shadow-[#C9A84C]/40 hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Place Order Now
                  </>
                )}
              </button>

              <p className="text-center font-['Roboto'] text-xs text-gray-400">
                By placing this order, you agree to our{' '}
                <Link href="/terms" className="text-[#0A6E5A] underline">
                  Terms & Conditions
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-[#0A6E5A] animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
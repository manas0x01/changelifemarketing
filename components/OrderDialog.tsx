"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface OrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string | undefined;
  itemPrice: number | undefined;
  orderType: 'product' | 'pack';
  itemId: string;
}

export default function OrderDialog({
  isOpen,
  onClose,
  itemName,
  itemPrice,
  orderType,
  itemId,
}: OrderDialogProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    mobileNumber: '',
    userId: '',
    transactionDetails: '',
  });

  // Fetch user details when dialog opens and user is logged in
  useEffect(() => {
    if (isOpen && session?.user?.name) {
      fetchUserDetails();
    }
  }, [isOpen, session]);

  const fetchUserDetails = async () => {
    setIsFetchingUser(true);
    try {
      const response = await fetch('/api/user/get-profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setFormData((prev) => ({
          ...prev,
          username: userData.user?.username || session?.user?.name || '',
          fullName: userData.user?.fullName || '',
          mobileNumber: userData.user?.mobileNo || '',
          userId: userData.user?.userId || '',
        }));
      } else {
        toast.error('Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Error loading user details');
    } finally {
      setIsFetchingUser(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!formData.fullName.trim()) {
        toast.error('Please enter your full name');
        setIsLoading(false);
        return;
      }

      if (!formData.mobileNumber.trim()) {
        toast.error('Please enter mobile number');
        setIsLoading(false);
        return;
      }

      if (!/^[0-9]{10}$/.test(formData.mobileNumber)) {
        toast.error('Mobile number must be 10 digits');
        setIsLoading(false);
        return;
      }

      if (!formData.transactionDetails.trim()) {
        toast.error('Please enter transaction details');
        setIsLoading(false);
        return;
      }

      // Prepare order data
      const orderData = {
        userId: formData.userId || session?.user?.name || null,
        username: formData.username || session?.user?.name || null,
        name: formData.fullName,
        mobileNumber: formData.mobileNumber,
        transactionDetails: formData.transactionDetails,
        orderType,
        ...(orderType === 'product' && {
          productId: itemId,
          productName: itemName,
          productPrice: itemPrice,
        }),
        ...(orderType === 'pack' && {
          packId: itemId,
          packName: itemName,
          packPrice: itemPrice,
        }),
      };

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create order');
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      toast.success('Order created successfully! We will contact you soon.');

      // Reset form
      setFormData({
        username: '',
        fullName: '',
        mobileNumber: '',
        userId: '',
        transactionDetails: '',
      });

      // Close dialog
      onClose();
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-125 max-h-[90vh] overflow-y-auto bg-[#FFFFFF] scrollbar-hide">
        <DialogHeader className="bg-[#0A6E5A] -mx-6 -mt-6 px-6 py-4 rounded-t-lg">
          <DialogTitle className="text-[#FFFFFF] font-['Fraunces'] text-[1.5rem]">Place Your Order</DialogTitle>
        </DialogHeader>

        {/* Not Logged In Message */}
        {!session && (
          <div className="mb-4 p-4 bg-red-100 border-2 border-red-500 rounded-lg">
            <p className="text-sm text-red-700 font-semibold">
              ⚠️ You must be logged in to place an order. Please login first.
            </p>
          </div>
        )}

        {/* Item Info Box */}
        <div className="mb-6 p-4 bg-[#0A6E5A] rounded-lg">
          <p className="text-sm text-[#FFFFFF] mb-2">
            <strong>Item:</strong> {itemName}
          </p>
          <p className="text-sm text-[#C9A84C] font-semibold">
            <strong>Price:</strong> ₹{itemPrice ? itemPrice.toLocaleString('en-IN') : 'N/A'}
          </p>
        </div>

        {/* Show form only if logged in */}
        {!session ? (
          <div className="text-center py-8">
            <p className="text-[#0A6E5A] font-semibold text-lg">Please log in to continue</p>
            <Button
              onClick={onClose}
              className="mt-4 bg-[#C9A84C] hover:bg-[#0A6E5A] text-[#FFFFFF]"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field - Show if logged in */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-[#0A6E5A]">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                suppressHydrationWarning={true}
                disabled={true}
                className="border-2 border-[#0A6E5A] focus:ring-2 focus:ring-[#C9A84C] focus:border-[#C9A84C] bg-gray-100"
              />
            </div>

            {/* Full Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-[#0A6E5A]">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                suppressHydrationWarning={true}
                disabled={isLoading || isFetchingUser}
                className="border-2 border-[#0A6E5A] focus:ring-2 focus:ring-[#C9A84C] focus:border-[#C9A84C]"
                required
              />
            </div>

            {/* Mobile Number Field */}
            <div className="space-y-2">
              <Label htmlFor="mobileNumber" className="text-sm font-medium text-[#0A6E5A]">
                Mobile Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={formData.mobileNumber}
                onChange={handleChange}
                maxLength={10}
                suppressHydrationWarning={true}
                disabled={isLoading || isFetchingUser}
                className="border-2 border-[#0A6E5A] focus:ring-2 focus:ring-[#C9A84C] focus:border-[#C9A84C]"
                required
              />
            </div>

            {/* User ID Field - Show if logged in */}
            <div className="space-y-2">
              <Label htmlFor="userId" className="text-sm font-medium text-[#0A6E5A]">
                User ID
              </Label>
              <Input
                id="userId"
                name="userId"
                type="text"
                placeholder="User ID"
                value={formData.userId}
                onChange={handleChange}
                suppressHydrationWarning={true}
                disabled={true}
                className="border-2 border-[#0A6E5A] focus:ring-2 focus:ring-[#C9A84C] focus:border-[#C9A84C] bg-gray-100"
              />
            </div>

            {/* Transaction Details Field */}
            <div className="space-y-2">
              <Label htmlFor="transactionDetails" className="text-sm font-medium text-[#0A6E5A]">
                Transaction Details <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="transactionDetails"
                name="transactionDetails"
                placeholder="Enter transaction details (UPI ID, Bank Account details, etc.)"
                value={formData.transactionDetails}
                onChange={handleChange}
                className="w-full px-3 py-2 border-2 border-[#0A6E5A] rounded-md outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-[#C9A84C] resize-none"
                rows={4}
                suppressHydrationWarning={true}
                disabled={isLoading || isFetchingUser}
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading || isFetchingUser}
                className="flex-1 border-2 border-[#0A6E5A] text-[#0A6E5A] hover:bg-[#0A6E5A] hover:text-[#FFFFFF]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isFetchingUser}
                className="flex-1 bg-[#C9A84C] hover:bg-[#0A6E5A] text-[#FFFFFF] font-semibold"
              >
                {isLoading || isFetchingUser ? 'Processing...' : 'Place Order'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

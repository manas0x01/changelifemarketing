"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

export default function PinRequestsPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 md:p-8"
    >
      <div className="mb-8">
        <h1 className="font-['Fraunces'] text-[2rem] md:text-[2.5rem] text-[#0A6E5A] mb-2">Pin Requests</h1>
        <p className="font-['Roboto'] text-[#333333]/60">Manage E-Pin distribution requests</p>
      </div>

      <div className="bg-[#FFFFFF] rounded-lg p-12 border border-[#0A6E5A]/10 text-center">
        <FileText className="w-16 h-16 text-[#C9A84C]/30 mx-auto mb-4" />
        <p className="font-['Roboto'] text-[#333333]/60">Content coming soon</p>
      </div>
    </motion.div>
  );
}

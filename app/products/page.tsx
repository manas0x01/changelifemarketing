"use client";

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-8">Our Products</h1>
          <p className="text-gray-600">Explore our range of natural health products.</p>
        </div>
      </section>
      <Footer />
    </div>
  );
}

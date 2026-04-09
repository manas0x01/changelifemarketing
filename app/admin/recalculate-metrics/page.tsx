"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import Link from 'next/link';

export default function RecalculateMetricsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRecalculateAll = async () => {
    if (!confirm('This will recalculate metrics for ALL users. Continue?')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/calculate-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recalculateAll: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data);
      toast.success(`✅ Recalculated metrics for ${data.processedUsers} users!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to recalculate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Recalculate User Metrics</h1>
          
          <p className="text-gray-600 mb-6">
            Click the button below to recalculate all user metrics (total team, income, etc.). 
            This should be run after adding users to placements.
          </p>

          <button
            onClick={handleRecalculateAll}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors mb-6 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? '⏳ Recalculating...' : '🔄 Recalculate All Metrics'}
          </button>

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="font-bold text-green-900 mb-2">✅ Success!</h2>
              <p className="text-green-800">
                Processed users: <strong>{result.processedUsers}</strong>
              </p>
              <p className="text-green-800 mt-2">
                {result.message}
              </p>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">What does this do?</h3>
            <ul className="text-blue-800 space-y-2">
              <li>✓ Counts left and right downline members</li>
              <li>✓ Calculates basic income from pairs</li>
              <li>✓ Calculates booster income amounts</li>
              <li>✓ Counts direct referrals</li>
              <li>✓ Updates all user totals in database</li>
            </ul>
          </div>

          <div className="mt-8">
            <Link href="/admin/users" className="text-blue-600 hover:underline">
              ← Back to Admin Users
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

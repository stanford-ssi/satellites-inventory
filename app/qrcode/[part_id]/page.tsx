'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function QRCodeRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const partId = params.part_id as string;

  useEffect(() => {
    if (partId) {
      // Redirect to checkout page with the part ID pre-filled
      router.push(`/dashboard/checkout?part=${encodeURIComponent(partId)}`);
    }
  }, [partId, router]);

  return (
    <div className="minimal-layout">
      <div className="minimal-header">
        <div className="flex justify-between items-start">
          <div>
            <h1>QR Code Access</h1>
            <p>Taking you to checkout: {partId}</p>
          </div>
        </div>
      </div>

      <div className="clean-card">
        <div className="text-center py-12">
          <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to checkout...</p>
        </div>
      </div>
    </div>
  );
}
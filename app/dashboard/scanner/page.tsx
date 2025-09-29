'use client';

import { QrCode, Scan } from 'lucide-react';

export default function ScannerPage() {
  return (
    <div className="minimal-layout">
      <div className="minimal-header">
        <div className="flex justify-between items-start">
          <div>
            <h1>QR Scanner</h1>
            <p>Scan QR codes to quickly access inventory items</p>
          </div>
        </div>
      </div>

      <div className="clean-card">
        <div className="text-center py-12">
          <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">QR Scanner</h3>
          <p className="text-gray-500 mb-4">
            Scanner functionality will be implemented here
          </p>
          <button className="github-button github-button-primary">
            <Scan className="h-4 w-4 mr-2" />
            Start Scanner
          </button>
        </div>
      </div>
    </div>
  );
}
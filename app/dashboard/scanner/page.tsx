'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Scan, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const router = useRouter();

  const startScanner = () => {
    setIsScanning(true);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          console.log('QR Code scanned:', decodedText);

          // Stop the scanner
          stopScanner();

          // Navigate to the scanned URL or part
          if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
            try {
              const url = new URL(decodedText);
              // Check if it's a QR code URL (e.g., /qrcode/PART-123)
              if (url.pathname.startsWith('/qrcode/')) {
                const partId = decodeURIComponent(url.pathname.replace('/qrcode/', ''));
                router.push(`/dashboard/checkout?part=${encodeURIComponent(partId)}`);
              } else if (url.pathname.startsWith('/dashboard/')) {
                router.push(url.pathname);
              } else {
                router.push(decodedText);
              }
            } catch (error) {
              console.error('Invalid URL:', error);
              router.push(`/dashboard/checkout?part=${encodeURIComponent(decodedText)}`);
            }
          } else {
            // Assume it's a part ID or code, navigate to checkout with the part pre-filled
            router.push(`/dashboard/checkout?part=${encodeURIComponent(decodedText)}`);
          }
        },
        (error) => {
          // Ignore errors - they happen frequently during scanning
          console.debug('QR scan error:', error);
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [isScanning, router]);

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
        {!isScanning ? (
          <div className="text-center py-12">
            <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">QR Scanner</h3>
            <p className="text-gray-500 mb-4">
              Click the button below to start scanning QR codes
            </p>
            <button
              className="github-button github-button-primary"
              onClick={startScanner}
            >
              <Scan className="h-4 w-4 mr-2" />
              Start Scanner
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Scanning...</h3>
              <button
                className="github-button github-button-sm"
                onClick={stopScanner}
              >
                <X className="h-3 w-3 mr-1" />
                Stop
              </button>
            </div>
            <div id="qr-reader" className="w-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}
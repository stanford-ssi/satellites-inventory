'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { getQrCodeUrl, config } from '@/lib/config';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  partId: string;
  description: string;
}

export function QrCodeModal({ isOpen, onClose, partId, description }: QrCodeModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const qrUrl = getQrCodeUrl(partId);

  useEffect(() => {
    if (isOpen && partId) {
      generateQrCode();
    }
  }, [isOpen, partId]);

  const generateQrCode = async () => {
    setLoading(true);
    try {
      const dataUrl = await QRCode.toDataURL(qrUrl, {
        width: config.qrCode.size,
        margin: config.qrCode.margin,
        color: config.qrCode.color,
        errorCorrectionLevel: 'M'
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.download = `qr-code-${partId}.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code for {description}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Display */}
          <div className="flex justify-center p-4 bg-white rounded-lg border">
            {loading ? (
              <div className="flex items-center justify-center w-64 h-64">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt={`QR Code for ${partId}`}
                className="w-64 h-64"
              />
            ) : (
              <div className="flex items-center justify-center w-64 h-64 text-gray-400">
                Failed to generate QR code
              </div>
            )}
          </div>

          {/* Part Info */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">Part ID: <span className="font-mono">{partId}</span></p>
            <p className="text-xs text-gray-500 break-all font-mono">{qrUrl}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              className="flex-1"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!qrCodeDataUrl}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Scan this QR code with any camera to access this inventory item
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
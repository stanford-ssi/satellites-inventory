// Configuration for QR code generation and other app settings

export const config = {
  // Base URL for QR codes - automatically uses localhost in dev, production URL in prod
  qrCodeBaseUrl: process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://sats.stanfordssi.org/inventory'
      : 'http://localhost:3000/inventory'),

  // QR code settings
  qrCode: {
    size: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  }
} as const;

// Helper function to generate QR code URL for a part
export function getQrCodeUrl(partId: string): string {
  return `${config.qrCodeBaseUrl}/qrcode/${encodeURIComponent(partId)}`;
}
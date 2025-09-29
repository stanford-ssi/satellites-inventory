// Configuration for QR code generation and other app settings

export const config = {
  // Base URL for QR codes - change this to your production domain
  qrCodeBaseUrl: 'http://localhost:3000',

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
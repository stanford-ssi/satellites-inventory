import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { getQrCodeUrl, config } from '@/lib/config';

export interface PartForQR {
  part_id: string;
  description: string;
}

/**
 * Generates a PDF with QR codes for multiple parts
 * @param parts Array of parts to generate QR codes for
 * @param fileName Name of the PDF file to download
 */
export async function generateBulkQrPdf(parts: PartForQR[], fileName: string = 'parts-qr-codes.pdf') {
  if (parts.length === 0) {
    throw new Error('No parts provided');
  }

  // Create a new PDF document (Letter size: 8.5" x 11" = 215.9mm x 279.4mm)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const margin = 15;
  const qrSize = 50; // QR code size in mm
  const spacing = 10; // Space between QR codes
  const textHeight = 15; // Height reserved for text below QR code
  const itemHeight = qrSize + textHeight;

  // Calculate grid layout - 3 columns x 4 rows
  const cols = 3;
  const rows = 4;
  const itemsPerPage = cols * rows;

  const colWidth = (pageWidth - 2 * margin) / cols;
  const rowHeight = (pageHeight - 2 * margin) / rows;

  let currentPage = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const pageIndex = Math.floor(i / itemsPerPage);
    const itemIndex = i % itemsPerPage;

    // Add new page if needed
    if (pageIndex > currentPage) {
      pdf.addPage();
      currentPage = pageIndex;
    }

    // Calculate position
    const col = itemIndex % cols;
    const row = Math.floor(itemIndex / cols);
    const x = margin + col * colWidth;
    const y = margin + row * rowHeight;

    // Center the QR code in its cell
    const qrX = x + (colWidth - qrSize) / 2;
    const qrY = y + 5;

    try {
      // Generate QR code as data URL
      const qrUrl = getQrCodeUrl(part.part_id);
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 512,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      // Add QR code to PDF
      pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      // Add part ID below QR code (bold)
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      const partIdY = qrY + qrSize + 4;
      const partIdText = part.part_id;
      const partIdWidth = pdf.getTextWidth(partIdText);
      const partIdX = x + (colWidth - partIdWidth) / 2;
      pdf.text(partIdText, partIdX, partIdY);

      // Add description below part ID (normal weight, smaller, truncated if needed)
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      const descY = partIdY + 3.5;
      let description = part.description;

      // Truncate description if too long to fit in the cell width
      const maxWidth = colWidth - 4;
      while (pdf.getTextWidth(description) > maxWidth && description.length > 0) {
        description = description.slice(0, -1);
      }
      if (description.length < part.description.length) {
        description = description.trim() + '...';
      }

      const descWidth = pdf.getTextWidth(description);
      const descX = x + (colWidth - descWidth) / 2;
      pdf.text(description, descX, descY);

    } catch (error) {
      console.error(`Failed to generate QR code for part ${part.part_id}:`, error);

      // Add error message
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Error generating QR', qrX + 5, qrY + qrSize / 2);
    }
  }

  // Add header to first page
  pdf.setPage(1);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(128, 128, 128);
  pdf.text(`Generated: ${new Date().toLocaleDateString()} • ${parts.length} part${parts.length !== 1 ? 's' : ''}`, margin, margin - 5);
  pdf.setTextColor(0, 0, 0);

  // Download the PDF
  pdf.save(fileName);
}

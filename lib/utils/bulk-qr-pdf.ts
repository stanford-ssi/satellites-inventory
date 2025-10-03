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
 * @param columns Number of columns per page (default: 3)
 */
export async function generateBulkQrPdf(parts: PartForQR[], fileName: string = 'parts-qr-codes.pdf', columns: number = 3) {
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

  // Calculate grid layout - configurable columns
  const cols = Math.max(1, Math.min(columns, 5)); // Clamp between 1-5 columns
  const rows = 4;
  const itemsPerPage = cols * rows;

  const colWidth = (pageWidth - 2 * margin) / cols;
  const rowHeight = (pageHeight - 2 * margin) / rows;

  // Dynamically scale QR code size based on available space
  // For 2 columns, use larger QR codes (up to 70mm), for 5 columns keep smaller
  const maxQrSize = Math.min(colWidth - 8, rowHeight - 15); // Leave room for text and padding
  const minSize = cols <= 2 ? 50 : 30; // Larger minimum for 2 columns
  const maxSize = cols <= 2 ? 70 : 60; // Larger maximum for 2 columns
  const qrSize = Math.max(minSize, Math.min(maxSize, maxQrSize));
  const textHeight = rowHeight - qrSize - 5; // Remaining space for text

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

      // Scale font sizes based on QR code size
      const partIdFontSize = Math.max(6, Math.min(9, qrSize / 6));
      const descFontSize = Math.max(5, Math.min(7, qrSize / 8));
      const lineHeight = descFontSize * 0.45;

      // Add part ID below QR code (bold)
      pdf.setFontSize(partIdFontSize);
      pdf.setFont('helvetica', 'bold');
      const partIdY = qrY + qrSize + 4;
      const partIdText = part.part_id;
      const partIdWidth = pdf.getTextWidth(partIdText);
      const partIdX = x + (colWidth - partIdWidth) / 2;
      pdf.text(partIdText, partIdX, partIdY);

      // Add description below part ID (normal weight, smaller, wrapped to multiple lines)
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(descFontSize);
      const descY = partIdY + 3.5;
      // Wrap text to QR code width (slightly wider for better use of space)
      const maxWidth = Math.min(qrSize, colWidth - 6);

      // Split description into multiple lines if needed
      const words = part.description.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = pdf.getTextWidth(testLine);

        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          // If current line has content, push it
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            // Single word is too long, force it and break
            lines.push(word);
            currentLine = '';
          }
        }
      }
      if (currentLine) lines.push(currentLine);

      // Limit to max 3 lines to prevent overflow
      const maxLines = 3;
      const displayLines = lines.slice(0, maxLines);

      // Draw each line centered
      displayLines.forEach((line, index) => {
        const lineWidth = pdf.getTextWidth(line);
        const lineX = x + (colWidth - lineWidth) / 2;
        pdf.text(line, lineX, descY + (index * lineHeight));
      });

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
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(128, 128, 128);
  pdf.text(`Generated: ${new Date().toLocaleDateString()} • ${parts.length} part${parts.length !== 1 ? 's' : ''} • ${cols} columns`, margin, margin - 5);
  pdf.setTextColor(0, 0, 0);

  // Download the PDF
  pdf.save(fileName);
}

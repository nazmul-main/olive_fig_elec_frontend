import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoicePDF = async (sale) => {
  return new Promise((resolve) => {
    const doc = new jsPDF();
    
    // Theme Colors
    const brandGreen = [139, 168, 63]; 
    const darkText = [20, 20, 20];
    const lightText = [120, 120, 120];

    // Helper to draw text easily
    const addText = (text, x, y, size = 10, weight = 'normal', color = darkText, align = 'left') => {
      doc.setFontSize(size);
      doc.setFont('helvetica', weight);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(String(text), x, y, { align });
    };

    const buildPDF = (logoImg) => {
      // 1. Header Area
      addText('INVOICE', 20, 25, 32, 'bold', [0, 0, 0]);

      if (logoImg) {
        // Render image (assuming wide aspect ratio)
        doc.addImage(logoImg, 'PNG', 130, 8, 60, 22);
      } else {
        // Fallback text if logo fails to load
        addText('Olive & Fig', 140, 20, 18, 'bold', [114, 52, 114]);
        addText('Electronics', 140, 26, 12, 'normal', brandGreen);
      }

      // Horizontal Line
      doc.setDrawColor(brandGreen[0], brandGreen[1], brandGreen[2]);
      doc.setLineWidth(1.5);
      doc.line(20, 35, 190, 35);

      // 2. Billing details
      const startY = 48;
      addText((sale.customerName || 'Walk-in Customer').toUpperCase(), 20, startY, 12, 'bold', darkText);
      
      const phoneText = sale.customerPhone ? sale.customerPhone : 'N/A';
      addText(`Address: ${phoneText}`, 20, startY + 6, 9, 'normal', lightText);

      addText(`Invoice No: ${sale.invoiceNo}`, 190, startY, 9, 'bold', darkText, 'right');
      addText(`Date: ${new Date(sale.saleDate).toLocaleDateString()}`, 190, startY + 5, 9, 'normal', lightText, 'right');

      // 3. Table Configuration
      const tableData = sale.items.map(item => {
        // Ensure unit price is exactly unit price, total is quantity * unit price
        const unitPrice = Number(item.salePrice || 0);
        const qty = Number(item.quantity || 1);
        const total = unitPrice * qty;

        return [
          item.productName || 'Unknown Product',
          qty,
          unitPrice.toLocaleString(),
          total.toLocaleString()
        ];
      });

      autoTable(doc, {
        startY: 65,
        head: [['ITEM DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL']],
        body: tableData,
        theme: 'plain',
        headStyles: {
          fillColor: [245, 245, 245], 
          textColor: [50, 50, 50],
          fontSize: 9,
          fontStyle: 'bold',
          cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [20, 20, 20],
          cellPadding: { top: 4, bottom: 4, left: 4, right: 4 }
        },
        columnStyles: {
          0: { cellWidth: 80, halign: 'left' },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { halign: 'right' }
        },
        margin: { left: 20, right: 20, bottom: 90 } // Prevents overlapping with totals
      });

      let finalY = doc.lastAutoTable.finalY + 5;
      
      // If table ends too close to the bottom, force a new page for the totals summary!
      if (finalY > 190) {
        doc.addPage();
        finalY = 20; // reset to top
      }
      
      // Bottom line for table / summary separation
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(20, finalY, 190, finalY);
      
      finalY += 15;

      // 4. Payment Info (Left)
      addText('Payment Method:', 20, finalY, 9, 'bold', lightText);
      addText((sale.paymentMethod || 'Cash').toUpperCase(), 20, finalY + 6, 10, 'bold', darkText);
      
      addText(`Sales Agent: ${sale.soldBy?.name || 'Admin'}`, 20, finalY + 16, 9, 'normal', lightText);
      if (sale.note) {
         addText(`Note: ${sale.note}`, 20, finalY + 22, 9, 'normal', lightText);
      }

      // 5. Totals Info (Right)
      const sumX = 145;
      const sumValX = 190;
      
      const safeVat = Number(sale.vat) || 0;
      const safeVatAmount = Number(sale.vatAmount) || 0;
      const safeDiscount = Number(sale.discount) || 0;
      const safeSubtotal = Number(sale.subtotal || sale.grandTotal) || 0;
      const safeTotal = Number(sale.grandTotal) || 0;

      addText('Sub-total :', sumX, finalY, 9, 'normal', lightText);
      addText(safeSubtotal.toLocaleString(), sumValX, finalY, 9, 'normal', darkText, 'right');

      if (safeVatAmount > 0) {
        addText(`Tax (${safeVat}%) :`, sumX, finalY + 6, 9, 'normal', lightText);
        addText(safeVatAmount.toLocaleString(), sumValX, finalY + 6, 9, 'normal', darkText, 'right');
      }

      if (safeDiscount > 0) {
        addText('Discount :', sumX, finalY + 12, 9, 'normal', lightText);
        addText(`-${safeDiscount.toLocaleString()}`, sumValX, finalY + 12, 9, 'normal', darkText, 'right');
      }

      // Thick line before grand total
      doc.setDrawColor(200, 200, 200);
      doc.line(sumX, finalY + 18, sumValX, finalY + 18);

      addText('Total :', sumX, finalY + 24, 11, 'bold', darkText);
      addText(safeTotal.toLocaleString(), sumValX, finalY + 24, 11, 'bold', darkText, 'right');

      // 6. Draw Footer across all generated Pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const footerY = 275;
        
        // Page Number Indicator
        addText(`Page ${i} of ${totalPages}`, 20, footerY - 15, 8, 'italic', lightText);

        addText('Thank you for purchase!', 20, footerY, 14, 'bold', darkText);
        addText(sale.soldBy?.name?.toUpperCase() || 'ADMINISTRATOR', 190, footerY - 5, 11, 'bold', darkText, 'right');
        addText('Administrator', 190, footerY, 9, 'normal', lightText, 'right');
      }

      doc.save(`Invoice_${sale.invoiceNo}.pdf`);
      resolve();
    };

    // Load Image Asynchronously before drawing PDF
    const logoImg = new Image();
    logoImg.crossOrigin = "Anonymous";
    logoImg.src = '/logo-invoice.png';
    logoImg.onload = () => buildPDF(logoImg);
    logoImg.onerror = () => buildPDF(null);
  });
};

import React, { forwardRef } from 'react';

const InvoicePrint = forwardRef(({ invoiceData }, ref) => {
  if (!invoiceData) return null;

  return (
    <div className="hidden print-only" ref={ref}>
      <style type="text/css" media="print">
        {`
          @page { size: auto; margin: 20mm; }
          body { font-family: sans-serif; color: #000; }
        `}
      </style>
      <div className="p-8 max-w-3xl mx-auto border border-gray-200">
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold">Olive & Fig Electronics</h1>
          <p className="text-sm">123 Tech Avenue, Dhaka, Bangladesh</p>
          <p className="text-sm">Phone: +880 1234 567890</p>
        </div>

        <div className="flex justify-between mb-8">
          <div>
            <p className="font-bold">Bill To:</p>
            <p>{invoiceData.customerName || 'Walk-in Customer'}</p>
            <p>{invoiceData.customerPhone || ''}</p>
          </div>
          <div className="text-right">
            <p><span className="font-bold">Invoice #:</span> {invoiceData.invoiceNo}</p>
            <p><span className="font-bold">Date:</span> {new Date(invoiceData.saleDate || new Date()).toLocaleDateString()}</p>
            <p><span className="font-bold">Payment Method:</span> <span className="capitalize">{invoiceData.paymentMethod}</span></p>
          </div>
        </div>

        <table className="w-full mb-8 text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="py-2">Item</th>
              <th className="py-2">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items?.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-2">{item.productName} <br/><span className="text-xs text-gray-500">{item.sku}</span></td>
                <td className="py-2">{item.quantity}</td>
                <td className="py-2 text-right">৳{item.salePrice}</td>
                <td className="py-2 text-right">৳{item.subtotal}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-1">
              <span>Subtotal:</span>
              <span>৳{invoiceData.subtotal}</span>
            </div>
            {invoiceData.discount > 0 && (
              <div className="flex justify-between py-1">
                <span>Discount:</span>
                <span>-৳{invoiceData.discount}</span>
              </div>
            )}
             {invoiceData.vatAmount > 0 && (
              <div className="flex justify-between py-1">
                <span>VAT ({invoiceData.vat}%):</span>
                <span>+৳{invoiceData.vatAmount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 border-gray-800 font-bold text-lg mt-2 transform scale-105">
              <span>Grand Total:</span>
              <span>৳{invoiceData.grandTotal}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-4 border-t text-sm text-center">
          <p>Thank you for your business!</p>
          <p>Goods sold are not returnable without a valid receipt.</p>
        </div>
      </div>
    </div>
  );
});

InvoicePrint.displayName = 'InvoicePrint';

export default InvoicePrint;


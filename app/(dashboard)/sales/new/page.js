'use client';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import InvoicePrint from '@/components/Invoice/InvoicePrint';

export default function NewSalePOS() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [vat, setVat] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get(`/products?search=${search}&limit=10`);
      if (data.success) {
         setProducts(data.products.filter(p => p.stockQuantity > 0)); // Only show in-stock
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.product === product._id);
    if (existing) {
      if (existing.quantity >= product.stockQuantity) {
        return toast.error('Insufficient stock');
      }
      setCart(cart.map(item => item.product === product._id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { 
        product: product._id, 
        productName: product.name, 
        sku: product.sku, 
        salePrice: product.salePrice, 
        maxStock: product.stockQuantity, 
        quantity: 1 
      }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.product === id) {
        const newQty = item.quantity + delta;
        if (newQty > item.maxStock) {
           toast.error('Cannot exceed available stock');
           return item;
        }
        if (newQty < 1) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.product !== id));

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.salePrice * item.quantity), 0);
  const vatAmount = ((subtotal - Number(discount)) * Number(vat)) / 100;
  const grandTotal = subtotal - Number(discount) + vatAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    
    setLoading(true);
    try {
      const payload = {
        customerName,
        customerPhone,
        items: cart.map(i => ({ product: i.product, quantity: i.quantity })),
        discount: Number(discount),
        vat: Number(vat),
        paymentMethod,
        note
      };
      
      const { data } = await api.post('/sales', payload);
      
      if (data.success) {
        toast.success('Sale Completed Successfully!');
        setCompletedInvoice(data.sale);
        
        // Reset state
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setDiscount(0);
        setVat(0);
        setNote('');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewSale = () => {
     setCompletedInvoice(null);
     fetchProducts(); // Refresh stock
  };

  if (completedInvoice) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-6 shadow rounded text-center">
         <h2 className="text-2xl text-green-600 font-bold mb-4">Sale Completed!</h2>
         <p className="mb-8 font-medium">Invoice: {completedInvoice.invoiceNo}</p>
         
         <div className="flex justify-center space-x-4 mb-4 no-print">
            <button onClick={handlePrint} className="bg-indigo-600 text-white px-6 py-2 rounded shadow hover:bg-indigo-700">Print Invoice</button>
            <button onClick={handleNewSale} className="bg-gray-200 text-gray-800 px-6 py-2 rounded shadow hover:bg-gray-300">New Sale</button>
         </div>

         {/* Invisible component that only shows during print */}
         <InvoicePrint invoiceData={completedInvoice} />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Product Selection side */}
      <div className="w-full lg:w-2/3 bg-white shadow rounded-lg p-4 flex flex-col">
        <input 
          type="text" 
          placeholder="Search product by name or SKU..." 
          className="w-full border border-gray-300 px-4 py-2 rounded focus:ring-brand mb-4"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4 auto-rows-max p-1">
          {products.map(p => (
            <div key={p._id} onClick={() => addToCart(p)} className="border rounded p-3 cursor-pointer hover:shadow hover:border-brand transition-all flex flex-col justify-between h-32">
              <div>
                <p className="font-medium text-gray-800 line-clamp-2 text-sm">{p.name}</p>
                <p className="text-xs text-gray-500 mt-1">{p.sku}</p>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-indigo-600">৳{p.salePrice}</span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">{p.stockQuantity} qty</span>
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="col-span-full text-center text-gray-500 mt-10">No products found matching "{search}"</p>}
        </div>
      </div>

      {/* Cart & Checkout Side */}
      <div className="w-full lg:w-1/3 bg-white shadow rounded-lg p-4 flex flex-col">
        <h2 className="text-lg font-semibold border-b pb-2">Current Sale</h2>
        
        <div className="flex-1 overflow-y-auto py-4">
          {cart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-400">Cart is empty</div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.product} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                    <p className="text-xs text-gray-500">৳{item.salePrice}</p>
                  </div>
                  <div className="flex items-center space-x-2 mx-2">
                    <button onClick={() => updateQuantity(item.product, -1)} className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">-</button>
                    <span className="text-sm w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product, 1)} className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">+</button>
                  </div>
                  <div className="text-sm font-medium w-16 text-right">
                    ৳{item.salePrice * item.quantity}
                  </div>
                  <button onClick={() => removeFromCart(item.product)} className="text-red-500 ml-2">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-4 space-y-3 text-sm">
           <div className="grid grid-cols-2 gap-2">
             <input type="text" placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="border px-2 py-1 rounded w-full" />
             <input type="text" placeholder="Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="border px-2 py-1 rounded w-full" />
           </div>
           
           <div className="flex justify-between py-1 text-gray-600"><span>Subtotal</span> <span>৳{subtotal}</span></div>
           
           <div className="flex items-center justify-between">
              <span className="text-gray-600">Discount (৳)</span>
              <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} className="w-20 border px-2 py-1 rounded text-right" />
           </div>
           <div className="flex items-center justify-between">
              <span className="text-gray-600">VAT (%)</span>
              <input type="number" min="0" value={vat} onChange={e => setVat(e.target.value)} className="w-20 border px-2 py-1 rounded text-right" />
           </div>
           
           <div className="flex justify-between py-2 text-lg font-bold border-y border-dashed mt-2">
              <span>Grand Total</span>
              <span className="text-brand">৳{grandTotal.toFixed(2)}</span>
           </div>

           <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border rounded p-2 mt-2">
             <option value="cash">Cash</option>
             <option value="bkash">bKash</option>
             <option value="nagad">Nagad</option>
             <option value="card">Card</option>
           </select>

           <button 
             onClick={handleCheckout} 
             disabled={loading || cart.length === 0} 
             className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 disabled:opacity-50 mt-4"
           >
             {loading ? 'Processing...' : 'Complete Sale'}
           </button>
        </div>
      </div>
    </div>
  );
}



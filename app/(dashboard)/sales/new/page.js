'use client';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import InvoicePrint from '@/components/Invoice/InvoicePrint';
import { Trash2 } from 'lucide-react';

export default function NewSalePOS() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [discount, setDiscount] = useState(0);
  const [vat, setVat] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(true);

  const [loading, setLoading] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [search]);

  // Auto-fill customer data when phone number is entered
  useEffect(() => {
    if (customerPhone.length >= 11) {
      const timer = setTimeout(async () => {
        try {
          const { data } = await api.get(`/customers?search=${customerPhone}`);
          if (data.success && data.customers.length > 0) {
            const cust = data.customers[0];
            if (cust.phone === customerPhone) {
              setCustomerName(cust.name);
              setCustomerEmail(cust.email || '');
              setCustomerAddress(cust.address || '');
              setIsNewCustomer(false);
              toast.success('Existing customer found!');
            }
          } else {
            setIsNewCustomer(true);
          }
        } catch (e) {
          console.error('Error fetching customer', e);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [customerPhone]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get(`/products?search=${search}&limit=100`);
      if (data.success) {
         setProducts(data.products.filter(p => p.stockQuantity > 0)); // Only show in-stock
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addToCart = (product) => {
    // Check total stock for this product in cart
    const totalInCart = cart.filter(item => item.product === product._id).length;
    if (totalInCart >= product.stockQuantity) {
      return toast.error('Insufficient stock');
    }

    setCart([...cart, { 
      cartId: `${product._id}-${Date.now()}-${Math.random()}`, // Unique ID for this row
      product: product._id, 
      productName: product.name, 
      code: product.code, 
      salePrice: product.salePrice, 
      quantity: 1,
      serialNumbers: [] 
    }]);
  };

  const removeFromCart = (cartId) => setCart(cart.filter(item => item.cartId !== cartId));

  const updateSerials = (cartId, serialsString) => {
    // For single-unit rows, we just store whatever is typed in the specific box
    // But we'll keep it as an array for logic consistency
    const serialsArray = serialsString.split(',').map(s => s.trim()).filter(s => s !== '');
    setCart(cart.map(item => item.cartId === cartId ? { ...item, serialNumbers: serialsArray } : item));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.salePrice * item.quantity), 0);
  const vatAmount = ((subtotal - Number(discount)) * Number(vat)) / 100;
  const grandTotal = subtotal - Number(discount) + vatAmount;

  // Sync paidAmount with grandTotal if it hasn't been manually touched or is 0
  useEffect(() => {
    if (paidAmount === 0 || paidAmount > grandTotal) {
       // setPaidAmount(grandTotal); // removed to avoid infinite loop or UX frustration
    }
  }, [grandTotal]);

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    
    setLoading(true);
    try {
      const payload = {
        customerName: customerName || 'Walk-in Customer',
        customerPhone,
        customerEmail,
        customerAddress,
        items: cart.map(i => ({ 
            product: i.product, 
            quantity: i.quantity,
            serialNumbers: i.serialNumbers 
        })),
        discount: Number(discount),
        vat: Number(vat),
        paidAmount: Number(paidAmount),
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
        setCustomerEmail('');
        setCustomerAddress('');
        setDiscount(0);
        setVat(0);
        setPaidAmount(0);
        setNote('');
        setIsNewCustomer(true);
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
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-6 shadow rounded text-center transition-colors duration-300">
         <h2 className="text-2xl text-green-600 dark:text-green-400 font-bold mb-4">Sale Completed!</h2>
         <p className="mb-8 font-medium text-gray-700 dark:text-gray-300">Invoice: {completedInvoice.invoiceNo}</p>
         
         <div className="flex justify-center space-x-4 mb-4 no-print">
            <button onClick={handlePrint} className="bg-indigo-600 dark:bg-brand text-white px-6 py-2 rounded shadow hover:bg-indigo-700 dark:hover:bg-brand-dark transition-colors">Print Invoice</button>
            <button onClick={handleNewSale} className="bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 px-6 py-2 rounded shadow hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors">New Sale</button>
         </div>

         {/* Invisible component that only shows during print */}
         <InvoicePrint invoiceData={completedInvoice} />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Product Selection side */}
      <div className="w-full lg:w-2/3 bg-white dark:bg-slate-800 shadow rounded-lg p-4 flex flex-col transition-colors duration-300">
        <input 
          type="text" 
          placeholder="Search product by name or Code..." 
          className="w-full border border-gray-300 dark:border-slate-600 px-4 py-2 rounded focus:ring-brand mb-4 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4 auto-rows-max p-1">
          {products.map(p => (
            <div key={p._id} onClick={() => addToCart(p)} className="border dark:border-slate-700 rounded p-3 cursor-pointer hover:shadow hover:border-brand dark:hover:border-brand transition-all flex flex-col justify-between h-32 bg-gray-50/30 dark:bg-slate-900/10">
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-100 line-clamp-2 text-sm">{p.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{p.code}</p>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-brand dark:text-brand">৳{p.salePrice}</span>
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">{p.stockQuantity} qty</span>
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="col-span-full text-center text-gray-500 mt-10">No products found matching "{search}"</p>}
        </div>
      </div>

      {/* Cart & Checkout Side */}
      <div className="w-full lg:w-1/3 bg-white dark:bg-slate-800 shadow rounded-lg p-4 flex flex-col transition-colors duration-300">
        <h2 className="text-lg font-semibold border-b border-gray-100 dark:border-slate-700 pb-2 text-gray-900 dark:text-white">Current Sale</h2>
        
        <div className="flex-1 overflow-y-auto py-4">
          {cart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-400">Cart is empty</div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.cartId} className="p-3 border dark:border-slate-700 rounded-lg space-y-2 bg-gray-50/50 dark:bg-slate-900/20">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{item.productName}</p>
                      <p className="text-xs text-brand">৳{item.salePrice}</p>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(item.cartId)} 
                      className="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 p-2 rounded-md ml-2 transition-colors flex items-center justify-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  {/* Serial Number Input */}
                  <div className="mt-1">
                    <input 
                      type="text" 
                      placeholder="Serial/IMEI Number" 
                      className="w-full text-xs border dark:border-slate-600 px-2 py-1.5 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-brand/50 focus:ring-1 focus:ring-brand outline-none"
                      value={item.serialNumbers.join(', ')}
                      onChange={(e) => updateSerials(item.cartId, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-slate-700 pt-4 space-y-3 text-sm">
           <div className="space-y-2">
             <div className="relative">
               <input 
                 type="text" 
                 placeholder="Phone Number (Auto-fill)" 
                 value={customerPhone} 
                 onChange={e => setCustomerPhone(e.target.value)} 
                 className={`border px-2 py-2 rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all ${!isNewCustomer ? 'border-green-500 ring-1 ring-green-500' : 'dark:border-slate-600'}`} 
               />
               {!isNewCustomer && <span className="absolute right-2 top-2 text-[10px] bg-green-500 text-white px-1 rounded">Old Customer</span>}
             </div>
             
             <input 
               type="text" 
               placeholder="Customer Name" 
               value={customerName} 
               onChange={e => setCustomerName(e.target.value)} 
               className="border dark:border-slate-600 px-2 py-2 rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" 
             />

             <div className="grid grid-cols-2 gap-2">
               <input 
                 type="email" 
                 placeholder="Email (Optional)" 
                 value={customerEmail} 
                 onChange={e => setCustomerEmail(e.target.value)} 
                 className="border dark:border-slate-600 px-2 py-1 rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-xs" 
               />
               <input 
                 type="text" 
                 placeholder="Address" 
                 value={customerAddress} 
                 onChange={e => setCustomerAddress(e.target.value)} 
                 className="border dark:border-slate-600 px-2 py-1 rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-xs" 
               />
             </div>
           </div>
           
           <div className="flex justify-between py-1 text-gray-600 dark:text-slate-400"><span>Subtotal</span> <span>৳{subtotal}</span></div>
           
           <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-slate-400">Discount (৳)</span>
              <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} className="w-20 border dark:border-slate-600 px-2 py-1 rounded text-right bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
           </div>
           <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-slate-400">VAT (%)</span>
              <input type="number" min="0" value={vat} onChange={e => setVat(e.target.value)} className="w-20 border dark:border-slate-600 px-2 py-1 rounded text-right bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
           </div>
           
           <div className="flex justify-between py-2 text-lg font-bold border-y border-dashed border-gray-200 dark:border-slate-700 mt-2">
              <span className="text-gray-900 dark:text-white">Grand Total</span>
              <span className="text-brand">৳{grandTotal.toFixed(2)}</span>
           </div>

           <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded">
              <span className="font-bold text-gray-700 dark:text-yellow-500">Paid Amount</span>
              <div className="flex items-center space-x-2">
                 <button onClick={() => setPaidAmount(grandTotal)} className="text-[10px] bg-gray-200 dark:bg-slate-600 px-1 rounded">Full</button>
                 <input type="number" min="0" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-24 border border-yellow-300 dark:border-yellow-700 px-2 py-1 rounded text-right font-bold bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
              </div>
           </div>

           {grandTotal - paidAmount > 0 && (
             <div className="flex justify-between text-red-500 font-medium px-2 italic">
               <span>Balance Due:</span>
               <span>৳{(grandTotal - paidAmount).toFixed(2)}</span>
             </div>
           )}

           <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border dark:border-slate-600 rounded p-2 mt-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors">
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



'use client';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import InvoicePrint from '@/components/Invoice/InvoicePrint';
import { Trash2, Search, ShoppingCart, Plus } from 'lucide-react';

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
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50/50 dark:bg-slate-900/20 p-2 sm:p-4 overflow-hidden shadow-inner">
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-2 sm:gap-4">
        {/* Left Side: Main Cart Area */}
        <div className="flex-1 lg:w-[70%] xl:w-[75%] flex flex-col space-y-2 overflow-hidden">
          {/* Top Search Bar */}
          <div className="relative group" ref={searchRef}>
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border dark:border-slate-700 flex items-center focus-within:ring-2 focus-within:ring-brand/20 transition-all">
              <div className="p-2.5 text-gray-400 group-focus-within:text-brand transition-colors">
                <Search size={20} />
              </div>
              <input 
                type="text" 
                placeholder="Product name / Code..." 
                className="flex-1 bg-transparent border-none outline-none py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400" 
                value={search} 
                onFocus={() => setShowSearchDropdown(true)}
                onChange={e => {
                  setSearch(e.target.value);
                  setShowSearchDropdown(true);
                }} 
              />
              <div className="px-3 border-l dark:border-slate-700 hidden md:flex items-center gap-1.5">
                 <ShoppingCart size={14} className="text-gray-400" />
                 <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">{cart.length}</span>
              </div>
            </div>

            {/* Dropdown - Compact */}
            {showSearchDropdown && search.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border dark:border-slate-700 z-50 overflow-hidden">
                <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                  {products.length > 0 ? (
                    products.map(p => (
                      <div 
                        key={p._id} 
                        onClick={() => { addToCart(p); setShowSearchDropdown(false); setSearch(''); }}
                        className="p-3 flex justify-between items-center hover:bg-brand/5 cursor-pointer border-b last:border-0 dark:border-slate-700 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-md flex items-center justify-center text-sm">📦</div>
                           <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand transition-colors">{p.name}</p>
                              <p className="text-[10px] text-gray-400">{p.brand} • {p.code}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-bold text-brand">৳{p.salePrice}</p>
                           <p className={`text-[9px] font-medium ${p.stockQuantity < 5 ? 'text-red-500' : 'text-green-500'}`}>S: {p.stockQuantity}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-gray-400 italic">No products found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Compact Cart Table - SCROLLABLE AFTER 3 ITEMS ON MOBILE */}
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 flex flex-col overflow-hidden lg:min-h-0">
            <div className="flex-1 overflow-auto custom-scrollbar max-h-[250px] lg:max-h-none">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400/50 space-y-2 py-10">
                   <ShoppingCart size={40} strokeWidth={1.5} />
                   <p className="text-xs">Select product to start</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead className="sticky top-0 bg-white dark:bg-slate-800 border-b dark:border-slate-700 z-10">
                    <tr className="text-[10px] uppercase font-bold text-gray-400">
                      <th className="px-4 py-3 w-12">#</th>
                      <th className="px-4 py-3">Product Info</th>
                      <th className="px-4 py-3 w-32">Price</th>
                      <th className="px-4 py-3 w-80">Serial / IMEI Number</th>
                      <th className="px-4 py-3 text-center w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-700">
                    {cart.map((item, index) => (
                      <tr key={item.cartId} className="hover:bg-gray-50 dark:hover:bg-slate-900/20 text-sm group">
                        <td className="px-4 py-2 font-medium text-gray-400 text-xs">{index + 1}</td>
                        <td className="px-4 py-2">
                           <p className="font-semibold text-gray-800 dark:text-gray-100">{item.productName}</p>
                           <p className="text-[9px] text-gray-400">{item.code}</p>
                        </td>
                        <td className="px-4 py-2 font-bold text-brand text-sm">৳{item.salePrice}</td>
                        <td className="px-4 py-2">
                           <input 
                             type="text" 
                             placeholder="Serial Number..." 
                             className="w-full px-3 py-1.5 bg-gray-50/50 dark:bg-slate-900/40 border dark:border-slate-600 rounded-lg text-xs outline-none focus:border-brand/50 transition-colors dark:text-white"
                             value={item.serialNumbers.join(', ')}
                             onChange={(e) => updateSerials(item.cartId, e.target.value)}
                           />
                        </td>
                        <td className="px-4 py-2 text-center">
                           <button 
                             onClick={() => removeFromCart(item.cartId)}
                             className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all"
                           >
                             <Trash2 size={16} />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {cart.length > 0 && (
                <div className="p-0.5 border-t dark:border-slate-700 text-right bg-gray-50/30 dark:bg-slate-900/40">
                    <button onClick={() => setCart([])} className="text-[9px] text-red-400 hover:text-red-500 font-bold px-2 py-0.5 uppercase">Clear Cart</button>
                </div>
            )}
          </div>
        </div>

        {/* Right Side: Sidebar - STICKY IN VIEWPORT */}
        <div className="lg:w-[30%] xl:w-[25%] flex flex-col overflow-y-auto lg:overflow-hidden custom-scrollbar bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700">
           {/* Simple Title */}
           <div className="px-3 py-2.5 border-b dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/50 flex items-center justify-between sticky top-0 z-10">
              <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-wider">Transaction Summary</span>
              {!isNewCustomer && <span className="bg-green-100 text-green-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase leading-none">Registered</span>}
           </div>

           <div className="p-3 space-y-2.5">
              <div className="space-y-1">
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest pl-1">Phone</span>
                <input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone" className="w-full px-3 py-1.5 bg-gray-50 dark:bg-slate-900/40 border dark:border-slate-700 rounded-lg text-xs dark:text-white outline-none focus:border-brand transition-colors font-semibold" />
              </div>
              <div className="space-y-1">
                 <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer Name" className="w-full px-3 py-1.5 bg-gray-50 dark:bg-slate-900/40 border dark:border-slate-700 rounded-lg text-xs dark:text-white outline-none focus:border-brand transition-colors" />
              </div>
              <input type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Address" className="w-full px-3 py-1.5 bg-gray-50 dark:bg-slate-900/40 border dark:border-slate-700 rounded-lg text-[10px] dark:text-white outline-none" />
           </div>

           {/* Calculation - Always Visible at bottom on desktop, flows on mobile but constrained */}
           <div className="mt-auto p-3 bg-gray-50/50 dark:bg-slate-900/20 border-t dark:border-slate-700 space-y-2.5 sticky bottom-0">
              <div className="flex justify-between items-center px-1">
                 <div className="flex flex-col">
                    <span className="text-[9px] text-gray-400 uppercase font-black uppercase">Subtotal</span>
                    <span className="text-xs font-bold text-gray-600 dark:text-slate-200">৳{subtotal.toLocaleString()}</span>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] text-red-400 uppercase font-black uppercase">Discount</span>
                    <div className="flex items-center gap-1 border-b border-red-200 dark:border-red-900/50">
                      <span className="text-[10px] text-red-500 font-bold">৳</span>
                      <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="w-12 text-right bg-transparent outline-none text-xs font-bold text-red-500" />
                    </div>
                 </div>
              </div>

              <div className="p-2.5 bg-brand/5 dark:bg-brand/10 border border-brand/20 rounded-xl flex justify-between items-center">
                 <span className="text-[9px] font-black text-gray-500 dark:text-slate-400 uppercase">Payable</span>
                 <span className="text-lg font-black text-brand tracking-tighter">৳{grandTotal.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-4 gap-1">
                {['cash', 'bk', 'nag', 'card'].map(method => (
                  <button 
                    key={method}
                    onClick={() => setPaymentMethod(method === 'bk' ? 'bkash' : method === 'nag' ? 'nagad' : method)}
                    className={`py-1.5 text-[8px] font-black uppercase rounded-lg border transition-all ${paymentMethod === (method === 'bk' ? 'bkash' : method === 'nag' ? 'nagad' : method) ? 'bg-brand text-white border-brand shadow-md shadow-brand/20' : 'bg-white dark:bg-slate-800 text-gray-400 border-gray-100 dark:border-slate-700'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              <div className="bg-green-600/10 p-2 rounded-xl border border-green-600/20 flex items-center justify-between">
                <span className="text-[9px] font-bold text-green-600 uppercase tracking-wider ml-1">Paid</span>
                <div className="flex items-center">
                  <span className="text-sm font-black text-green-600 mr-1">৳</span>
                  <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-20 text-right bg-transparent border-none outline-none font-black text-sm text-green-600" placeholder="0" />
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={loading || cart.length === 0}
                className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white font-black rounded-lg shadow-lg shadow-brand/20 transition-all active:scale-95 disabled:opacity-50 text-sm uppercase tracking-widest"
              >
                {loading ? '...' : 'Confirm'}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}



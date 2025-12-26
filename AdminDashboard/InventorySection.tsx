
import React from 'react';
import { Search, Calendar, AlertTriangle, Building2, Map as MapIcon } from 'lucide-react';
import { GlobalInventoryItem, MockGlobalOrder } from './types';

interface InventorySectionProps {
  tab: 'all' | 'history' | 'expiring';
  onTabChange: (tab: 'all' | 'history' | 'expiring') => void;
  inventory: GlobalInventoryItem[];
  history: MockGlobalOrder[];
  expiring: GlobalInventoryItem[];
  itemsByCategory: Record<string, GlobalInventoryItem[]>;
}

const InventorySection: React.FC<InventorySectionProps> = ({ 
  tab, 
  onTabChange, 
  inventory, 
  history, 
  expiring, 
  itemsByCategory 
}) => {
  const getDaysDiff = (dateStr: string) => {
    const now = new Date();
    const expiry = new Date(dateStr);
    const diffTime = now.getTime() - expiry.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatFullDateWithTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', { 
      month: 'short', day: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-1000">
      <div className="px-8 pt-8 flex items-center justify-between border-b border-slate-100 pb-0">
         <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar-hide">
            <button onClick={() => onTabChange('all')} className={`px-6 py-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${tab === 'all' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              All Inventory ({inventory.length})
            </button>
            <button onClick={() => onTabChange('history')} className={`px-6 py-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${tab === 'history' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              Purchase History
            </button>
            <button onClick={() => onTabChange('expiring')} className={`px-6 py-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${tab === 'expiring' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              Expiration Watchlist
            </button>
         </div>
         <div className="flex items-center gap-4 pb-4">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
               <input type="text" placeholder="Search global data..." className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none w-64" />
            </div>
         </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar p-1">
        {tab === 'all' && (
          <table className="w-full text-[11px] text-left border-collapse min-w-[1100px] animate-in fade-in duration-300">
            <thead className="bg-[#f8fafc] text-slate-400 font-black uppercase tracking-widest text-[9px] border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Brand</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">UOM</th>
                <th className="px-6 py-4">Unit Price</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Expires</th>
                <th className="px-6 py-4">Clinic Location</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {Object.entries(itemsByCategory).map(([cat, items]) => (
                /* Explicitly cast items to GlobalInventoryItem[] to fix unknown type errors */
                (items as GlobalInventoryItem[]).length > 0 && (
                  <React.Fragment key={cat}>
                    <tr className="bg-blue-50/30 border-y border-slate-50">
                      <td colSpan={11} className="px-6 py-2 text-[10px] font-black text-blue-600 tracking-[0.2em]">{cat}</td>
                    </tr>
                    {(items as GlobalInventoryItem[]).map((item, idx) => (
                      <tr key={`${cat}-${idx}`} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-400 font-medium">{item.brand}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">{item.code}</td>
                        <td className="px-6 py-4 font-black text-slate-700">{item.quantity}</td>
                        <td className="px-6 py-4 text-slate-500">{item.uom}</td>
                        <td className="px-6 py-4 text-slate-500">${item.price.toFixed(2)}</td>
                        <td className="px-6 py-4 font-black text-slate-800">${(item.quantity * item.price).toFixed(2)}</td>
                        <td className="px-6 py-4 text-slate-500">{item.vendor}</td>
                        <td className="px-6 py-4">
                           <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 uppercase tracking-widest">{item.category}</span>
                        </td>
                        <td className={`px-6 py-4 font-bold ${new Date(item.expiryDate) < new Date() ? 'text-rose-600' : 'text-slate-500'}`}>
                          {item.expiryDate}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium italic">{item.clinic}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                )
              ))}
            </tbody>
          </table>
        )}

        {tab === 'history' && (
          <table className="w-full text-[11px] text-left border-collapse min-w-[1100px] animate-in fade-in duration-300">
            <thead className="bg-[#f8fafc] text-slate-400 font-black uppercase tracking-widest text-[9px] border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Brand</th>
                <th className="px-6 py-4">Clinic</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">Unit Price</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Category</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {history.map((h, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-medium">{formatFullDateWithTime(h.timestamp)}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{h.productName}</td>
                  <td className="px-6 py-4 text-slate-500">{h.brand}</td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{h.clinic}</td>
                  <td className="px-6 py-4 text-slate-500">{h.vendor}</td>
                  <td className="px-6 py-4 font-black text-slate-800">{h.qty}</td>
                  <td className="px-6 py-4 text-slate-500">${h.unitPrice?.toFixed(2)}</td>
                  <td className="px-6 py-4 font-black text-blue-600">${h.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">{h.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'expiring' && (
          <div className="p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300">
            {expiring.map((item, idx) => {
              const isExpired = new Date(item.expiryDate) < new Date();
              const daysDiff = getDaysDiff(item.expiryDate);
              return (
                <div key={idx} className="bg-white rounded-[1.25rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-shadow">
                  <div className={`px-5 py-2.5 flex items-center justify-between ${isExpired ? 'bg-rose-50 border-t-4 border-t-rose-500' : 'bg-amber-50 border-t-4 border-t-amber-500'}`}>
                    <div className={`flex items-center gap-2 font-bold text-[11px] uppercase tracking-wider ${isExpired ? 'text-rose-600' : 'text-amber-600'}`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {isExpired ? 'Expired' : 'Expiring Soon'}
                    </div>
                    <div className={`${isExpired ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'} px-3 py-1 rounded-full text-[10px] font-black tracking-tight`}>
                      {isExpired ? `${daysDiff}d ago` : `in ${Math.abs(daysDiff)}d`}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col gap-6 flex-1">
                    <div className="flex flex-col gap-1">
                      <h5 className="font-bold text-slate-800 text-xl leading-tight truncate">{item.name}</h5>
                      <p className="text-sm font-medium text-slate-400">{item.brand} / <span className="font-mono text-[11px] opacity-75">{item.code}</span></p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Expiration</span>
                        <span className={`text-sm font-black ${isExpired ? 'text-rose-600' : 'text-slate-700'}`}>{item.expiryDate}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><MapIcon className="w-3 h-3" /> Location</span>
                        <span className="text-sm font-black text-slate-700 truncate">{item.location}</span>
                      </div>
                    </div>
                    <div className="h-px bg-slate-100 w-full" />
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty on hand</span>
                        <span className="text-sm font-black text-slate-800">{item.quantity} {item.uom}</span>
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Value</span>
                        <span className="text-sm font-black text-slate-800">${(item.quantity * item.price).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2">
                     <Building2 className="w-3 h-3 text-slate-400" />
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{item.clinic}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventorySection;

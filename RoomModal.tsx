
import React, { useState, useMemo } from 'react';
import { 
  X, 
  Package, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronDown,
  FileDown
} from 'lucide-react';
import { Room, Item, ActivityLog, Category, UOM } from './types';
import { CATEGORIES, UOMS } from './constants';

interface RoomModalProps {
  room: Room;
  allRooms: Room[];
  logs: ActivityLog[];
  onClose: () => void;
  onUpdateName: (id: number, name: string) => void;
  onReceive: (roomId: number, itemData: Partial<Item>, qty: number, price: number, expiry?: string) => void;
  onUpdateQty: (roomId: number, itemId: number, delta: number) => void;
  onTransfer: (fromRoomId: number, toRoomId: number, itemId: number) => void;
  onDeleteItem: (roomId: number, itemId: number) => void;
}

const RoomModal: React.FC<RoomModalProps> = ({ room, allRooms, logs, onClose, onUpdateName, onReceive, onUpdateQty, onTransfer, onDeleteItem }) => {
  const [isReceiving, setIsReceiving] = useState(false);
  const [receiveMode, setReceiveMode] = useState<'existing' | 'new'>('existing');
  const [selectedItemIdx, setSelectedItemIdx] = useState<string>('');
  const [formData, setFormData] = useState<Partial<Item>>({
    name: '', brand: '', category: 'consumables', uom: 'box', code: '', vendor: '', description: ''
  });
  const [receiveQty, setReceiveQty] = useState(0);
  const [receivePrice, setReceivePrice] = useState(0);
  const [expiry, setExpiry] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [roomSearch, setRoomSearch] = useState('');

  const filteredItems = useMemo(() => {
    return room.items.filter(i => 
      i.name.toLowerCase().includes(roomSearch.toLowerCase()) || 
      i.brand.toLowerCase().includes(roomSearch.toLowerCase()) ||
      i.code.toLowerCase().includes(roomSearch.toLowerCase())
    );
  }, [room.items, roomSearch]);

  const itemsByCategory = useMemo<Record<string, Item[]>>(() => {
    const groups: Record<string, Item[]> = {};
    filteredItems.forEach(item => {
      const cat = (item.category || 'uncategorized').toUpperCase();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedItemIdx(val);
    if (val === 'new') {
      setReceiveMode('new');
      setFormData({ name: '', brand: '', category: 'consumables', uom: 'box', code: '', vendor: '', description: '' });
    } else if (val !== '') {
      setReceiveMode('existing');
      const item = room.items[parseInt(val)];
      setFormData({ ...item });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReceive(room.id, formData, receiveQty, receivePrice, hasExpiry ? expiry : undefined);
    setIsReceiving(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', brand: '', category: 'consumables', uom: 'box', code: '', vendor: '', description: '' });
    setReceiveQty(0);
    setReceivePrice(0);
    setExpiry('');
    setHasExpiry(false);
    setSelectedItemIdx('');
    setIsReceiving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2">
      <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-[1.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-[#4d9678] px-6 py-4 flex items-center justify-between text-white shrink-0 border-b border-white/10">
          <div className="flex-1">
             <input 
              type="text" 
              value={room.name}
              onChange={(e) => onUpdateName(room.id, e.target.value)}
              className="bg-transparent border-b border-white/30 text-xl font-bold focus:border-white focus:outline-none w-full max-w-2xl placeholder:text-white/40 transition-colors"
              placeholder="Enter room name..."
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all border border-white/20">
              <FileDown className="w-4 h-4" /> Download PDF
            </button>
            <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all border border-white/10">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 custom-scrollbar bg-slate-50/50">
          <div className="flex items-center">
            {!isReceiving ? (
              <button 
                onClick={() => setIsReceiving(true)} 
                className="bg-[#3498db] text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest hover:bg-[#2980b9] shadow-lg shadow-blue-100 transition-all"
              >
                <Package className="w-4 h-4" /> Receive Stock
              </button>
            ) : (
              <button 
                onClick={() => setIsReceiving(false)} 
                className="bg-[#e74c3c] text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest hover:bg-[#c0392b] shadow-lg shadow-rose-100 transition-all"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            )}
          </div>

          {isReceiving && (
            <div className="bg-[#ebf5fb] border border-[#c4e1f3] rounded-[1rem] p-6 shadow-sm animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                 <h4 className="text-[#2c78b2] font-black uppercase text-xs tracking-[0.2em]">Receive Stock</h4>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Product *</label>
                    <select value={selectedItemIdx} onChange={handleProductSelect} className="px-3 py-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 text-xs focus:ring-1 focus:ring-[#3498db] outline-none shadow-sm" required>
                      <option value="">Choose existing product...</option>
                      {room.items.map((item, idx) => <option key={idx} value={idx}>{item.name} ({item.brand})</option>)}
                      <option value="new" className="text-[#3498db] font-bold">⊕ Create New Product...</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quantity to Add *</label>
                    <input type="number" required placeholder="0" className="px-3 py-2 rounded-lg border border-slate-200 font-semibold text-xs focus:ring-1 focus:ring-[#3498db] outline-none shadow-sm"
                      value={receiveQty || ''} onChange={e => setReceiveQty(Number(e.target.value))} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Purchase Price *</label>
                    <input type="number" step="0.01" required placeholder="0.00" className="px-3 py-2 rounded-lg border border-slate-200 font-semibold text-xs focus:ring-1 focus:ring-[#3498db] outline-none shadow-sm"
                      value={receivePrice || ''} onChange={e => setReceivePrice(Number(e.target.value))} />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <input type="checkbox" checked={hasExpiry} onChange={e => setHasExpiry(e.target.checked)} className="w-4 h-4 accent-[#3498db] rounded" id="modalHasExp" />
                    <label htmlFor="modalHasExp" className="text-[10px] font-bold text-slate-600">This item has expiry date</label>
                  </div>
                </div>

                {hasExpiry && (
                  <div className="flex flex-col gap-1 max-w-[200px] animate-in slide-in-from-top-1 duration-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expiry Date *</label>
                    <input type="date" className="px-3 py-2 rounded-lg border border-slate-200 font-semibold text-xs focus:ring-1 focus:ring-[#3498db] outline-none shadow-sm" value={expiry} onChange={e => setExpiry(e.target.value)} required={hasExpiry} />
                  </div>
                )}

                {receiveMode === 'new' && (
                  <div className="flex flex-col gap-4 animate-in slide-in-from-top-1 duration-200 mt-2">
                    <h5 className="text-[#3498db] font-black uppercase text-[9px] tracking-[0.2em] border-b border-slate-200/40 pb-1">New Product Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Product Name *</label>
                        <input required placeholder="e.g. Dental Gloves" className="px-3 py-2 rounded-lg border border-slate-200 text-xs shadow-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Brand</label>
                        <input placeholder="e.g. 3M" className="px-3 py-2 rounded-lg border border-slate-200 text-xs shadow-sm" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Code/SKU</label>
                        <input placeholder="e.g. DG-001" className="px-3 py-2 rounded-lg border border-slate-200 text-xs shadow-sm" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">UOM</label>
                        <select className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs shadow-sm" value={formData.uom} onChange={e => setFormData({...formData, uom: e.target.value as UOM})}>
                          <option value="">Select UOM</option>
                          {UOMS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Vendor</label>
                        <input placeholder="e.g. MedSupply Co" className="px-3 py-2 rounded-lg border border-slate-200 text-xs shadow-sm" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
                        <select className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs shadow-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Category})}>
                          <option value="">Select category</option>
                          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                      <textarea rows={2} placeholder="Product description..." className="px-3 py-2 rounded-lg border border-slate-200 text-xs shadow-sm resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="bg-[#3498db] text-white px-6 py-2 rounded-lg font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#2980b9] shadow-md shadow-blue-100 transition-all">Receive Stock</button>
                  <button type="button" onClick={resetForm} className="bg-slate-500 text-white px-6 py-2 rounded-lg font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-600 shadow-md shadow-slate-100 transition-all">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="font-bold text-slate-800 text-lg tracking-tight">Items in Room <span className="text-slate-400 font-medium">({room.items.length})</span></h3>
              <div className="relative w-full md:w-96">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3498db] w-4 h-4" />
                 <input 
                  type="text" 
                  placeholder="Search items by product, brand, or code..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-[#4d9678] focus:border-transparent outline-none shadow-sm transition-all" 
                  value={roomSearch} 
                  onChange={e => setRoomSearch(e.target.value)} 
                 />
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-[1rem] overflow-x-auto shadow-sm custom-scrollbar">
              <table className="w-full text-[11px] text-left border-collapse min-w-[1000px]">
                <thead className="bg-[#f8fafc] text-slate-500 font-black uppercase tracking-widest text-[9px] border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 w-[100px]">Brand</th>
                    <th className="px-3 py-3 w-[150px]">Product</th>
                    <th className="px-3 py-3 w-[80px]">Code</th>
                    <th className="px-3 py-3 w-[110px]">Qty</th>
                    <th className="px-3 py-3 w-[60px]">UOM</th>
                    <th className="px-3 py-3 w-[80px]">Unit Price</th>
                    <th className="px-3 py-3 w-[80px]">Total</th>
                    <th className="px-3 py-3 w-[100px]">Vendor</th>
                    <th className="px-3 py-3 w-[100px]">Category</th>
                    <th className="px-3 py-3 w-[120px]">Expires</th>
                    <th className="px-3 py-3 w-[120px]">Location</th>
                    <th className="px-3 py-3 w-[60px] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {Object.entries(itemsByCategory).length > 0 ? Object.entries(itemsByCategory).map(([cat, items]: [string, Item[]]) => (
                    <React.Fragment key={cat}>
                      <tr className="bg-[#f1f5f9] border-y border-slate-100">
                        <td colSpan={12} className="px-3 py-1.5 text-[9px] font-black text-slate-400 tracking-[0.2em]">{cat}</td>
                      </tr>
                      {items.map(item => {
                        const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-3 py-3 text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">#{item.brand || '-'}</td>
                            <td className="px-3 py-3 font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</td>
                            <td className="px-3 py-3 text-slate-400 font-mono text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">{item.code || '-'}</td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <button onClick={() => onUpdateQty(room.id, item.id, -1)} className="w-6 h-6 flex items-center justify-center border border-slate-200 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition-colors"><Minus className="w-3 h-3" /></button>
                                <span className="w-4 text-center font-bold text-slate-700">{item.quantity}</span>
                                <button onClick={() => onUpdateQty(room.id, item.id, 1)} className="w-6 h-6 flex items-center justify-center border border-slate-200 rounded-full hover:bg-slate-100 text-slate-400 hover:text-emerald-500 transition-colors"><Plus className="w-3 h-3" /></button>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-slate-500 font-medium whitespace-nowrap">{item.uom}</td>
                            <td className="px-3 py-3 text-slate-500 font-semibold whitespace-nowrap">${item.price.toFixed(2)}</td>
                            <td className="px-3 py-3 font-bold text-[#4d9678] tracking-tight whitespace-nowrap">${(item.quantity * item.price).toFixed(2)}</td>
                            <td className="px-3 py-3 text-slate-400 text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">{item.vendor || '-'}</td>
                            <td className="px-3 py-3">
                              <span className="text-[9px] font-bold text-slate-400 capitalize tracking-wider">{item.category}</span>
                            </td>
                            <td className={`px-3 py-3 whitespace-nowrap ${isExpired ? 'bg-rose-50' : ''}`}>
                              {item.expiryDate ? (
                                <span className={`text-[10px] font-bold ${isExpired ? 'text-rose-600' : 'text-slate-500'}`}>
                                  {new Date(item.expiryDate).toLocaleDateString()}
                                  {isExpired && <span className="ml-1 text-[8px] uppercase font-black tracking-tight">(Expired)</span>}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-3 py-3">
                              <select className="bg-transparent text-[10px] font-bold text-emerald-600 tracking-tighter focus:outline-none cursor-pointer w-full text-ellipsis" value={room.id} onChange={(e) => onTransfer(room.id, Number(e.target.value), item.id)}>
                                <option value={room.id}>{room.name}</option>
                                {allRooms.filter(r => r.id !== room.id).map(r => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-3 text-center">
                               <button
                                 onClick={() => onDeleteItem(room.id, item.id)}
                                 className="text-slate-300 hover:text-rose-600 transition-colors"
                                 title="Delete item"
                               >
                                 <Trash2 className="w-4 h-4 mx-auto" />
                               </button>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  )) : (
                    <tr><td colSpan={12} className="py-24 text-center text-slate-300 italic font-black uppercase tracking-[0.2em] text-xs opacity-50">No Inventory</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-2 border-t border-slate-100 pt-6 pb-2">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity Log</h4>
              <button 
                onClick={() => setIsLogOpen(!isLogOpen)}
                className="flex items-center gap-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[9px] font-black uppercase text-slate-500 hover:bg-slate-50 transition-all shadow-sm tracking-widest"
              >
                {isLogOpen ? 'Hide' : 'Show'} <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isLogOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {isLogOpen && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {logs.length > 0 ? logs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between p-3 bg-white rounded-xl border border-slate-50 group transition-all">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 p-1.5 rounded-lg ${log.action === 'receive' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                        {log.action === 'receive' ? <Plus className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                          {log.details}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">{new Date(log.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">No activity found.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomModal;


import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Package, 
  History, 
  AlertTriangle, 
  ClipboardCheck, 
  Plus, 
  X,
  FileText,
  BarChart3, 
  Filter,
  FileDown,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  PieChart,
  ArrowLeft,
  QrCode
} from 'lucide-react';
import { Room, Item, ActivityLog, PurchaseHistory, Category, UOM } from './types';
import { CATEGORIES, UOMS } from './constants';
import QRCode from 'react-qr-code';

interface MasterInventoryProps {
  rooms: Room[];
  history: PurchaseHistory[];
  logs: ActivityLog[];
  onReceive: (roomId: number, itemData: Partial<Item>, qty: number, price: number, expiry?: string) => void;
  onUpdateQty: (roomId: number, itemId: number, delta: number) => void;
  onTransfer: (fromRoomId: number, toRoomId: number, itemId: number) => void;
  supabaseUserId: string | null;
}

const MasterInventory: React.FC<MasterInventoryProps> = ({ 
  rooms, 
  history, 
  logs, 
  onReceive, 
  onUpdateQty, 
  onTransfer,
  supabaseUserId
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'receive' | 'history' | 'expiring'>('all');
  const [showUsageStats, setShowUsageStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // History Filter State
  const [historyCategory, setHistoryCategory] = useState('all');
  const [historyVendor, setHistoryVendor] = useState('all');
  const [historySearch, setHistorySearch] = useState('');
  const [historyTime, setHistoryTime] = useState('all');

  // Form State for Master Receiving
  const [selectedRoomId, setSelectedRoomId] = useState<number | string>('');
  const [receiveMode, setReceiveMode] = useState<'existing' | 'new'>('existing');
  const [selectedProductKey, setSelectedProductKey] = useState<string>('');
  const [formData, setFormData] = useState<Partial<Item>>({
    name: '', brand: '', category: 'consumables', uom: 'pcs', code: '', vendor: '', description: ''
  });
  const [receiveQty, setReceiveQty] = useState(0);
  const [receivePrice, setReceivePrice] = useState(0);
  const [expiry, setExpiry] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Flattened items for the master list
  const allItems = useMemo(() => {
    return rooms.flatMap(room => 
      room.items.map(item => ({ ...item, roomName: room.name, roomId: room.id }))
    ).filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.roomName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rooms, searchTerm]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      const matchCat = historyCategory === 'all' || h.category === historyCategory;
      const matchVendor = historyVendor === 'all' || h.vendor === historyVendor;
      const matchSearch = h.productName.toLowerCase().includes(historySearch.toLowerCase()) || 
                          h.brand.toLowerCase().includes(historySearch.toLowerCase());
      return matchCat && matchVendor && matchSearch;
    });
  }, [history, historyCategory, historyVendor, historySearch]);

  const uniqueVendors = useMemo(() => {
    const vendors = new Set(history.map(h => h.vendor).filter(Boolean));
    return Array.from(vendors);
  }, [history]);

  // Usage Stats Calculations
  const usageStats = useMemo(() => {
    const totalExpense = history.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const categoryBreakdown = CATEGORIES.map(cat => {
      const catHistory = history.filter(h => h.category === cat.id);
      const amount = catHistory.reduce((acc, curr) => acc + curr.totalPrice, 0);
      const count = catHistory.length;
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return {
        ...cat,
        amount,
        count,
        percentage
      };
    }).sort((a, b) => b.amount - a.amount);

    return { totalExpense, categoryBreakdown };
  }, [history]);

  // Group by category for the table
  const itemsByCategory = useMemo(() => {
    const groups: Record<string, any[]> = {};
    allItems.forEach(item => {
      const cat = (item.category || 'other').toUpperCase();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [allItems]);

  // Expiry Logic
  const expiringItems = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return allItems.filter(i => i.expiryDate && new Date(i.expiryDate) <= thirtyDaysFromNow);
  }, [allItems]);

  const intakeUrl = useMemo(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('qr_intake', '1');
    if (supabaseUserId) url.searchParams.set('uid', supabaseUserId);
    return url.toString();
  }, [supabaseUserId]);

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedProductKey(val);
    if (val === 'new') {
      setReceiveMode('new');
      setFormData({ name: '', brand: '', category: 'consumables', uom: 'pcs', code: '', vendor: '', description: '' });
    } else if (val !== '') {
      setReceiveMode('existing');
      const [rId, iId] = val.split('-').map(Number);
      const room = rooms.find(r => r.id === rId);
      const item = room?.items.find(i => i.id === iId);
      if (item) setFormData({ ...item });
    } else {
      setReceiveMode('existing');
      setFormData({ name: '', brand: '', category: 'consumables', uom: 'pcs', code: '', vendor: '', description: '' });
    }
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;
    onReceive(Number(selectedRoomId), formData, receiveQty, receivePrice, hasExpiry ? expiry : undefined);
    setActiveTab('all');
    resetReceiveForm();
  };

  const resetReceiveForm = () => {
    setFormData({ name: '', brand: '', category: 'consumables', uom: 'pcs', code: '', vendor: '', description: '' });
    setReceiveQty(0);
    setReceivePrice(0);
    setExpiry('');
    setHasExpiry(false);
    setSelectedProductKey('');
    setSelectedRoomId('');
    setReceiveMode('existing');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }) + ', ' + d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const downloadAllPdf = () => {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.text("DentaStock Pro - Complete Inventory List", 14, 15);
    const tableData = allItems.map(i => [
      i.brand || '-', i.name, i.code || '-', i.quantity, i.uom, 
      `$${i.price.toFixed(2)}`, `$${(i.quantity * i.price).toFixed(2)}`, 
      i.vendor || '-', i.category, i.expiryDate || '-', i.roomName
    ]);
    (doc as any).autoTable({
      startY: 20,
      head: [['Brand', 'Product', 'Code', 'Qty', 'UOM', 'Price', 'Total', 'Vendor', 'Category', 'Expires', 'Location']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: '#4d9678' }
    });
    doc.save(`complete_inventory_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Helper for generating doughnut segments
  const renderDoughnut = () => {
    const size = 400;
    const center = size / 2;
    const radius = 90;
    const strokeWidth = 35;
    const labelDistance = 145; 
    let cumulativeAngle = -Math.PI / 2;

    const colors = [
      '#2563eb', // blue
      '#facc15', // yellow
      '#f97316', // orange
      '#3b82f6', // light blue
      '#9333ea', // purple
      '#dc2626', // red
      '#10b981'  // emerald
    ];

    const textColor = [
      'text-blue-600',
      'text-yellow-600',
      'text-orange-600',
      'text-blue-500',
      'text-purple-600',
      'text-red-600',
      'text-emerald-600'
    ];

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto overflow-visible">
        {usageStats.categoryBreakdown.map((cat, idx) => {
          if (cat.amount === 0) return null;
          const angle = (cat.amount / usageStats.totalExpense) * 2 * Math.PI;
          const x1 = center + radius * Math.cos(cumulativeAngle);
          const y1 = center + radius * Math.sin(cumulativeAngle);
          
          const midAngle = cumulativeAngle + (angle / 2);
          const labelX = center + labelDistance * Math.cos(midAngle);
          const labelY = center + labelDistance * Math.sin(midAngle);
          const connectorX = center + (radius + 45) * Math.cos(midAngle); 
          const connectorY = center + (radius + 45) * Math.sin(midAngle); 

          cumulativeAngle += angle;
          const x2 = center + radius * Math.cos(cumulativeAngle);
          const y2 = center + radius * Math.sin(cumulativeAngle);

          const largeArcFlag = angle > Math.PI ? 1 : 0;
          const isFullCircle = angle >= (2 * Math.PI - 0.001);
          const pathData = isFullCircle ? "" : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
          
          const isHovered = hoveredIdx === idx;

          return (
            <g key={cat.id} className="group">
              {isFullCircle ? (
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={colors[idx % colors.length]}
                  strokeWidth={strokeWidth}
                  className="transition-all duration-300 hover:opacity-100 cursor-pointer origin-center"
                  style={{ 
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    opacity: (hoveredIdx !== null && !isHovered) ? 0.3 : 1
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              ) : (
                <path
                  d={pathData}
                  fill="none"
                  stroke={colors[idx % colors.length]}
                  strokeWidth={strokeWidth}
                  className="transition-all duration-300 hover:opacity-100 cursor-pointer origin-center"
                  style={{ 
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    opacity: (hoveredIdx !== null && !isHovered) ? 0.3 : 1
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              )}
              {/* Connector line - Only visible on hover */}
              <line 
                x1={center + (radius + 15) * Math.cos(midAngle)} 
                y1={center + (radius + 15) * Math.sin(midAngle)}
                x2={connectorX}
                y2={connectorY}
                stroke={colors[idx % colors.length]}
                strokeWidth="1.5"
                className={`transition-opacity duration-300 pointer-events-none ${isHovered ? 'opacity-40' : 'opacity-0'}`}
              />
              {/* Icon Label - Only visible on hover */}
              <foreignObject 
                x={labelX - 20} 
                y={labelY - 20} 
                width="40" 
                height="40"
                className={`transition-opacity duration-300 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className={`p-3 rounded-full bg-white border border-slate-110 ${textColor[idx % colors.length]}`}>
                    {React.isValidElement(cat.icon) ? React.cloneElement(cat.icon as React.ReactElement<any>, { className: "w-4 h-4" }) : null}
                  </div>
                </div>
              </foreignObject>
            </g>
          );
        })}
        {/* Central Total Indicator */}
        <g className="pointer-events-none">
          <text x="50%" y="47%" textAnchor="middle" className="text-[10px] font-black uppercase text-slate-400 fill-slate-400">Total</text>
          <text x="50%" y="54%" textAnchor="middle" className="text-xl font-black fill-slate-800">${usageStats.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</text>
        </g>
      </svg>
    );
  };

  const getCatColor = (idx: number) => {
    const colors = [
      'bg-blue-600',
      'bg-yellow-400',
      'bg-orange-500',
      'bg-blue-500',
      'bg-purple-600',
      'bg-red-600',
      'bg-emerald-500'
    ];
    return colors[idx % colors.length];
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Navigation Tabs Bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-100 p-2 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar-hide">
          <button 
            onClick={() => { setActiveTab('all'); setShowUsageStats(false); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-[#4d9678] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ClipboardList className="w-4 h-4" /> All Inventory
          </button>
          <button 
            onClick={() => { setActiveTab('receive'); setShowUsageStats(false); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'receive' ? 'bg-[#3498db] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Package className="w-4 h-4" /> Receive Stock
          </button>
          <button 
            onClick={() => { setActiveTab('history'); setShowUsageStats(false); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'history' && !showUsageStats ? 'bg-[#9b59b6] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <History className="w-4 h-4" /> Purchase History
          </button>
          <button 
            onClick={() => { setActiveTab('expiring'); setShowUsageStats(false); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'expiring' ? 'bg-[#f39c12] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <AlertTriangle className="w-4 h-4" /> Expiring Items
              {expiringItems.length > 0 && <span className={`ml-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${activeTab === 'expiring' ? 'bg-white text-[#f39c12]' : 'bg-[#f39c12] text-white'}`}>{expiringItems.length}</span>}
          </button>
        </div>
        <div className="hidden md:flex px-4 border-l border-slate-100 items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="text-slate-400 hover:text-[#4d9678] transition-colors p-2 rounded-lg flex items-center gap-2"
            title="Mobile intake QR"
          >
            <QrCode className="w-5 h-5" />
            <span className="text-xs font-semibold">QR Intake</span>
          </button>
          <button onClick={downloadAllPdf} className="text-slate-400 hover:text-[#4d9678] transition-colors p-2 rounded-lg flex items-center gap-2" title="Export All Data">
            <FileDown className="w-5 h-5" />
            <span className="text-xs font-semibold">PDF</span>
          </button>
        </div>
      </div>

      {/* Dynamic Content Area */}
      <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 p-6 md:p-8 min-h-[500px]">
        
        {/* VIEW: ALL INVENTORY */}
        {activeTab === 'all' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Quick search master inventory..."
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 focus:ring-2 focus:ring-[#4d9678] focus:border-transparent outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-sm custom-scrollbar">
              <table className="w-full text-[11px] text-left border-collapse min-w-[1100px]">
                <thead className="bg-[#f8fafc] text-slate-500 font-black uppercase tracking-widest text-[9px] border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-4 w-[100px]">Brand</th>
                    <th className="px-3 py-4 w-[180px]">Product</th>
                    <th className="px-3 py-4 w-[90px]">Code</th>
                    <th className="px-3 py-4 w-[60px]">Qty</th>
                    <th className="px-3 py-4 w-[60px]">UOM</th>
                    <th className="px-3 py-4 w-[80px]">Price</th>
                    <th className="px-3 py-4 w-[90px]">Total</th>
                    <th className="px-3 py-4 w-[100px]">Vendor</th>
                    <th className="px-3 py-4 w-[100px]">Category</th>
                    <th className="px-3 py-4 w-[100px]">Expires</th>
                    <th className="px-3 py-4 w-[110px]">Location</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {Object.entries(itemsByCategory).length > 0 ? Object.entries(itemsByCategory).map(([cat, items]) => (
                    <React.Fragment key={cat}>
                      <tr className="bg-[#f1f5f9] border-y border-slate-200">
                        <td colSpan={11} className="px-3 py-1.5 text-[9px] font-black text-slate-400 tracking-[0.2em]">{cat}</td>
                      </tr>
                      {(items as any[]).map((item) => {
                        const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
                        return (
                          <tr key={`${item.roomId}-${item.id}`} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="px-3 py-3 text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">#{item.brand || '-'}</td>
                            <td className="px-3 py-3 font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</td>
                            <td className="px-3 py-3 text-slate-400 font-mono text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">{item.code || '-'}</td>
                            <td className="px-3 py-3 font-bold text-slate-700 whitespace-nowrap">{item.quantity}</td>
                            <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{item.uom}</td>
                            <td className="px-3 py-3 text-slate-500 whitespace-nowrap">${item.price.toFixed(2)}</td>
                            <td className="px-3 py-3 font-bold text-[#4d9678] whitespace-nowrap">${(item.quantity * item.price).toFixed(2)}</td>
                            <td className="px-3 py-3 text-slate-400 text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">{item.vendor || '-'}</td>
                            <td className="px-3 py-3">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</span>
                            </td>
                            <td className={`px-3 py-3 whitespace-nowrap ${isExpired ? 'text-rose-600 font-black bg-rose-50' : 'text-slate-500 font-medium'}`}>
                              {item.expiryDate ? (
                                <>
                                  {new Date(item.expiryDate).toLocaleDateString()}
                                  {isExpired && <span className="ml-1 text-[8px] uppercase tracking-tighter">(EXP)</span>}
                                </>
                              ) : '-'}
                            </td>
                            <td className="px-3 py-3">
                               <span className="text-emerald-600 font-bold uppercase text-[9px] whitespace-nowrap border border-emerald-100 px-2 py-0.5 rounded-lg bg-emerald-50/30">{item.roomName}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  )) : (
                    <tr><td colSpan={11} className="py-24 text-center text-slate-300 font-black uppercase tracking-[0.3em] opacity-50">No Items Found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW: RECEIVE STOCK */}
        {activeTab === 'receive' && (
          <div className="animate-in zoom-in-95 duration-200 w-full">
              <div className="flex items-center gap-3 mb-8">
                 <div className="bg-blue-100 p-3 rounded-2xl text-[#3498db]">
                    <Package className="w-6 h-6" />
                 </div>
                 <h4 className="text-[#2c78b2] font-black uppercase text-sm tracking-[0.2em]">Receive New Stock</h4>
              </div>
              <form onSubmit={handleReceiveSubmit} className="flex flex-col gap-8 w-full">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Select Product *</label>
                    <select value={selectedProductKey} onChange={handleProductSelect} className="px-4 py-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 text-sm focus:ring-2 focus:ring-[#3498db] outline-none shadow-sm" required>
                      <option value="">Choose existing product...</option>
                      {rooms.flatMap(r => r.items.map(i => (
                        <option key={`${r.id}-${i.id}`} value={`${r.id}-${i.id}`}>{i.name} ({i.brand}) - {r.name}</option>
                      )))}
                      <option value="new" className="text-[#3498db] font-bold">⊕ Create New Product...</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Add to Location *</label>
                    <select value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 text-sm focus:ring-2 focus:ring-[#3498db] outline-none shadow-sm" required>
                      <option value="">Select room...</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Quantity *</label>
                    <input type="number" required placeholder="0" className="px-4 py-3 rounded-xl border border-slate-200 font-semibold text-sm focus:ring-2 focus:ring-[#3498db] outline-none shadow-sm"
                      value={receiveQty || ''} onChange={e => setReceiveQty(Number(e.target.value))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Unit Price *</label>
                    <input type="number" step="0.01" required placeholder="0.00" className="px-4 py-3 rounded-xl border border-slate-200 font-semibold text-sm focus:ring-2 focus:ring-[#3498db] outline-none shadow-sm"
                      value={receivePrice || ''} onChange={setReceivePrice as any} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" id="hasExpiryForm" checked={hasExpiry} onChange={e => setHasExpiry(e.target.checked)} className="w-5 h-5 accent-[#3498db] rounded" />
                  <label htmlFor="hasExpiryForm" className="text-xs font-bold text-slate-600">Track expiry date for this batch</label>
                  {hasExpiry && (
                    <input type="date" required className="ml-4 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-[#3498db] outline-none shadow-sm" value={expiry} onChange={e => setExpiry(e.target.value)} />
                  )}
                </div>

                {receiveMode === 'new' && (
                  <div className="flex flex-col gap-6 animate-in slide-in-from-top-4 duration-300 pt-4 border-t border-slate-50">
                    <h5 className="text-[#3498db] font-black uppercase text-[10px] tracking-[0.2em] pb-1">New Product Registration</h5>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product Name *</label>
                        <input required placeholder="e.g. Dental Gloves" className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#3498db] outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Brand</label>
                        <input placeholder="e.g. 3M" className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#3498db] outline-none" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Code/SKU</label>
                        <input placeholder="e.g. DG-001" className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#3498db] outline-none" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">UOM</label>
                        <select className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[#3498db] outline-none" value={formData.uom} onChange={e => setFormData({...formData, uom: e.target.value as UOM})}>
                          {UOMS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vendor</label>
                        <input placeholder="e.g. MedSupply Co" className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#3498db] outline-none" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
                        <select className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[#3498db] outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Category})}>
                          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button type="submit" className="bg-[#3498db] text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-[#2980b9] shadow-xl shadow-blue-200 transition-all">Submit Entry</button>
                  <button type="button" onClick={resetReceiveForm} className="bg-slate-200 text-slate-600 px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-300 transition-all">Reset Form</button>
                </div>
              </form>
          </div>
        )}

        {/* VIEW: PURCHASE HISTORY & USAGE STATS */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-500">
             {showUsageStats ? (
               <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                     <button 
                        onClick={() => setShowUsageStats(false)}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-all text-sm group"
                     >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Records
                     </button>
                     <h4 className="text-xl font-black text-slate-800 tracking-tight">Categorized Expense Report</h4>
                     <div className="w-24"></div> {/* Spacer */}
                  </div>

                  <div className="flex flex-col items-center py-6">
                    {renderDoughnut()}
                  </div>

                  <div className="space-y-6 max-w-2xl mx-auto w-full mt-4">
                    {usageStats.categoryBreakdown.map((cat, idx) => (
                      <div key={cat.id} className="flex flex-col gap-2">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="bg-slate-50 p-3 rounded-xl text-slate-500 border border-slate-100 shadow-sm">
                                  {cat.icon}
                               </div>
                               <div>
                                  <h5 className="font-bold text-slate-800 text-sm uppercase tracking-tight">{cat.label}</h5>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {cat.percentage.toFixed(1)}% ({cat.count} transactions)
                                  </p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="font-black text-slate-800 text-sm">
                                  ${cat.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                         </div>
                         <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getCatColor(idx)} transition-all duration-1000 ease-out`}
                              style={{ width: `${cat.percentage}%` }}
                            />
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
             ) : (
               <>
                 <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-3 rounded-2xl text-[#9b59b6]">
                        <ClipboardList className="w-6 h-6" />
                      </div>
                      <h4 className="text-[#9b59b6] font-bold text-xl tracking-tight">Full Purchase Records</h4>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => setShowUsageStats(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-50 text-[#9b59b6] rounded-xl font-bold text-sm hover:bg-purple-100 transition-all border border-purple-100 shadow-sm"
                       >
                        <BarChart3 className="w-4 h-4" /> Usage Stats
                       </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm">
                    <select value={historyCategory} onChange={e => setHistoryCategory(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 outline-none">
                      <option value="all">All Categories</option>
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <select value={historyVendor} onChange={e => setHistoryVendor(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 outline-none">
                      <option value="all">All Vendors</option>
                      {uniqueVendors.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <div className="md:col-span-2 relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <input type="text" placeholder="Search records..." className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-600 outline-none" value={historySearch} onChange={e => setHistorySearch(e.target.value)} />
                    </div>
                    <select value={historyTime} onChange={e => setHistoryTime(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 outline-none">
                      <option value="all">Time Period: All</option>
                      <option value="30">Last 30 Days</option>
                      <option value="90">Last Quarter</option>
                    </select>
                 </div>

                 <div className="overflow-x-auto bg-white rounded-3xl shadow-sm border border-slate-100 custom-scrollbar">
                    <table className="w-full text-[11px] text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="bg-[#f8fafc] text-slate-500 font-black uppercase tracking-widest text-[9px] border-b border-slate-200">
                          <th className="px-6 py-5">Date</th>
                          <th className="px-6 py-5">Product</th>
                          <th className="px-6 py-5">Brand</th>
                          <th className="px-6 py-5">Code</th>
                          <th className="px-6 py-5">Vendor</th>
                          <th className="px-6 py-5 text-center">Qty</th>
                          <th className="px-6 py-5">Unit Price</th>
                          <th className="px-6 py-5">Total Price</th>
                          <th className="px-6 py-5">Location</th>
                          <th className="px-6 py-5">Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredHistory.length > 0 ? filteredHistory.map(h => (
                          <tr key={h.id} className="hover:bg-purple-50/20 transition-colors">
                            <td className="px-6 py-5 text-slate-400 whitespace-nowrap text-xs">{formatDate(h.timestamp)}</td>
                            <td className="px-6 py-5 font-bold text-slate-800">{h.productName}</td>
                            <td className="px-6 py-5 text-slate-500 text-xs">#{h.brand || '-'}</td>
                            <td className="px-6 py-5 text-slate-400 font-mono text-[10px]">{h.code || '-'}</td>
                            <td className="px-6 py-5 text-slate-600 font-medium text-xs">{h.vendor || '-'}</td>
                            <td className="px-6 py-5 font-black text-[#9b59b6] text-center">{h.qty}</td>
                            <td className="px-6 py-5 text-slate-500 font-semibold">${h.unitPrice.toFixed(2)}</td>
                            <td className="px-6 py-5 text-[#c0392b] font-black tracking-tight">${h.totalPrice.toFixed(2)}</td>
                            <td className="px-6 py-5 text-emerald-600 font-bold uppercase text-[10px] whitespace-nowrap">{h.location}</td>
                            <td className="px-6 py-5">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{h.category}</span>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={10} className="py-24 text-center text-slate-300 font-black uppercase tracking-[0.3em] opacity-50">No Records Found</td></tr>
                        )}
                      </tbody>
                    </table>
                 </div>
               </>
             )}
          </div>
        )}

        {/* VIEW: EXPIRING ITEMS */}
        {activeTab === 'expiring' && (
          <div className="flex flex-col gap-8 animate-in slide-in-from-right-4 duration-500">
             <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-3 rounded-2xl text-[#f39c12]">
                   <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                   <h4 className="text-[#f39c12] font-black uppercase text-sm tracking-[0.2em]">Expirations Watchlist</h4>
                   <p className="text-xs text-slate-400 font-medium mt-1">Items expiring within the next 30 days are highlighted below.</p>
                </div>
             </div>

             {expiringItems.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {expiringItems.map((item, idx) => {
                   const isExpired = new Date(item.expiryDate!) < new Date();
                   return (
                    <div key={idx} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col gap-4 relative overflow-hidden group ${isExpired ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100 hover:border-amber-300'}`}>
                       {isExpired && <div className="absolute top-0 right-0 bg-rose-600 text-white px-4 py-1 font-black uppercase text-[8px] tracking-[0.2em] rounded-bl-xl">Expired</div>}
                       <div className="flex items-start justify-between">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.brand}</span>
                             <h5 className="font-bold text-slate-800 text-lg group-hover:text-amber-700 transition-colors">{item.name}</h5>
                             <span className="bg-white/60 px-2 py-1 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-tighter self-start mt-2 border border-slate-100">{item.category}</span>
                          </div>
                          <div className={`p-3 rounded-2xl ${isExpired ? 'bg-rose-100 text-rose-600' : 'bg-white text-amber-500 shadow-sm'}`}>
                             <Package className="w-6 h-6" />
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Stock level</span>
                             <span className={`text-xl font-black ${isExpired ? 'text-rose-600' : 'text-slate-700'}`}>{item.quantity} <span className="text-xs font-normal text-slate-400">{item.uom}</span></span>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Expiry Date</span>
                             <span className={`text-sm font-bold ${isExpired ? 'text-rose-600' : 'text-slate-700'}`}>{new Date(item.expiryDate!).toLocaleDateString()}</span>
                          </div>
                       </div>
                       <div className="pt-4 border-t border-slate-200/50 mt-auto flex items-center justify-between">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">📍 {item.roomName}</span>
                          <button onClick={() => onUpdateQty(item.roomId, item.id, -item.quantity)} className="text-[10px] font-black text-rose-500 uppercase hover:underline">Dispose Item</button>
                       </div>
                    </div>
                   );
                 })}
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center py-32 opacity-20">
                  <ClipboardCheck className="w-24 h-24 mb-6" />
                  <p className="text-2xl font-black uppercase tracking-[0.3em] text-slate-400">All Items Fresh</p>
                  <p className="text-sm font-bold mt-2 text-slate-400">No expirations detected for the next 30 days.</p>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Activity Log (Footer) */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="bg-slate-100 p-2 rounded-xl">
                <FileText className="w-5 h-5 text-slate-500" />
             </div>
             <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Global Activity Feed</h4>
          </div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{logs.length} Recent actions</span>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
          {logs.length > 0 ? logs.map((log) => (
            <div key={log.id} className="flex items-start justify-between p-5 bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-white group transition-all">
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-2 rounded-xl ${log.action === 'receive' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                  {log.action === 'receive' ? <Plus className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{log.roomName}</p>
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                    {log.details}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">{new Date(log.timestamp).toLocaleDateString()}</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-slate-300 font-black uppercase tracking-[0.3em] text-xs">Awaiting clinic activity...</div>
          )}
        </div>
      </div>

      {showQrModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Mobile Intake QR</h3>
                <p className="text-sm text-slate-600">Scan to open the quick intake form on your phone.</p>
              </div>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="self-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <QRCode value={intakeUrl} size={180} />
            </div>
            <div className="text-[11px] text-slate-500 break-all bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
              {intakeUrl}
            </div>
            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Sign in on mobile with the same account before submitting.
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterInventory;

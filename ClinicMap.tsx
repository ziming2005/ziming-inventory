
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Lock, 
  Unlock, 
  Map as MapIcon, 
  ChevronDown,
  Layout,
  Image as ImageIcon
} from 'lucide-react';
import { Room } from './types';
import { PRESET_BLUEPRINTS } from './constants';

interface ClinicMapProps {
  rooms: Room[];
  blueprint: string | null;
  isLocked: boolean;
  isAddMode: boolean;
  isDeleteMode: boolean;
  onSetLocked: (val: boolean) => void;
  onSetAddMode: (val: boolean) => void;
  onSetDeleteMode: (val: boolean) => void;
  onAddRoom: (x: number, y: number) => void;
  onDeleteRoom: (id: number) => void;
  onSelectRoom: (id: number) => void;
  onUpdateRooms: (rooms: Room[]) => void;
  onSelectTemplate: (url: string) => void;
}

const ClinicMap: React.FC<ClinicMapProps> = ({
  rooms, blueprint, isLocked, isAddMode, isDeleteMode,
  onSetLocked, onSetAddMode, onSetDeleteMode,
  onAddRoom, onDeleteRoom, onSelectRoom, onUpdateRooms, onSelectTemplate
}) => {
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [draggedRoomId, setDraggedRoomId] = useState<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);
  
  // Track dragging state to prevent accidental clicks
  const wasDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target as Node)) {
        setShowTemplateMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMapClick = (e: React.MouseEvent) => {
    if (!isAddMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onAddRoom(x, y);
  };

  const handleMouseDown = (e: React.MouseEvent, id: number) => {
    if (isLocked || isAddMode || isDeleteMode) return;
    e.stopPropagation();
    setDraggedRoomId(id);
    wasDraggingRef.current = false;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedRoomId === null || !mapRef.current) return;
    
    // Determine if movement is significant enough to be a drag
    const dx = e.clientX - dragStartPosRef.current.x;
    const dy = e.clientY - dragStartPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) {
      wasDraggingRef.current = true;
    }

    if (wasDraggingRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const x = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 0), 100);
      const y = Math.min(Math.max(((e.clientY - rect.top) / rect.height) * 100, 0), 100);
      onUpdateRooms(rooms.map(r => r.id === draggedRoomId ? { ...r, x, y } : r));
    }
  };

  const handleMouseUp = () => {
    setDraggedRoomId(null);
  };

  return (
    <section className="w-full bg-white rounded-[2rem] shadow-xl overflow-hidden relative border border-slate-100 h-[650px] flex flex-col">
      <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MapIcon className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Interactive Clinic Blueprint</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onSetLocked(!isLocked)} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm border ${isLocked ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-[#f0f4f8] text-[#475569] border-transparent hover:bg-slate-200'}`}
            >
              {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />} 
              {isLocked ? 'Locked' : 'Unlocked'}
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <button 
              disabled={isLocked} 
              onClick={() => { onSetAddMode(!isAddMode); onSetDeleteMode(false); }} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm border ${isAddMode ? 'bg-[#e7f9f2] text-[#059669] border-[#059669]/20' : 'bg-[#e7f9f2] text-[#059669] hover:bg-[#d1f2e6] border-transparent disabled:opacity-50'}`}
            >
              <Plus className="w-3 h-3" /> Add Room
            </button>
            <button 
              disabled={isLocked} 
              onClick={() => { onSetDeleteMode(!isDeleteMode); onSetAddMode(false); }} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm border ${isDeleteMode ? 'bg-[#fff1f2] text-[#e11d48] border-[#e11d48]/20' : 'bg-[#fff1f2] text-[#e11d48] hover:bg-[#ffe4e6] border-transparent disabled:opacity-50'}`}
            >
              <Trash2 className="w-3 h-3" /> Delete Mode
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-3 relative" ref={templateMenuRef}>
            <button onClick={() => setShowTemplateMenu(!showTemplateMenu)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm uppercase tracking-widest">
              <Layout className="w-4 h-4 text-emerald-600" /> Select Template <ChevronDown className={`w-4 h-4 transition-transform ${showTemplateMenu ? 'rotate-180' : ''}`} />
            </button>
            {showTemplateMenu && (
              <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="p-3 space-y-1">
                  {PRESET_BLUEPRINTS.map(t => (
                    <button key={t.id} onClick={() => { onSelectTemplate(t.url); setShowTemplateMenu(false); }} className="w-full flex items-start gap-4 p-4 rounded-xl hover:bg-emerald-50 group transition-colors text-left">
                      <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                         <img src={t.url} className="w-full h-full object-cover" alt={t.name} />
                      </div>
                      <div><p className="text-xs font-black text-slate-800 group-hover:text-emerald-700">{t.name}</p><p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">{t.description}</p></div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div 
        ref={mapRef} 
        className={`flex-1 relative overflow-hidden bg-slate-50 ${isAddMode ? 'cursor-crosshair' : draggedRoomId !== null ? 'cursor-grabbing' : ''}`} 
        onClick={handleMapClick} 
        onMouseMove={handleMouseMove} 
        onMouseUp={handleMouseUp} 
        onMouseLeave={handleMouseUp}
      >
        {blueprint ? <img src={blueprint} alt="Clinic Blueprint" className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-95 transition-opacity" draggable={false} /> : <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none"><ImageIcon className="w-32 h-32 mb-6 text-slate-400" /><p className="text-2xl font-black uppercase tracking-[0.3em] text-slate-400">No Layout Uploaded</p></div>}
        {rooms.map(room => (
          <div 
            key={room.id} 
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform active:scale-95 z-20 group ${draggedRoomId === room.id ? 'z-50 scale-110 cursor-grabbing hexagon-glow-active' : isDeleteMode ? 'hexagon-glow-rose' : 'hover:scale-105 cursor-pointer hexagon-glow'}`} 
            style={{ left: `${room.x}%`, top: `${room.y}%` }} 
            onMouseDown={(e) => handleMouseDown(e, room.id)} 
            onClick={(e) => { 
              e.stopPropagation();
              // Only trigger selection if we weren't just dragging
              if (!wasDraggingRef.current) { 
                if (isDeleteMode) onDeleteRoom(room.id); 
                else onSelectRoom(room.id); 
              } 
            }}
          >
            <div className={`hexagon w-16 h-16 md:w-20 md:h-20 flex flex-col items-center justify-center p-2 text-center transition-colors ${isDeleteMode ? 'bg-rose-600 text-white shadow-xl shadow-rose-500/30' : draggedRoomId === room.id ? 'bg-[#4d9678] text-white shadow-xl shadow-emerald-500/30' : 'bg-white/95 text-slate-800 shadow-xl border border-white/50'}`}>
              <span className="text-[8px] md:text-[10px] font-black leading-tight break-words max-w-[80px] pointer-events-none tracking-tight">{room.name}</span>
              <span className={`text-[7px] md:text-[8px] mt-1 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest pointer-events-none ${isDeleteMode || draggedRoomId === room.id ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>{room.items.length} SKU</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ClinicMap;

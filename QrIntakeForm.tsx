import React, { useState } from 'react';
import { CATEGORIES, UOMS } from './constants';
import { Item, Room } from './types';
import { ArrowLeft, Send } from 'lucide-react';

interface QrIntakeFormProps {
  rooms: Room[];
  onReceive: (roomId: number, itemData: Partial<Item>, qty: number, price: number, expiry?: string) => void;
  onBack: () => void;
}

const QrIntakeForm: React.FC<QrIntakeFormProps> = ({ rooms, onReceive, onBack }) => {
  const [roomId, setRoomId] = useState<number | ''>(rooms[0]?.id || '');
  const [form, setForm] = useState<Partial<Item>>({
    name: '',
    brand: '',
    code: '',
    category: 'consumables',
    uom: 'pcs',
    vendor: '',
    description: ''
  });
  const [qty, setQty] = useState(0);
  const [price, setPrice] = useState(0);
  const [expiry, setExpiry] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) {
      setMessage('Select a room/location first.');
      return;
    }
    onReceive(Number(roomId), form, qty, price, hasExpiry ? expiry : undefined);
    setMessage('Saved to inventory.');
    setForm({ name: '', brand: '', code: '', category: 'consumables', uom: 'pcs', vendor: '', description: '' });
    setQty(0);
    setPrice(0);
    setExpiry('');
    setHasExpiry(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-black">Mobile Intake</p>
          <h1 className="text-lg font-bold text-slate-900">Quick Stock Entry</h1>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-2xl w-full mx-auto">
        {rooms.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
            <p className="text-slate-600 font-semibold">No rooms yet.</p>
            <p className="text-sm text-slate-500 mt-1">Create a room on desktop first, then reopen the QR form.</p>
            <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800">
              Back
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            {message && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">{message}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Room / Location</label>
                <select
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700"
                  value={roomId}
                  onChange={(e) => setRoomId(Number(e.target.value))}
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Product Name</label>
                <input
                  required
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Gloves Nitrile"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Brand</label>
                <input
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700"
                  value={form.brand || ''}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Brand"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Code / SKU</label>
                <input
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700"
                  value={form.code || ''}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="SKU"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Category</label>
                <select
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">UOM</label>
                <select
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700"
                  value={form.uom}
                  onChange={(e) => setForm({ ...form, uom: e.target.value as any })}
                >
                  {UOMS.map((u) => (
                    <option key={u.id} value={u.id}>{u.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Vendor</label>
                <input
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700"
                  value={form.vendor || ''}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  placeholder="Supplier"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Quantity</label>
                  <input
                    type="number"
                    min={0}
                    required
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Unit Price</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="sm:col-span-2 flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-500">Expiry</label>
                <input
                  type="checkbox"
                  checked={hasExpiry}
                  onChange={(e) => setHasExpiry(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <input
                  type="date"
                  disabled={!hasExpiry}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 disabled:bg-slate-100"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500">Notes</label>
                <textarea
                  rows={2}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700"
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Batch / note"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl py-3 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Submit to Inventory
            </button>
          </form>
        )}
      </main>
    </div>
  );
};

export default QrIntakeForm;

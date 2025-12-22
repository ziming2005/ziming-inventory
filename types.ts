
export type Category = 'consumables' | 'equipment' | 'instruments' | 'materials' | 'medication' | 'ppe' | 'other';
export type UOM = 'pcs' | 'box' | 'unit' | 'kit';

export interface Item {
  id: number;
  name: string;
  brand: string;
  code: string;
  quantity: number;
  uom: UOM;
  price: number;
  vendor: string;
  category: Category;
  description: string;
  expiryDate?: string | null;
}

export interface Room {
  id: number;
  name: string;
  x: number;
  y: number;
  items: Item[];
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  roomId: number;
  roomName: string;
  action: 'add' | 'remove' | 'delete' | 'transfer_out' | 'transfer_in' | 'edit' | 'receive';
  details: string;
}

export interface PurchaseHistory {
  id: number;
  timestamp: string;
  productName: string;
  brand: string;
  code: string;
  vendor: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  location: string;
  category: string;
  roomId: number;
  expiryDate?: string | null;
}

export interface UserProfile {
  name: string;
  email: string;
  accountType: 'individual' | 'company';
  phone: string;
  position: string;
  companyName?: string;
}

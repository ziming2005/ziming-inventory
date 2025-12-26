
import React from 'react';
import { 
  Package, 
  Stethoscope, 
  Scissors, 
  Droplets, 
  Pill, 
  ShieldCheck, 
  Box 
} from 'lucide-react';

export const CATEGORIES = [
  { id: 'consumables', label: 'Consumables', icon: <Package className="w-4 h-4" /> },
  { id: 'equipment', label: 'Equipment', icon: <Stethoscope className="w-4 h-4" /> },
  { id: 'instruments', label: 'Instruments', icon: <Scissors className="w-4 h-4" /> },
  { id: 'materials', label: 'Materials', icon: <Droplets className="w-4 h-4" /> },
  { id: 'medication', label: 'Medication', icon: <Pill className="w-4 h-4" /> },
  { id: 'ppe', label: 'PPE', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 'other', label: 'Other', icon: <Box className="w-4 h-4" /> },
];

export const UOMS = ['pcs', 'box', 'unit', 'kit'];

export const CATEGORY_ORDER = ['consumables', 'equipment', 'instruments', 'materials', 'medication', 'ppe', 'other'];

export const PRESET_BLUEPRINTS = [
  { 
    id: 'template-1', 
    name: 'Clinical 1', 
    url: '/images/template1.png',
    description: 'Advanced blue laboratory aesthetic'
  },
  { 
    id: 'template-2', 
    name: 'Clinical 2', 
    url: '/images/template2.png',
    description: 'Wide isometric city-clinic layout' 
  },
  { 
    id: 'template-3', 
    name: 'Clinical 3', 
    url: '/images/template3.png',
    description: 'Alternate clinic layout' 
  },
  { 
    id: 'template-4', 
    name: 'Clinical 4', 
    url: '/images/template4.png',
    description: 'High-density treatment layout' 
  },
  { 
    id: 'template-5', 
    name: 'Clinical 5', 
    url: '/images/template5.png',
    description: 'Open concept clinic floor' 
  },
];

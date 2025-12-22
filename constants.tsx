
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
    id: 'clinical-hub', 
    name: 'Clinical Tech Hub', 
    url: 'https://imagine-public.x.ai/imagine-public/images/d853cd8b-d002-4f16-bc81-edaadbc61903.png',
    description: 'Advanced blue laboratory aesthetic'
  },
  { 
    id: 'metropolis-precinct', 
    name: 'Metropolis Precinct', 
    url: 'https://imagine-public.x.ai/imagine-public/images/79826e87-c496-4e19-b299-c285cb6991ef.png?cache=1&dl=1',
    description: 'Wide isometric city-clinic layout' 
  },
];

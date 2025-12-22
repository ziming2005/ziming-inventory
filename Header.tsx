
import React from 'react';
import { LayoutDashboard, UserCircle } from 'lucide-react';

interface HeaderProps {
  onProfileClick?: () => void;
  onDashboardClick?: () => void;
  userInitials?: string;
}

const Header: React.FC<HeaderProps> = ({ onProfileClick, onDashboardClick, userInitials = 'U' }) => {
  return (
    <header className="bg-white shadow-sm px-6 md:px-16 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 w-full z-50">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onDashboardClick}>
        <div className="bg-[#4d9678] p-2 rounded-xl text-white shadow-lg shadow-emerald-200 group-hover:scale-105 transition-transform">
          <LayoutDashboard className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-tight text-slate-800">DentaStock Pro</h1>
          <p className="text-xs text-slate-500 font-medium">Smart Clinic Inventory</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {onProfileClick && (
          <button 
            onClick={onProfileClick}
            className="flex items-center gap-2 group p-1 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
            title="Account Profile"
          >
            <div className="w-10 h-10 rounded-full bg-[#004aad] flex items-center justify-center text-white font-black text-sm shadow-md group-hover:shadow-blue-200 transition-all">
              {userInitials}
            </div>
            <div className="hidden md:block text-left mr-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Account</p>
              <p className="text-xs font-bold text-slate-700 leading-none">Settings</p>
            </div>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;

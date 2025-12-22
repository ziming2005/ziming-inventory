
import React from 'react';
import { User, Mail, Phone, Briefcase, Building2, LogOut, ArrowLeft, ShieldCheck } from 'lucide-react';
import { UserProfile } from './types';

interface ProfilePageProps {
  user: UserProfile;
  onLogout: () => void;
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, onBack }) => {
  const detailItemClass = "flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto w-full px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white transition-all font-bold text-sm shadow-sm border border-transparent hover:border-slate-100"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Active Account
        </span>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        {/* Profile Header */}
        <div className="bg-[#004aad] px-8 py-10 text-white flex flex-col items-center gap-4 relative">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-4 border-white/30 text-3xl font-black shadow-2xl">
            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-white/70 text-sm font-medium">{user.position}</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-8 md:p-10 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={detailItemClass}>
              <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Email Address</span>
                <span className="text-sm font-bold text-slate-700 truncate max-w-[180px]">{user.email}</span>
              </div>
            </div>

            <div className={detailItemClass}>
              <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Phone Number</span>
                <span className="text-sm font-bold text-slate-700">{user.phone}</span>
              </div>
            </div>

            <div className={detailItemClass}>
              <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600">
                <User className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Account Type</span>
                <span className="text-sm font-bold text-slate-700 capitalize">{user.accountType}</span>
              </div>
            </div>

            <div className={detailItemClass}>
              <div className="bg-orange-100 p-2.5 rounded-xl text-orange-600">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Job Role</span>
                <span className="text-sm font-bold text-slate-700">{user.position}</span>
              </div>
            </div>
          </div>

          {user.accountType === 'company' && (
            <div className={`${detailItemClass} w-full`}>
              <div className="bg-slate-200 p-2.5 rounded-xl text-slate-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Company Organization</span>
                <span className="text-sm font-bold text-slate-700">{user.companyName}</span>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100">
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all font-black uppercase text-xs tracking-[0.2em] border border-rose-100"
            >
              <LogOut className="w-5 h-5" /> Sign out of account
            </button>
          </div>
        </div>
      </div>
      
      <p className="text-center text-[10px] text-slate-400 mt-8 font-medium uppercase tracking-widest">
        DentaStock Pro v2.5.0 • Clinical Inventory Management
      </p>
    </div>
  );
};

export default ProfilePage;

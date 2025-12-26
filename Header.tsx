import React from 'react';

interface HeaderProps {
  onProfileClick?: () => void;
  onDashboardClick?: () => void;
  userInitials?: string;
}

const Header: React.FC<HeaderProps> = ({
  onProfileClick,
  onDashboardClick,
  userInitials = 'U',
}) => {
  return (
    <header className="bg-white shadow-sm px-6 md:px-16 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 w-full z-50">
      {/* Logo (replaces icon + DentaStock Pro text entirely) */}
      <div
        className="flex items-center cursor-pointer group"
        onClick={onDashboardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onDashboardClick?.()}
      >
        <img
          src="/images/mrbur_logo.png"
          alt="MR.BUR logo."
          className="h-10 md:h-12 w-auto object-contain"
          draggable={false}
        />
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                Account
              </p>
              <p className="text-xs font-bold text-slate-700 leading-none">Settings</p>
            </div>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;

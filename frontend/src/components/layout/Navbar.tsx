import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, User, KeyRound, Settings, LogOut, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { AccountModalTab } from '../modals/AccountModals';
import type { AuthUser } from '../../api/auth';

const NOTIFICATIONS = [
  { id: 1, icon: 'alert', title: 'Missing information', body: '456 Oak Avenue is awaiting agent response.', time: '5 min ago', unread: true },
  { id: 2, icon: 'doc', title: 'Document uploaded', body: 'Floor Plans received for 789 Pine Road.', time: '1 hour ago', unread: true },
  { id: 3, icon: 'check', title: 'Listing approved', body: '123 Main Street was approved and published.', time: '3 hours ago', unread: false },
  { id: 4, icon: 'alert', title: 'Validation conflict', body: 'Condo fees conflict detected on 321 Maple Drive.', time: 'Yesterday', unread: false },
];

interface NavbarProps {
  onOpenAccountModal: (tab: AccountModalTab) => void;
  onLogout: () => void;
  user?: AuthUser | null;
  onSearch: (term: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAccountModal, onLogout, user, onSearch }) => {
  const [searchValue, setSearchValue] = useState('');
  const displayName = user?.full_name ?? 'User';
  const displayEmail = user?.email ?? '';
  const displayRole = user?.role ?? '';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTab = (tab: AccountModalTab) => {
    setIsDropdownOpen(false);
    onOpenAccountModal(tab);
  };

  return (
    <header className="h-16 px-8 flex items-center justify-between border-b border-slate-200/70 bg-white/70 backdrop-blur-sm sticky top-0 z-30">
      {/* Search Bar */}
      <div className="relative w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            onSearch(e.target.value);
          }}
          onKeyDown={(e) => e.key === 'Escape' && (setSearchValue(''), onSearch(''))}
          placeholder="Search by address, MLS or listing ID..."
          className="w-full bg-[#f1f5f9]/80 pl-9 pr-4 py-2 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all border border-transparent focus:border-blue-400"
        />
      </div>

      {/* Notifications & Dropdown */}
      <div className="flex items-center gap-4">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setIsNotifOpen(prev => !prev); setIsDropdownOpen(false); setNotifications(n => n.map(x => ({ ...x, unread: false }))); }}
            className="relative cursor-pointer p-1.5 text-slate-500 hover:text-slate-800 transition"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Notifications</span>
                <span className="text-[13px] text-slate-400">{notifications.length} total</span>
              </div>
              <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      n.icon === 'alert' ? 'bg-amber-50 text-amber-500' :
                      n.icon === 'doc' ? 'bg-blue-50 text-blue-500' :
                      'bg-emerald-50 text-emerald-500'
                    }`}>
                      {n.icon === 'alert' ? <AlertCircle className="w-3.5 h-3.5" /> :
                       n.icon === 'doc' ? <FileText className="w-3.5 h-3.5" /> :
                       <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 leading-tight">{n.title}</p>
                      <p className="text-[13px] text-slate-500 mt-0.5 leading-tight">{n.body}</p>
                      <p className="text-[12px] text-slate-400 mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-3 pl-2 border-l border-slate-200 cursor-pointer select-none focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
              {initials}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">{displayName}</span>
              <span className="text-[13px] text-slate-400 leading-tight capitalize">{displayRole.replace('_', ' ')}</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 ml-1 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800">{displayName}</p>
                <p className="text-[13px] text-slate-400 truncate">{displayEmail}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => handleSelectTab('profile')}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => handleSelectTab('password')}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <span>Change Password</span>
                </button>

                <button
                  onClick={() => handleSelectTab('preferences')}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Preferences</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
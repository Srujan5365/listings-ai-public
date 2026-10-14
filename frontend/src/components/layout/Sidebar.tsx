import React from 'react';
import {
  Home,
  Layers,
  Mail,
  FileText,
  Activity,
  Settings
} from 'lucide-react';

interface SidebarProps {
  activeNav: string;
  setActiveNav: (name: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeNav, setActiveNav }) => {
  return (
    <aside className="w-56 bg-[#0f172a] text-slate-300 flex flex-col justify-between shrink-0 shadow-lg select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6">
          <span className="text-white text-xl font-bold tracking-tight">Listings AI</span>
        </div>

        {/* Navigation Items */}
        <nav className="mt-2 px-3 space-y-1">
          <button
            onClick={() => setActiveNav('Home')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeNav === 'Home'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveNav('Listings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeNav === 'Listings'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Listings</span>
          </button>

          <button
            onClick={() => setActiveNav('Inbox')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeNav === 'Inbox'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4" />
              <span>Inbox</span>
            </div>
            <span className="bg-rose-500 text-white text-[13px] font-bold px-1.5 py-0.5 rounded-full leading-tight">
              6
            </span>
          </button>

          <button
            onClick={() => setActiveNav('Documents')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeNav === 'Documents'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Documents</span>
          </button>

          <button
            onClick={() => setActiveNav('Activity')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeNav === 'Activity'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Activity</span>
          </button>

          <button
            onClick={() => setActiveNav('Settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeNav === 'Settings'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-4 mb-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
          System Online
        </div>
        <div className="text-slate-500 mt-1 pl-4 font-mono text-[13px]">v 1.0.0</div>
      </div>
    </aside>
  );
};
import React from 'react';
import { 
  FileText, 
  AlertCircle, 
  Clock, 
  BarChart3, 
  CheckCircle2, 
  X 
} from 'lucide-react';

interface ListingsStatsProps {
  showToast: boolean;
  onCloseToast: () => void;
}

export const ListingsStats: React.FC<ListingsStatsProps> = ({ showToast, onCloseToast }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Listings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage and track all property listings from intake to publication.
          </p>
        </div>

        {/* Displays only when an action sets showToast to true */}
        {showToast && (
          <div className="flex items-start gap-3 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl px-4 py-3 shadow-sm text-xs max-w-sm transition-all animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex-1 pr-2">
              <span className="font-bold text-slate-800 block">
                Listing published successfully!
              </span>
              <span className="text-[13px] text-slate-500 block mt-0.5">
                All connected systems have been updated.
              </span>
            </div>
            <button
              onClick={onCloseToast}
              className="text-slate-400 hover:text-slate-600 p-0.5 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">12</div>
              <div className="text-xs font-semibold text-slate-700 mt-1">Total Listings</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-rose-500 leading-none">5</div>
              <div className="text-xs font-semibold text-slate-700 mt-1">Needs Attention</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">4</div>
              <div className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1">
                <span>•</span> Ready for Review
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">8</div>
              <div className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1">
                <span>•</span> Published This Month
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
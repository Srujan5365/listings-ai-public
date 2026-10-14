import React from 'react';
import { FileText, Mail, Settings, AlertCircle } from 'lucide-react';
import { allListings } from '../../data/mockData';

export const MetricCards: React.FC = () => {
  const m = {
    active_listings: allListings.length,
    ready_for_review: allListings.filter((l) => l.status === 'Ready for Review').length,
    awaiting_agent: allListings.filter((l) => l.status === 'Awaiting Agent').length,
    processing: allListings.filter((l) => l.status === 'Processing').length,
    exceptions: allListings.filter((l) => l.status === 'Missing Information').length,
  };

  return (
    <div className="grid grid-cols-5 gap-4">
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative">
        <div className="flex justify-between items-start">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {m.active_listings}
          </div>
          <div className="text-slate-300 text-sm cursor-pointer hover:text-slate-500 font-sans">✕</div>
        </div>
        <div className="text-xs font-semibold text-slate-700 mt-1">Total Listings</div>
        <div className="text-[13px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
          ↑ Active listings
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="text-2xl font-bold text-blue-600 tracking-tight">
            {m.ready_for_review}
          </div>
          <FileText className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-xs font-semibold text-slate-700 mt-1">Ready for Review</div>
        <div className="text-[13px] text-blue-500 font-medium mt-1 flex items-center gap-1">
          <span>⚡ Needs approval</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="text-2xl font-bold text-amber-500 tracking-tight">
            {m.awaiting_agent}
          </div>
          <Mail className="w-4 h-4 text-amber-500" />
        </div>
        <div className="text-xs font-semibold text-slate-700 mt-1">Awaiting Agent</div>
        <div className="text-[13px] text-amber-600 font-medium mt-1 flex items-center gap-1">
          <span>✉ Missing information</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="text-2xl font-bold text-purple-600 tracking-tight">{m.processing}</div>
          <Settings className="w-4 h-4 text-purple-500" />
        </div>
        <div className="text-xs font-semibold text-slate-700 mt-1">Processing</div>
        <div className="text-[13px] text-purple-500 font-medium mt-1 flex items-center gap-1">
          <span>⚙ In progress</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="text-2xl font-bold text-rose-500 tracking-tight">
            {m.exceptions}
          </div>
          <AlertCircle className="w-4 h-4 text-rose-500" />
        </div>
        <div className="text-xs font-semibold text-slate-700 mt-1">Exceptions</div>
        <div className="text-[13px] text-rose-500 font-medium mt-1 flex items-center gap-1">
          <span>⚠ Requires attention</span>
        </div>
      </div>
    </div>
  );
};

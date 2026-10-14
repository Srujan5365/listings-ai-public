import React from 'react';
import { ArrowRight, Check, RefreshCw, AlertTriangle, FileText } from 'lucide-react';
import type { LiveDateItem, ActivityItem } from '../../types/index';

interface RightWidgetsProps {
  liveDates: LiveDateItem[];
  activities: ActivityItem[];
  onNavigate?: (nav: string) => void;
}

export const RightWidgets: React.FC<RightWidgetsProps> = ({ liveDates, activities, onNavigate }) => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'approved':
        return <Check className="w-3.5 h-3.5 text-emerald-600" />;
      case 'fub':
        return <RefreshCw className="w-3.5 h-3.5 text-blue-600" />;
      case 'missing':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
      case 'docs':
        return <FileText className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  const getBadgeStyle = (tagColor: LiveDateItem['tagColor']) => {
    switch (tagColor) {
      case 'red':
        return 'bg-rose-50 text-rose-600 border border-rose-200/50';
      case 'orange':
        return 'bg-amber-50 text-amber-700 border border-amber-200/50';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Upcoming Live Dates Widget */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-800">Upcoming Live Dates</h3>
          <button onClick={() => alert('Calendar integration coming soon.')} className="text-[13px] font-semibold text-blue-600 flex items-center gap-1 hover:text-blue-700 transition cursor-pointer">
            <span>View calendar</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {liveDates.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[13px] font-bold text-rose-500 tracking-wider leading-none">
                    {item.month}
                  </span>
                  <span className="text-xs font-bold text-slate-800 leading-tight mt-0.5">
                    {item.day}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">{item.address}</div>
                  <div className="text-[12px] text-slate-400">{item.city}</div>
                </div>
              </div>
              <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${getBadgeStyle(item.tagColor)}`}>
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Listings by Status Widget */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 mb-3">Listings by Status</h3>
        
        <div className="flex items-center gap-4">
          {/* 5-Segment SVG Donut */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
              {/* Background ring */}
              <circle
                cx="21"
                cy="21"
                r="15.91549430918954"
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="4.5"
              />
              {/* Ready for Review: 12 / 28 = 42.86% */}
              <circle
                cx="21"
                cy="21"
                r="15.91549430918954"
                fill="transparent"
                stroke="#3b82f6"
                strokeWidth="4.5"
                strokeDasharray="42.86 57.14"
                strokeDashoffset="0"
              />
              {/* Awaiting Agent: 6 / 28 = 21.43% */}
              <circle
                cx="21"
                cy="21"
                r="15.91549430918954"
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="4.5"
                strokeDasharray="21.43 78.57"
                strokeDashoffset="-42.86"
              />
              {/* In Review: 3 / 28 = 10.71% */}
              <circle
                cx="21"
                cy="21"
                r="15.91549430918954"
                fill="transparent"
                stroke="#38bdf8"
                strokeWidth="4.5"
                strokeDasharray="10.71 89.29"
                strokeDashoffset="-64.29"
              />
              {/* Processing: 8 / 28 = 28.57% */}
              <circle
                cx="21"
                cy="21"
                r="15.91549430918954"
                fill="transparent"
                stroke="#a855f7"
                strokeWidth="4.5"
                strokeDasharray="28.57 71.43"
                strokeDashoffset="-75"
              />
              {/* Exceptions: 2 / 28 = 7.14% */}
              <circle
                cx="21"
                cy="21"
                r="15.91549430918954"
                fill="transparent"
                stroke="#f43f5e"
                strokeWidth="4.5"
                strokeDasharray="7.14 92.86"
                strokeDashoffset="-103.57"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-base font-bold text-slate-800 leading-none">28</span>
              <span className="text-[12px] text-slate-400 mt-0.5">Total</span>
            </div>
          </div>

          {/* 5-Item Legend */}
          <div className="flex-1 space-y-1.5 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span> Ready for Review
              </span>
              <span className="font-semibold text-slate-800">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> Awaiting Agent
              </span>
              <span className="font-semibold text-slate-800">6</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8]"></span> In Review
              </span>
              <span className="font-semibold text-slate-800">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-[#a855f7]"></span> Processing
              </span>
              <span className="font-semibold text-slate-800">8</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-[#f43f5e]"></span> Exceptions
              </span>
              <span className="font-semibold text-slate-800">2</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recent Activity Widget */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-800">Recent Activity</h3>
          <button onClick={() => onNavigate?.('Activity')} className="text-[13px] font-semibold text-blue-600 flex items-center gap-1 hover:text-blue-700 transition cursor-pointer">
            <span>View all activity</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {activities.map((item) => (
            <div key={item.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                {getActivityIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-800 truncate">{item.title}</div>
                <div className="text-[13px] text-slate-400 truncate">{item.detail}</div>
                <div className="text-[12px] text-slate-400 mt-0.5">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
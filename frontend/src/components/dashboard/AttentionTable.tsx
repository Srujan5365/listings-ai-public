import React, { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import type { ListingItem, ListingStatus, Priority } from '../../types/index';

interface AttentionTableProps {
  listings: ListingItem[];
}

export const AttentionTable: React.FC<AttentionTableProps> = ({ listings }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(['1']);

  const toggleSelectAll = () => {
    if (selectedIds.length === listings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(listings.map((item) => item.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case 'Ready for Review':
        return 'bg-blue-50 text-blue-600 border border-blue-200/60';
      case 'Awaiting Agent':
        return 'bg-amber-50 text-amber-700 border border-amber-200/60';
      case 'In Review':
        return 'bg-indigo-50 text-indigo-600 border border-indigo-200/60';
      case 'Processing':
        return 'bg-purple-50 text-purple-600 border border-purple-200/60';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
      case 'Exception':
        return 'bg-rose-50 text-rose-600 border border-rose-200/60';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-100 text-rose-700 font-semibold';
      case 'Medium':
        return 'bg-amber-100 text-amber-700 font-semibold';
      case 'Low':
        return 'bg-slate-100 text-slate-600 font-normal';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 flex items-center justify-between border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Needs Attention Today</h2>
          <p className="text-[13px] text-slate-400 mt-0.5">
            Listings with upcoming live dates or pending actions
          </p>
        </div>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition">
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-[#f8fafc] text-slate-400 font-medium text-[13px] uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.length === listings.length && listings.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="py-3 px-2">Status</th>
              <th className="py-3 px-2">Priority</th>
              <th className="py-3 px-3">Address</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Live Date</th>
              <th className="py-3 px-3">Agent</th>
              <th className="py-3 px-3">Updated</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listings.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isSelected ? 'bg-blue-50/20' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectRow(item.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[13px] font-medium ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[12px] ${getPriorityBadge(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">{item.address}</div>
                    <div className="text-[13px] text-slate-400">
                      {item.city} • <span className="font-mono">{item.mls}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-700">{item.type}</td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-medium text-slate-800">{item.liveDate}</span>
                    <span className="text-[12px] text-slate-400 ml-1">
                    {item.days === undefined || item.days === null
                        ? ''
                        : item.days === 0
                        ? '(0d)'
                        : item.days > 0
                        ? `(+${item.days}d)`
                        : `(${item.days}d)`}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-700">{item.agent}</td>
                  <td className="py-3 px-3 text-slate-400 text-[13px]">{item.updated}</td>
                  <td className="py-3 px-4 text-right">
                    <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 px-4 flex items-center justify-between border-t border-slate-100 text-slate-400 text-xs">
        <div>
          Showing <span className="font-semibold text-slate-700">1-6</span> of{' '}
          <span className="font-semibold text-slate-700">28</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="w-6 h-6 rounded bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
            1
          </button>
          <button className="w-6 h-6 rounded hover:bg-slate-100 text-slate-600 text-xs flex items-center justify-center transition">
            2
          </button>
          <button className="w-6 h-6 rounded hover:bg-slate-100 text-slate-600 text-xs flex items-center justify-center transition">
            3
          </button>
          <button className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
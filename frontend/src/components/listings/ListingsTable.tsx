import React, { useState, useEffect } from 'react';
import { MoreHorizontal, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ListingItem, ListingStatus, Priority } from '../../types/index';

interface ListingsTableProps {
  listings: ListingItem[];
  onSelectListing: (listing: ListingItem) => void;
}

export const ListingsTable: React.FC<ListingsTableProps> = ({ 
  listings, 
  onSelectListing 
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
  const pagedListings = listings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [listings]);

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
      case 'Published':
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Published
          </span>
        );
      case 'Ready for Review':
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Ready for Review
          </span>
        );
      case 'Missing Information':
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Missing Information
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            Processing
          </span>
        );
      case 'Awaiting Agent':
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Awaiting Agent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            {status}
          </span>
        );
    }
  };

  const getReadinessBadge = (readiness: number = 0) => {
    if (readiness >= 85) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded text-[13px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
          {readiness}%
        </span>
      );
    }
    if (readiness >= 70) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded text-[13px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
          {readiness}%
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-0.5 rounded text-[13px] font-semibold bg-orange-50 text-orange-600 border border-orange-100">
        {readiness}%
      </span>
    );
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[13px] font-semibold bg-rose-50 text-rose-600">
            <span>•</span> High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[13px] font-semibold bg-amber-50 text-amber-700">
            <span>•</span> Medium
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[13px] font-semibold bg-blue-50 text-blue-600">
            <span>•</span> Low
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-[#f8fafc] text-slate-400 font-medium text-[13px] border-b border-slate-100">
            <tr>
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.length === listings.length && listings.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="py-3 px-3">Address</th>
              <th className="py-3 px-3">MLS #</th>
              <th className="py-3 px-3">Agent</th>
              <th className="py-3 px-3">
                <div className="flex items-center gap-1">
                  <span>Live Date</span>
                  <ArrowUp className="w-3 h-3 text-blue-600" />
                </div>
              </th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Readiness</th>
              <th className="py-3 px-3">Priority</th>
              <th className="py-3 px-3">Updated</th>
              <th className="py-3 px-4 text-right">•••</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pagedListings.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isSelected ? 'bg-blue-50/20' : ''
                  }`}
                >
                  {/* Ry-keuseblokkie */}
                  <td className="py-3.5 px-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectRow(item.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </td>

                  {/* Kleinkiekie + Adres en Stad */}
                  <td 
                    className="py-3.5 px-3 cursor-pointer group"
                    onClick={() => onSelectListing(item)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.address}
                        className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0 group-hover:opacity-90 transition"
                      />
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                          {item.address}
                        </div>
                        <div className="text-[13px] text-slate-400">{item.city}</div>
                      </div>
                    </div>
                  </td>

                  {/* MLS Nommer */}
                  <td className="py-3.5 px-3 font-mono text-[13px] text-slate-700">
                    {item.mls}
                  </td>

                  {/* Agent se naam */}
                  <td className="py-3.5 px-3 font-medium text-slate-800">
                    {item.agent}
                  </td>

                  {/* Regstreekse Datum */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{item.liveDate}</div>
                    {item.isToday && (
                      <div className="text-[13px] text-rose-500 font-semibold">(Today)</div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>

                  {/* Gereedheidsvlak */}
                  <td className="py-3.5 px-3">
                    {getReadinessBadge(item.readiness)}
                  </td>

                  {/* Prioriteit */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {getPriorityBadge(item.priority)}
                  </td>

                  {/* Laas Opgedateer */}
                  <td className="py-3.5 px-3 text-slate-400 text-[13px] whitespace-nowrap">
                    {item.updated}
                  </td>

                  {/* Aksieknoppie-kieslys */}
                  <td className="py-3.5 px-4 text-right relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-blue-600 transition"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {openMenuId === item.id && (
                      <div className="absolute right-4 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30 text-left text-xs font-medium">
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            onSelectListing(item);
                          }}
                          className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 block text-left"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => setOpenMenuId(null)}
                          className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 block"
                        >
                          Edit Listing
                        </button>
                        <button
                          onClick={() => setOpenMenuId(null)}
                          className="w-full px-3 py-1.5 hover:bg-rose-50 text-rose-600 block"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3.5 px-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-slate-400 text-xs">
          Showing <span className="font-semibold text-slate-700">{Math.min((currentPage - 1) * PAGE_SIZE + 1, listings.length)}–{Math.min(currentPage * PAGE_SIZE, listings.length)}</span> of{' '}
          <span className="font-semibold text-slate-700">{listings.length}</span> listings
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
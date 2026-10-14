import React from 'react';
import { Search, Calendar, ChevronDown, ArrowUpDown, Plus } from 'lucide-react';

interface ListingsToolbarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
  onClearFilters: () => void;
  onAddListing: () => void;
}

export const ListingsToolbar: React.FC<ListingsToolbarProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  onClearFilters,
  onAddListing,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left Filters Group */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search listing..."
            className="w-full bg-white pl-9 pr-3 py-2 rounded-xl border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm transition"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative inline-flex items-center">
          <span className="text-slate-400 mr-1.5 font-medium">Status</span>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white pl-3 pr-7 py-2 rounded-xl border border-slate-200/80 font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Published">Published</option>
              <option value="Ready for Review">Ready for Review</option>
              <option value="Missing Information">Missing Information</option>
              <option value="Processing">Processing</option>
              <option value="Awaiting Agent">Awaiting Agent</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Live Date Dropdown */}
        <div className="relative inline-flex items-center">
          <span className="text-slate-400 mr-1.5 font-medium">Live Date</span>
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              defaultValue="All dates"
              className="appearance-none bg-white pl-8 pr-7 py-2 rounded-xl border border-slate-200/80 font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All dates">All dates</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Priority Dropdown */}
        <div className="relative inline-flex items-center">
          <span className="text-slate-400 mr-1.5 font-medium">Priority</span>
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="appearance-none bg-white pl-3 pr-7 py-2 rounded-xl border border-slate-200/80 font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={onClearFilters}
          className="text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 transition"
        >
          Clear Filters
        </button>
      </div>

      {/* Right Controls: Sort & Add Listing */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-slate-500">
          <span>Sort by</span>
          <button className="flex items-center gap-1 bg-white px-3 py-2 rounded-xl border border-slate-200/80 font-medium text-slate-700 shadow-sm hover:border-slate-300 transition">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <span>Live Date (Soonest)</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
          </button>
        </div>

        <button
          onClick={onAddListing}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl shadow-sm hover:shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Listing</span>
        </button>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { X, Building, User, Calendar, ShieldAlert, Sparkles, Image as ImageIcon } from 'lucide-react';
import type { ListingItem, Priority, ListingStatus } from '../../types/index';

interface AddListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddListing: (newListing: ListingItem) => void;
}

export const AddListingModal: React.FC<AddListingModalProps> = ({
  isOpen,
  onClose,
  onAddListing,
}) => {
  const [formData, setFormData] = useState({
    address: '',
    city: 'Toronto, ON',
    mls: `X${Math.floor(1000000 + Math.random() * 9000000)}`,
    agent: 'John Smith',
    liveDate: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date()),
    status: 'Ready for Review' as ListingStatus,
    priority: 'Medium' as Priority,
    readiness: 75,
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=120&auto=format&fit=crop&q=80',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.address.trim()) return;

    const newListing: ListingItem = {
      id: `lst_${Date.now()}`,
      address: formData.address,
      city: formData.city,
      mls: formData.mls,
      agent: formData.agent,
      liveDate: formData.liveDate,
      isToday: false,
      status: formData.status,
      readiness: Number(formData.readiness),
      priority: formData.priority,
      updated: 'Just now',
      image: formData.imageUrl,
    };

    onAddListing(newListing);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Add New Listing</h3>
              <p className="text-[13px] text-slate-400">Intake a new property into the workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Street Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              required
              placeholder="e.g. 520 King Street West"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* City / Province & MLS Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City / Region</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">MLS #</label>
              <input
                type="text"
                required
                value={formData.mls}
                onChange={(e) => setFormData({ ...formData, mls: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition font-mono"
              />
            </div>
          </div>

          {/* Assigned Agent & Live Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Agent</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.agent}
                  onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
                  className="w-full text-xs pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Live Date</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.liveDate}
                  onChange={(e) => setFormData({ ...formData, liveDate: e.target.value })}
                  className="w-full text-xs pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ListingStatus })}
                className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition font-medium text-slate-700 cursor-pointer"
              >
                <option value="Ready for Review">Ready for Review</option>
                <option value="Published">Published</option>
                <option value="Processing">Processing</option>
                <option value="Awaiting Agent">Awaiting Agent</option>
                <option value="Missing Information">Missing Information</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <div className="relative">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-full text-xs pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition font-medium text-slate-700 cursor-pointer"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* AI Intake Readiness Slider */}
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Initial Readiness Score
              </span>
              <span className="text-xs font-bold text-blue-600">{formData.readiness}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={formData.readiness}
              onChange={(e) => setFormData({ ...formData, readiness: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
          </div>

          {/* Property Image URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Property Thumbnail URL</label>
            <div className="relative">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition text-slate-600"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 transition"
            >
              Create Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
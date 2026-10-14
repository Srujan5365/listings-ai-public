import React, { useState,useMemo } from 'react';
import { 
  Download, 
  ChevronDown, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Cpu,
  Mail,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CopyCheck,
  BellRing
} from 'lucide-react';
import type { ActivityLogCategory } from '../../types/index';
import { 
  mockAllActivityLogs, 
  mockDocumentActivityLogs, 
  mockStatusChangeLogs, 
  mockAgentCommunicationLogs, 
  mockSystemActionLogs 
} from '../../data/mockData';

function exportCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const ActivityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'All Activity' | 'Documents' | 'Status Changes' | 'Agent Communication' | 'System Actions'
  >('All Activity');

  // Filter States
  const [listingFilter, setListingFilter] = useState('All listings');
  const [allActivityStatusFilter, setAllActivityStatusFilter] = useState('All listings');
  const [activityTypeFilter, setActivityTypeFilter] = useState('All activity types');
  const [userFilter, setUserFilter] = useState('All users');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('All document types');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [senderFilter, setSenderFilter] = useState('All senders');
  const [communicationTypeFilter, setCommunicationTypeFilter] = useState('All types');
  const [systemActionFilter, setSystemActionFilter] = useState('All actions');
  const [dateRange, setDateRange] = useState('Last 7 days');
  const tabs = [
    'All Activity',
    'Documents',
    'Status Changes',
    'Agent Communication',
    'System Actions'
  ] as const;

  // Clear filters handler (Screenshot 6)
    const handleClearFilters = () => {
    setDateRange('Last 7 days');
    setAllActivityStatusFilter('All listings');
    setListingFilter('All listings');
    setActivityTypeFilter('All activity types');
    setUserFilter('All users');
    setDocumentTypeFilter('All document types');
    setStatusFilter('All statuses');
    setSenderFilter('All senders');
    setCommunicationTypeFilter('All types');
    setSystemActionFilter('All actions');
    };

  const isWithinDateRange = (dateStr: string, range: string): boolean => {
  if (range === 'All time') return true;

  // Reference date matching the mock dataset ("Sep 26, 2024")
  const baseDate = new Date('2024-09-26T23:59:59');
  const itemDate = new Date(dateStr);

  // Difference in calendar days
  const diffTime = baseDate.getTime() - itemDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (range === 'Today') {
    return diffDays === 0;
  }
  if (range === 'Last 7 days') {
    return diffDays >= 0 && diffDays <= 7;
  }
  if (range === 'Last 30 days') {
    return diffDays >= 0 && diffDays <= 30;
  }

  return true;
  };

    const isFiltered = useMemo(() => {
    // Check if date filter is modified from default "Last 7 days"
    const isDateFiltered = dateRange !== 'Last 7 days';

    if (activeTab === 'All Activity') {
        return (
        isDateFiltered ||
        allActivityStatusFilter !== 'All listings' ||
        activityTypeFilter !== 'All activity types' ||
        userFilter !== 'All users'
        );
    }

    if (activeTab === 'Documents') {
        return (
        isDateFiltered ||
        listingFilter !== 'All listings' ||
        documentTypeFilter !== 'All document types' ||
        userFilter !== 'All users'
        );
    }

    if (activeTab === 'Status Changes') {
        return (
        isDateFiltered ||
        listingFilter !== 'All listings' ||
        statusFilter !== 'All statuses' ||
        userFilter !== 'All users'
        );
    }

    if (activeTab === 'Agent Communication') {
        return (
        isDateFiltered ||
        listingFilter !== 'All listings' ||
        senderFilter !== 'All senders' ||
        communicationTypeFilter !== 'All types'
        );
    }

    if (activeTab === 'System Actions') {
        return (
        isDateFiltered ||
        listingFilter !== 'All listings' ||
        systemActionFilter !== 'All actions'
        );
    }

    return false;
    }, [
    activeTab,
    dateRange,
    allActivityStatusFilter,
    activityTypeFilter,
    userFilter,
    listingFilter,
    documentTypeFilter,
    statusFilter,
    senderFilter,
    communicationTypeFilter,
    systemActionFilter,
    ]);

  // Badge Helper: Type Badge (Screenshots 1 & 6)
  const getTypeBadge = (type: ActivityLogCategory) => {
    switch (type) {
      case 'Document':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[13px]">
              <FileText className="w-2.5 h-2.5" />
            </span>
            Document
          </span>
        );
      case 'Validation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[13px]">
              <CheckCircle2 className="w-2.5 h-2.5" />
            </span>
            Validation
          </span>
        );
      case 'Status':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[13px]">
              <Clock className="w-2.5 h-2.5" />
            </span>
            Status
          </span>
        );
      case 'Communication':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[13px]">
              <MessageSquare className="w-2.5 h-2.5" />
            </span>
            Communication
          </span>
        );
      case 'System':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-4 h-4 rounded-full bg-slate-600 text-white flex items-center justify-center text-[13px]">
              <Cpu className="w-2.5 h-2.5" />
            </span>
            System
          </span>
        );
    }
  };

  // Badge Helper: Status Pill (Screenshot 3)
  const getStatusPill = (status: string) => {
    switch (status) {
      case 'Missing Information':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[13px] font-semibold bg-rose-50 text-rose-600 border border-rose-100">
            <ShieldAlert className="w-3 h-3 text-rose-500" />
            Missing Information
          </span>
        );
      case 'In Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
            In Review
          </span>
        );
      case 'Ready for Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Ready for Review
          </span>
        );
      case 'Awaiting Agent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Awaiting Agent
          </span>
        );
      case 'New':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            New
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Processing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[13px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // Icon Helper: System Actions (Screenshot 5)
  const getSystemActionIcon = (iconType: string) => {
    switch (iconType) {
      case 'validation':
        return <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />;
      case 'document':
        return <FileText className="w-3.5 h-3.5 text-slate-600" />;
      case 'ai':
        return <Sparkles className="w-3.5 h-3.5 text-slate-600" />;
      case 'duplicate':
        return <CopyCheck className="w-3.5 h-3.5 text-slate-600" />;
      case 'notification':
        return <BellRing className="w-3.5 h-3.5 text-slate-600" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  // 1. All Activity Logs
  const filteredAllActivityLogs = useMemo(() => {
    return mockAllActivityLogs.filter((item) => {
      const matchesDate = isWithinDateRange(item.date, dateRange);

      const matchesListing =
        allActivityStatusFilter === 'All listings'
          ? true
          : allActivityStatusFilter === 'Ready for Review'
          ? item.statusFilterTag === 'Ready for Review'
          : item.address === allActivityStatusFilter;

      const matchesType =
        activityTypeFilter === 'All activity types'
          ? true
          : item.type === activityTypeFilter;

      const matchesUser =
        userFilter === 'All users' ? true : item.user.name === userFilter;

      return matchesDate && matchesListing && matchesType && matchesUser;
    });
  }, [allActivityStatusFilter, activityTypeFilter, userFilter, dateRange]);

  // 2. Documents Logs
  const filteredDocumentLogs = useMemo(() => {
    return mockDocumentActivityLogs.filter((item) => {
      const matchesDate = isWithinDateRange(item.date, dateRange);
      const matchesListing =
        listingFilter === 'All listings' ? true : item.address === listingFilter;
      const matchesDocType =
        documentTypeFilter === 'All document types'
          ? true
          : item.documentType === documentTypeFilter;
      const matchesUser =
        userFilter === 'All users' ? true : item.user.name === userFilter;

      return matchesDate && matchesListing && matchesDocType && matchesUser;
    });
  }, [listingFilter, documentTypeFilter, userFilter, dateRange]);

  // 3. Status Change Logs
  const filteredStatusChangeLogs = useMemo(() => {
    return mockStatusChangeLogs.filter((item) => {
      const matchesDate = isWithinDateRange(item.date, dateRange);
      const matchesListing =
        listingFilter === 'All listings' ? true : item.address === listingFilter;
      const matchesStatus =
        statusFilter === 'All statuses'
          ? true
          : item.fromStatus === statusFilter || item.toStatus === statusFilter;
      const matchesUser =
        userFilter === 'All users' ? true : item.user.name === userFilter;

      return matchesDate && matchesListing && matchesStatus && matchesUser;
    });
  }, [listingFilter, statusFilter, userFilter, dateRange]);

  // 4. Agent Communication Logs
  const filteredAgentCommunicationLogs = useMemo(() => {
    return mockAgentCommunicationLogs.filter((item) => {
      const matchesDate = isWithinDateRange(item.date, dateRange);
      const matchesListing =
        listingFilter === 'All listings' ? true : item.address === listingFilter;
      const matchesSender =
        senderFilter === 'All senders' ? true : item.sender.includes(senderFilter);
      const matchesType =
        communicationTypeFilter === 'All types'
          ? true
          : item.type === communicationTypeFilter;

      return matchesDate && matchesListing && matchesSender && matchesType;
    });
  }, [listingFilter, senderFilter, communicationTypeFilter, dateRange]);

  // 5. System Action Logs
  const filteredSystemActionLogs = useMemo(() => {
    return mockSystemActionLogs.filter((item) => {
      const matchesDate = isWithinDateRange(item.date, dateRange);
      const matchesListing =
        listingFilter === 'All listings' ? true : item.address === listingFilter;
      const matchesAction =
        systemActionFilter === 'All actions'
          ? true
          : item.action === systemActionFilter;

      return matchesDate && matchesListing && matchesAction;
    });
  }, [listingFilter, systemActionFilter, dateRange]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity</h1>
        <p className="text-xs text-slate-500 mt-1">
          Track all activity across your listings.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-slate-200/80 text-xs font-semibold text-slate-400">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 border-b-2 transition -mb-px flex items-center gap-2 cursor-pointer ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* FILTER BAR FOR ALL 5 TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* TAB 1: ALL ACTIVITY (Screenshots 1 & 6) */}
          {activeTab === 'All Activity' && (
            <>
              <div className="relative">
                <select
                  value={allActivityStatusFilter}
                  onChange={(e) => setAllActivityStatusFilter(e.target.value)}
                  className={`appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border font-medium shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                    allActivityStatusFilter !== 'All listings'
                      ? 'border-blue-500 text-blue-700 bg-blue-50/20'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <option value="All listings">All listings</option>
                  <option value="Ready for Review">Ready for Review</option>
                  <option value="123 Main Street">123 Main Street</option>
                  <option value="456 Oak Avenue">456 Oak Avenue</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={activityTypeFilter}
                  onChange={(e) => setActivityTypeFilter(e.target.value)}
                  className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All activity types">All activity types</option>
                  <option value="Document">Document</option>
                  <option value="Validation">Validation</option>
                  <option value="Status">Status</option>
                  <option value="Communication">Communication</option>
                  <option value="System">System</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All users">All users</option>
                  <option value="System">System</option>
                  <option value="María López">María López</option>
                  <option value="Robert Taylor">Robert Taylor</option>
                  <option value="John Smith">John Smith</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </>
          )}

          {/* TAB 2: DOCUMENTS (Screenshot 2) */}
          {activeTab === 'Documents' && (
            <>
              <div className="relative">
                <select
                  value={listingFilter}
                  onChange={(e) => setListingFilter(e.target.value)}
                  className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All listings">All listings</option>
                  <option value="123 Main Street">123 Main Street</option>
                  <option value="456 Oak Avenue">456 Oak Avenue</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={documentTypeFilter}
                  onChange={(e) => setDocumentTypeFilter(e.target.value)}
                  className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All document types">All document types</option>
                  <option value="Floor Plans">Floor Plans</option>
                  <option value="Property Survey">Property Survey</option>
                  <option value="Property Tax Bill">Property Tax Bill</option>
                  <option value="Condo Management Info">Condo Management Info</option>
                  <option value="MLS Input Form">MLS Input Form</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All users">All users</option>
                  <option value="John Smith">John Smith</option>
                  <option value="System">System</option>
                  <option value="Michael Kim">Michael Kim</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </>
          )}

          {/* TAB 3: STATUS CHANGES (Screenshot 3) */}
          {activeTab === 'Status Changes' && (
            <>
              <div className="relative">
                <select
                  value={listingFilter}
                  onChange={(e) => setListingFilter(e.target.value)}
                  className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All listings">All listings</option>
                  <option value="456 Oak Avenue">456 Oak Avenue</option>
                  <option value="789 Pine Road">789 Pine Road</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All statuses">All statuses</option>
                  <option value="Missing Information">Missing Information</option>
                  <option value="In Review">In Review</option>
                  <option value="Ready for Review">Ready for Review</option>
                  <option value="Awaiting Agent">Awaiting Agent</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All users">All users</option>
                  <option value="System">System</option>
                  <option value="María López">María López</option>
                  <option value="Michael Kim">Michael Kim</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </>
          )}

          {/* TAB 4: AGENT COMMUNICATION (Screenshot 4) */}
          {activeTab === 'Agent Communication' && (
            <>
              <div className="relative">
                <select
                  value={listingFilter}
                  onChange={(e) => setListingFilter(e.target.value)}
                  className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All listings">All listings</option>
                  <option value="123 Main Street">123 Main Street</option>
                  <option value="321 Maple Drive">321 Maple Drive</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={senderFilter}
                  onChange={(e) => setSenderFilter(e.target.value)}
                  className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All senders">All senders</option>
                  <option value="John Smith">John Smith</option>
                  <option value="Michael Kim">Michael Kim</option>
                  <option value="Sarah Wilson">Sarah Wilson</option>
                  <option value="Robert Taylor">Robert Taylor</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={communicationTypeFilter}
                  onChange={(e) => setCommunicationTypeFilter(e.target.value)}
                  className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All types">All types</option>
                  <option value="Email">Email</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </>
          )}

          {/* TAB 5: SYSTEM ACTIONS (Screenshot 5) */}
          {activeTab === 'System Actions' && (
            <>
              <div className="relative">
                <select
                  value={listingFilter}
                  onChange={(e) => setListingFilter(e.target.value)}
                  className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All listings">All listings</option>
                  <option value="456 Oak Avenue">456 Oak Avenue</option>
                  <option value="789 Pine Road">789 Pine Road</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={systemActionFilter}
                  onChange={(e) => setSystemActionFilter(e.target.value)}
                  className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All actions">All actions</option>
                  <option value="Validation run">Validation run</option>
                  <option value="Document processed">Document processed</option>
                  <option value="AI data extraction">AI data extraction</option>
                  <option value="Duplicate check">Duplicate check</option>
                  <option value="Notification sent">Notification sent</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </>
          )}

          {/* Date Range Dropdown (Common across all tabs) */}
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none bg-white pl-8 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Last 7 days">Last 7 days</option>
              <option value="Today">Today</option>
              <option value="Last 30 days">Last 30 days</option>
              <option value="All time">All time</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Clear Filters Link (Screenshot 6) */}
          {isFiltered && (
            <button
              onClick={handleClearFilters}
              className="text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 transition cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={() => {
            if (activeTab === 'All Activity') {
              exportCSV('activity_all.csv', filteredAllActivityLogs.map(r => ({ Date: r.date, Time: r.time, Address: r.address, MLS: r.mls, Activity: r.activity, Details: r.details, User: r.user.name, Type: r.type })));
            } else if (activeTab === 'Documents') {
              exportCSV('activity_documents.csv', filteredDocumentLogs.map(r => ({ Date: r.date, Time: r.time, Address: r.address, MLS: r.mls, DocumentType: r.documentType, FileName: r.fileName, Action: r.action, User: r.user.name })));
            } else if (activeTab === 'Status Changes') {
              exportCSV('activity_status.csv', filteredStatusChangeLogs.map(r => ({ Date: r.date, Time: r.time, Address: r.address, MLS: r.mls, From: r.fromStatus, To: r.toStatus, Details: r.details, User: r.user.name })));
            } else if (activeTab === 'Agent Communication') {
              exportCSV('activity_communication.csv', filteredAgentCommunicationLogs.map(r => ({ Date: r.date, Time: r.time, Address: r.address, MLS: r.mls, Sender: r.sender, Subject: r.subject, Details: r.details, Type: r.type })));
            } else if (activeTab === 'System Actions') {
              exportCSV('activity_system.csv', filteredSystemActionLogs.map(r => ({ Date: r.date, Time: r.time, Address: r.address, MLS: r.mls, Action: r.action, Details: r.details })));
            }
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Export</span>
        </button>
      </div>

      {/* RENDER ACTIVE TAB TABLE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          
          {/* TAB 1: ALL ACTIVITY / FILTERED VIEW (Screenshots 1 & 6) */}
          {activeTab === 'All Activity' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#f8fafc] text-slate-400 font-medium text-[13px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Date & Time</th>
                  <th className="py-3 px-4">Listing Address</th>
                  <th className="py-3 px-4">Activity</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-5">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAllActivityLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{item.date}</div>
                      <div className="text-[13px] text-slate-400">{item.time}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{item.address}</div>
                      <div className="text-[13px] text-slate-400 font-mono">{item.mls}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {item.activity}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {item.details}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full text-white text-[12px] font-bold flex items-center justify-center shrink-0 ${item.user.bgColor}`}>
                          {item.user.initials}
                        </div>
                        <span className="font-medium text-slate-800">{item.user.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      {getTypeBadge(item.type)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 2: DOCUMENTS (Screenshot 2) */}
          {activeTab === 'Documents' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#f8fafc] text-slate-400 font-medium text-[13px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Date & Time</th>
                  <th className="py-3 px-4">Listing Address</th>
                  <th className="py-3 px-4">Document Type</th>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-5">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocumentLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{item.date}</div>
                      <div className="text-[13px] text-slate-400">{item.time}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{item.address}</div>
                      <div className="text-[13px] text-slate-400 font-mono">{item.mls}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {item.documentType}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-5 rounded-xs bg-red-50 border border-red-200 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[7px] font-black text-rose-600 leading-none">PDF</span>
                        </div>
                        <span className="text-slate-700 font-medium hover:text-blue-600 cursor-pointer transition">
                          {item.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Uploaded
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full text-white text-[12px] font-bold flex items-center justify-center shrink-0 ${item.user.bgColor}`}>
                          {item.user.initials}
                        </div>
                        <span className="font-medium text-slate-800">{item.user.name}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 3: STATUS CHANGES (Screenshot 3) */}
          {activeTab === 'Status Changes' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#f8fafc] text-slate-400 font-medium text-[13px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Date & Time</th>
                  <th className="py-3 px-4">Listing Address</th>
                  <th className="py-3 px-4">From Status</th>
                  <th className="py-3 px-2 w-8"></th>
                  <th className="py-3 px-4">To Status</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-5">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStatusChangeLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{item.date}</div>
                      <div className="text-[13px] text-slate-400">{item.time}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{item.address}</div>
                      <div className="text-[13px] text-slate-400 font-mono">{item.mls}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusPill(item.fromStatus)}
                    </td>
                    <td className="py-3.5 px-2 text-slate-400">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusPill(item.toStatus)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {item.details}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full text-white text-[12px] font-bold flex items-center justify-center shrink-0 ${item.user.bgColor}`}>
                          {item.user.initials}
                        </div>
                        <span className="font-medium text-slate-800">{item.user.name}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 4: AGENT COMMUNICATION (Screenshot 4) */}
          {activeTab === 'Agent Communication' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#f8fafc] text-slate-400 font-medium text-[13px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Date & Time</th>
                  <th className="py-3 px-4">Listing Address</th>
                  <th className="py-3 px-4">Sender</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-5">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAgentCommunicationLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{item.date}</div>
                      <div className="text-[13px] text-slate-400">{item.time}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{item.address}</div>
                      <div className="text-[13px] text-slate-400 font-mono">{item.mls}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full text-white text-[12px] font-bold flex items-center justify-center shrink-0 ${item.bgColor}`}>
                          {item.initials}
                        </div>
                        <span className="font-medium text-slate-800">{item.sender}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {item.subject}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {item.details}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                        <Mail className="w-3.5 h-3.5" />
                        Email
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 5: SYSTEM ACTIONS (Screenshot 5) */}
          {activeTab === 'System Actions' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#f8fafc] text-slate-400 font-medium text-[13px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Date & Time</th>
                  <th className="py-3 px-4">Listing Address</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-6">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSystemActionLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{item.date}</div>
                      <div className="text-[13px] text-slate-400">{item.time}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{item.address}</div>
                      <div className="text-[13px] text-slate-400 font-mono">{item.mls}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          {getSystemActionIcon(item.iconType)}
                        </div>
                        <span className="font-semibold text-slate-800">{item.action}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {item.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      </div>
    </div>
  );
};
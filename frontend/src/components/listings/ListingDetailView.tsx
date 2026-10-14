import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit2,
  MessageSquare,
  Check,
  MoreHorizontal,
  Folder,
  Globe,
  CheckSquare,
  X,
  UserCheck,
  FileText,
  Minus,
  Plus,
  Maximize2,
  Search,
  Download,
  ChevronDown,
  Send,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import {
  mockListingValidations,
  mockListingActivities,
} from '../../data/mockData';
import type { ListingItem } from '../../types/index';

function calcDaysUntil(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const days = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Today';
    return `${days}d`;
  } catch {
    return '';
  }
}

export interface ListingDetailPageProps {
  listing: ListingItem;
  onBack: () => void;
  onApprove?: () => void;
}

export const ListingDetailView: React.FC<ListingDetailPageProps> = ({
  listing,
  onBack,
  onApprove,
}) => {
  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Documents' | 'Validation' | 'Missing Information' | 'Activity'
  >('Overview');

  // Agent State
  const [isEditAgentOpen, setIsEditAgentOpen] = useState(false);
  const [agentData, setAgentData] = useState({
    name: listing.agent || 'John Smith',
    email: 'john.smith@rema.ca',
    phone: '(416) 555-0123',
    initials: 'JS',
  });
  const [tempAgentData, setTempAgentData] = useState(agentData);

  // Approval and Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [showApprovalToast, setShowApprovalToast] = useState(false);
  const isApproved = ['Published', 'Approved'].includes(listing.status as string);
  const [readinessScore, setReadinessScore] = useState(
    isApproved ? 100 : listing.readiness ?? 87
  );

  // Validation Tab State
  const [validationFilter, setValidationFilter] = useState<'All' | 'Confirmed' | 'Review' | 'Conflict'>('All');
  const [validationSearch, setValidationSearch] = useState('');
  const [showConflictPanel, setShowConflictPanel] = useState(false);

  // Missing Info State
  const [noteText, setNoteText] = useState('');

  // Documents Tab State
  const [selectedDocId, setSelectedDocId] = useState('doc_1');
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [docDetailTab, setDocDetailTab] = useState<
    'Extracted Information' | 'Document Details'
  >('Extracted Information');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedDocs, setUploadedDocs] = useState<{ id: string; title: string; format: string; pages: number; isVerified: boolean }[]>([]);

  // Generic info toast
  const [toastMsg, setToastMsg] = useState('');
  const showMsg = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  // Email composer state
  const [emailRecipient, setEmailRecipient] = useState(true);
  const [showCcField, setShowCcField] = useState(false);

  const galleryImages = [
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&auto=format&fit=crop&q=80',
  ];

  const baseDocuments = [
    { id: 'doc_1', title: 'Agreement of Purchase and Sale', format: 'PDF', pages: 9, isVerified: true },
    { id: 'doc_2', title: 'MLS Listing Input Form', format: 'PDF', pages: 2, isVerified: true },
    { id: 'doc_3', title: 'Seller Property Information', format: 'PDF', pages: 4, isVerified: true },
    { id: 'doc_4', title: 'Floor Plans', format: 'PDF', pages: 2, isVerified: true },
    { id: 'doc_5', title: 'Property Survey', format: 'PDF', pages: 7, isVerified: true },
    { id: 'doc_6', title: 'Condo Status Certificate', format: 'PDF', pages: 18, isVerified: false },
  ];
  const sourceDocuments = [...baseDocuments, ...uploadedDocs];

  // Map documents with individual previews & extracted data
  const documentDetailsMap: Record<
    string,
    {
      title: string;
      docType: string;
      format: string;
      pages: number;
      isVerified: boolean;
      fileName: string;
      uploadDate: string;
      sections: { title: string; content: React.ReactNode }[];
      extracted: { field: string; value: string; score: number; page: string }[];
    }
  > = {
    doc_1: {
      title: 'Agreement of Purchase and Sale',
      docType: 'RESIDENTIAL',
      format: 'PDF',
      pages: 9,
      isVerified: true,
      fileName: 'Agreement_of_Purchase_and_Sale.pdf',
      uploadDate: 'Sep 20, 2024 • 10:14 AM',
      extracted: [
        { field: 'Property Address', value: `${listing.address}, ${listing.city} ON`, score: 98, page: 'Page 1' },
        { field: 'Purchase Price', value: '$1,249,000', score: 98, page: 'Page 1' },
        { field: 'Deposit Amount', value: '$50,000', score: 95, page: 'Page 1' },
        { field: 'Closing Date', value: 'October 25, 2024', score: 97, page: 'Page 1' },
        { field: 'Property Type', value: listing.type || 'Residential', score: 96, page: 'Page 1' },
        { field: 'Legal Description', value: 'PLAN 1234 LOT 56', score: 92, page: 'Page 1' },
      ],
      sections: [
        {
          title: '1. Buyer and Seller',
          content: (
            <div className="space-y-1">
              <p className="text-[12px] text-slate-500 leading-tight">
                THIS AGREEMENT OF PURCHASE AND SALE dated this 15th day of September, 2024.
              </p>
              <div className="pt-1 text-[12px] space-y-0.5">
                <div className="flex gap-2">
                  <span className="text-slate-400 w-12">BUYER:</span>
                  <span className="font-semibold text-slate-800">John Smith</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400 w-12">SELLER:</span>
                  <span className="font-semibold text-slate-800">Jane Doe</span>
                </div>
              </div>
            </div>
          ),
        },
        {
          title: '2. Property',
          content: (
            <div className="space-y-1">
              <div className="bg-blue-100/70 border border-blue-200 text-blue-900 px-2 py-1 rounded-md text-[12px] font-medium flex items-center justify-between">
                <span>Municipal Address:</span>
                <span className="font-bold">{listing.address}, {listing.city} ON</span>
              </div>
              <div className="text-[12px] pt-1 space-y-0.5 text-slate-600">
                <div>Legal Description: PLAN 1234 LOT 56</div>
                <div>Property Type: {listing.type || 'Residential'}</div>
              </div>
            </div>
          ),
        },
        {
          title: '3. Purchase Price & Deposit',
          content: (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-slate-500">Purchase Price:</span>
                <span className="px-2 py-0.5 border border-slate-300 font-bold bg-slate-50 rounded text-slate-900">
                  $1,249,000
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-slate-500">Deposit:</span>
                <span className="px-2 py-0.5 border border-slate-300 font-bold bg-slate-50 rounded text-slate-900">
                  $50,000
                </span>
              </div>
            </div>
          ),
        },
      ],
    },
    doc_2: {
      title: 'MLS Listing Input Form',
      docType: 'MLS DATA FORM',
      format: 'PDF',
      pages: 2,
      isVerified: true,
      fileName: 'MLS_Listing_Input_Form.pdf',
      uploadDate: 'Sep 20, 2024 • 11:30 AM',
      extracted: [
        { field: 'MLS #', value: listing.mls, score: 99, page: 'Page 1' },
        { field: 'Bedrooms', value: '3', score: 92, page: 'Page 1' },
        { field: 'Bathrooms', value: '2', score: 91, page: 'Page 1' },
        { field: 'Parking Spaces', value: '1', score: 94, page: 'Page 2' },
      ],
      sections: [
        {
          title: 'MLS Identification & Rooms',
          content: (
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400">MLS Number:</span>
                <span className="font-mono font-bold text-slate-800">{listing.mls}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400">Bedrooms:</span>
                <span className="font-semibold text-slate-800">3 Total (2 Main, 1 Lower)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bathrooms:</span>
                <span className="font-semibold text-slate-800">2 (1 Full, 1 Powder)</span>
              </div>
            </div>
          ),
        },
      ],
    },
    doc_3: {
      title: 'Seller Property Information',
      docType: 'DISCLOSURE',
      format: 'PDF',
      pages: 4,
      isVerified: true,
      fileName: 'Seller_Property_Information.pdf',
      uploadDate: 'Sep 21, 2024 • 09:15 AM',
      extracted: [
        { field: 'Year Built', value: '2010', score: 85, page: 'Page 1' },
        { field: 'Roof Age', value: '2018 (6 years)', score: 90, page: 'Page 2' },
        { field: 'Heating Type', value: 'Forced Air / Natural Gas', score: 94, page: 'Page 2' },
      ],
      sections: [
        {
          title: 'Property Condition & Disclosures',
          content: (
            <div className="space-y-1 text-[12px] text-slate-600">
              <p>Known defects or structural issues: <strong className="text-slate-900">None declared</strong>.</p>
              <p>Roof replaced in 2018 under manufacturer warranty.</p>
              <p>Heating: Forced Air Natural Gas furnace inspected annually.</p>
            </div>
          ),
        },
      ],
    },
    doc_4: {
      title: 'Floor Plans',
      docType: 'ARCHITECTURAL',
      format: 'PDF',
      pages: 2,
      isVerified: true,
      fileName: 'FloorPlans.pdf',
      uploadDate: 'Sep 21, 2024 • 10:00 AM',
      extracted: [
        { field: 'Square Footage', value: '1,850 sq ft', score: 93, page: 'Page 1' },
        { field: 'Above Grade Sq Ft', value: '1,450 sq ft', score: 90, page: 'Page 1' },
        { field: 'Basement Finished', value: 'Yes (400 sq ft)', score: 88, page: 'Page 2' },
      ],
      sections: [
        {
          title: 'Area Measurements',
          content: (
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400">Total Area:</span>
                <span className="font-bold text-slate-900">1,850 sq ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Basement:</span>
                <span className="font-semibold text-slate-800">Finished Recreation Area</span>
              </div>
            </div>
          ),
        },
      ],
    },
    doc_5: {
      title: 'Property Survey',
      docType: 'LEGAL SURVEY',
      format: 'PDF',
      pages: 7,
      isVerified: true,
      fileName: 'Property_Survey.pdf',
      uploadDate: 'Sep 21, 2024 • 11:00 AM',
      extracted: [
        { field: 'Lot Dimensions', value: '30 ft x 120 ft', score: 95, page: 'Page 1' },
        { field: 'Easements', value: 'City Utilities rear 3ft', score: 89, page: 'Page 2' },
      ],
      sections: [
        {
          title: 'Boundaries & Survey Findings',
          content: (
            <div className="text-[12px] space-y-1 text-slate-600">
              <p>Lot fronting 30.00 feet on Main Street by depth of 120.00 feet.</p>
              <p>Registered survey under Ontario Land Titles PIN 12345-0067.</p>
            </div>
          ),
        },
      ],
    },
    doc_6: {
      title: 'Condo Status Certificate',
      docType: 'STATUS CERT',
      format: 'PDF',
      pages: 18,
      isVerified: false,
      fileName: 'Condo_Status_Certificate.pdf',
      uploadDate: 'Sep 22, 2024 • 03:20 PM',
      extracted: [
        { field: 'Status Certificate', value: 'Pending review', score: 60, page: 'Page 1' },
      ],
      sections: [
        {
          title: 'Certificate Status',
          content: (
            <div className="text-[12px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
              Awaiting confirmation from condo corporation management.
            </div>
          ),
        },
      ],
    },
  };

  // Derive active document from selectedDocId — fall back to a placeholder for uploaded docs
  const uploadedDocMeta = uploadedDocs.find(d => d.id === selectedDocId);
  const activeDoc = documentDetailsMap[selectedDocId] ?? (uploadedDocMeta ? {
    title: uploadedDocMeta.title,
    docType: uploadedDocMeta.format,
    format: uploadedDocMeta.format,
    pages: uploadedDocMeta.pages,
    isVerified: false,
    fileName: `${uploadedDocMeta.title}.${uploadedDocMeta.format.toLowerCase()}`,
    uploadDate: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date()),
    extracted: [],
    sections: [{ title: 'Document uploaded', content: <p className="text-[12px] text-slate-400">Processing pending.</p> }],
  } : documentDetailsMap['doc_1']);

  const extractedDataList = [
    { field: 'Property Address', value: `${listing.address}, ${listing.city} ON M5V 3A8`, score: 98, page: 'Page 1' },
    { field: 'Purchase Price', value: '$1,249,000', score: 98, page: 'Page 1' },
    { field: 'Deposit Amount', value: '$50,000', score: 95, page: 'Page 1' },
    { field: 'Closing Date', value: 'October 25, 2024', score: 97, page: 'Page 1' },
    { field: 'Property Type', value: listing.type || 'Residential', score: 96, page: 'Page 1' },
    { field: 'Legal Description', value: 'PLAN 1234 LOT 56', score: 92, page: 'Page 1' },
    { field: 'Bedrooms', value: '3', score: 90, page: 'Page 2' },
    { field: 'Bathrooms', value: '2', score: 90, page: 'Page 2' },
    { field: 'Square Footage', value: '1,850', score: 88, page: 'Page 2' },
    { field: 'Year Built', value: '2010', score: 85, page: 'Page 3' },
  ];

  const handleSaveAgent = (e: React.FormEvent) => {
    e.preventDefault();
    const initials =
      tempAgentData.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'AG';

    setAgentData({
      ...tempAgentData,
      initials,
    });
    setIsEditAgentOpen(false);
  };

  const handleApproveAction = () => {
    setIsConfirmModalOpen(false);
    setReadinessScore(100);
    setShowApprovalToast(true);
    if (onApprove) onApprove();
    setTimeout(() => setShowApprovalToast(false), 4000);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      {/* 1. Back Navigation Button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition -mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Listings</span>
        </button>
      </div>

      {/* 2. Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {listing.address}, {listing.city}
            </h1>
            <span className="text-[13px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {listing.type || 'Residential'}
            </span>
            {isApproved ? (
              <span className="text-[13px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Approved
              </span>
            ) : (
              <span className={`text-[13px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                listing.priority === 'High'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200/60'
                  : listing.priority === 'Medium'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                  : 'bg-blue-50 text-blue-600 border border-blue-200/60'
              }`}>
                <span className={`w-2 h-2 rounded-full ${listing.priority === 'High' ? 'bg-rose-500' : listing.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                {listing.priority} Priority
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
            <span>
              MLS # <strong className="font-semibold text-slate-700">{listing.mls}</strong>
            </span>
            <span>•</span>
            <span>
              Agent: <strong className="font-semibold text-slate-700">{agentData.name}</strong>
            </span>
            <span>•</span>
            <span>
              Live Date: <strong className="font-semibold text-slate-700">{listing.liveDate}</strong>{' '}
              {calcDaysUntil(listing.liveDate) && (
                <span className={`font-semibold ${calcDaysUntil(listing.liveDate).includes('overdue') ? 'text-rose-500' : 'text-amber-500'}`}>
                  ({calcDaysUntil(listing.liveDate)})
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('Missing Information')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Recommend Edits</span>
          </button>
          {!isApproved ? (
            <button
              onClick={() => setIsConfirmModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <span>Approve Listing</span>
            </button>
          ) : (
            <span className="px-3.5 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-200">
              Listing Approved
            </span>
          )}
          <button onClick={() => showMsg('More options coming soon.')} className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 shadow-xs transition cursor-pointer">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Navigation Sub-Tabs */}
      <div className="flex items-center gap-8 border-b border-slate-200/80 text-xs font-semibold text-slate-400">
        {(['Overview', 'Documents', 'Validation', 'Missing Information', 'Activity'] as const).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 border-b-2 transition -mb-px flex items-center gap-2 cursor-pointer ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent hover:text-slate-700'
              }`}
            >
              <span>{tab}</span>
              {tab === 'Missing Information' && !isApproved && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[12px] font-bold flex items-center justify-center leading-none">
                  2
                </span>
              )}
            </button>
          )
        )}
      </div>

      {/* ===================== TAB 1: OVERVIEW ===================== */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* COLUMN 1: Gallery & Property Details */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs space-y-3">
              <div className="relative rounded-xl overflow-hidden aspect-16/10 group">
                <img
                  src={listing.image || galleryImages[0]}
                  alt="Main Property"
                  className="w-full h-full object-cover"
                />
                <button onClick={() => showMsg('Gallery editing coming soon.')} className="absolute top-3 right-3 bg-white/90 hover:bg-white text-slate-800 text-[13px] font-semibold px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1 backdrop-blur-xs transition cursor-pointer">
                  <Edit2 className="w-3 h-3 text-slate-600" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <img
                  src={galleryImages[1]}
                  alt="Thumbnail 1"
                  className="rounded-lg aspect-square object-cover border border-slate-100"
                />
                <img
                  src={galleryImages[2]}
                  alt="Thumbnail 2"
                  className="rounded-lg aspect-square object-cover border border-slate-100"
                />
                <img
                  src={galleryImages[3]}
                  alt="Thumbnail 3"
                  className="rounded-lg aspect-square object-cover border border-slate-100"
                />
                <div className="rounded-lg aspect-square bg-slate-900/60 text-white font-bold text-xs flex items-center justify-center relative overflow-hidden group cursor-pointer">
                  <img
                    src={galleryImages[0]}
                    alt="Extra"
                    className="absolute inset-0 w-full h-full object-cover -z-10 opacity-40"
                  />
                  <span>+12</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800">Property Details</h3>
                <button onClick={() => showMsg('Property details editing coming soon.')} className="text-[13px] font-semibold text-blue-600 hover:underline cursor-pointer">
                  Edit
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Address</span>
                  <span className="font-medium text-slate-800 text-right">
                    {listing.address},<br />
                    {listing.city}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">MLS #</span>
                  <span className="font-semibold text-slate-800 font-mono">{listing.mls}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Property Type</span>
                  <span className="font-medium text-slate-800">{listing.type || 'Residential'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Price</span>
                  <span className="font-bold text-slate-900">$1,249,000</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Bedrooms</span>
                  <span className="font-medium text-slate-800">3</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Bathrooms</span>
                  <span className="font-medium text-slate-800">2</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Square Footage</span>
                  <span className="font-medium text-slate-800">1,850</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Year Built</span>
                  <span className="font-medium text-slate-800">2010</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Live Date</span>
                  <span className="font-semibold text-rose-500">{listing.liveDate}{calcDaysUntil(listing.liveDate) ? ` (${calcDaysUntil(listing.liveDate)})` : ''}</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Readiness & Key Information */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800">Readiness</h3>

              <div className="flex items-center gap-6">
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
                    <circle
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth="4"
                    />
                    <circle
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke={readinessScore === 100 ? '#10b981' : '#0d9488'}
                      strokeWidth="4"
                      strokeDasharray={`${readinessScore} ${100 - readinessScore}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-bold text-slate-900 leading-none">
                      {readinessScore}%
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block">Documents</span>
                      <span className="text-[13px] text-slate-400">
                        {readinessScore === 100 ? '10 of 10 received' : '8 of 10 received'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block">Data Validation</span>
                      <span className="text-[13px] text-slate-400">
                        {readinessScore === 100 ? '14 of 14 confirmed' : '12 of 14 confirmed'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        readinessScore === 100
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      {readinessScore === 100 ? (
                        <Check className="w-2.5 h-2.5" />
                      ) : (
                        <AlertCircle className="w-2.5 h-2.5" />
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block">Missing Information</span>
                      <span
                        className={`text-[13px] font-medium ${
                          readinessScore === 100 ? 'text-slate-400' : 'text-amber-600'
                        }`}
                      >
                        {readinessScore === 100 ? 'All items completed' : '2 items pending'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        readinessScore === 100
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {readinessScore === 100 ? (
                        <Check className="w-2.5 h-2.5" />
                      ) : (
                        <Clock className="w-2.5 h-2.5" />
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block">Agent Confirmation</span>
                      <span className="text-[13px] text-slate-400">
                        {readinessScore === 100 ? 'Response received' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800">Key Information</h3>
                <button onClick={() => showMsg('Key information editing coming soon.')} className="text-[13px] font-semibold text-blue-600 hover:underline cursor-pointer">
                  Edit
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Listing Type</span>
                  <span className="font-medium text-slate-800">Sale</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Occupancy</span>
                  <span className="font-medium text-slate-800">Owner Occupied</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Condo Fees</span>
                  <span className="font-medium text-slate-400">—</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Possession</span>
                  <span className="font-medium text-slate-800">Flexible / 30-60 Days</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Legal Description</span>
                  <span className="font-semibold text-slate-800 font-mono text-[13px]">
                    PLAN 1234 LOT 56
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Zoning</span>
                  <span className="font-medium text-slate-800">Residential (R)</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3: Agent, Connected Systems, Next Action */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800">Agent & Publishing</h3>
                <button
                  onClick={() => {
                    setTempAgentData(agentData);
                    setIsEditAgentOpen(true);
                  }}
                  className="text-[13px] font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {agentData.initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{agentData.name}</h4>
                    <p className="text-[13px] text-slate-400">{agentData.email}</p>
                    <p className="text-[13px] text-slate-400">{agentData.phone}</p>
                  </div>
                </div>
                <button onClick={() => window.open(`mailto:${agentData.email}`, '_blank')} className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer">
                  Contact
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold text-slate-800">Connected Systems</h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 font-black text-[12px] flex items-center justify-center border border-sky-100">
                      TREB
                    </div>
                    <span className="font-semibold text-slate-800">TREB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      Not submitted
                    </span>
                    <button onClick={() => showMsg('Preparing TREB submission package...')} className="text-[13px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer">
                      Prepare
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 font-black text-[12px] flex items-center justify-center border border-indigo-100">
                      FD
                    </div>
                    <span className="font-semibold text-slate-800">FUB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      Not submitted
                    </span>
                    <button onClick={() => showMsg('Preparing FUB submission package...')} className="text-[13px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer">
                      Prepare
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Folder className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-slate-800">Google Drive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      Organized
                    </span>
                    <button onClick={() => showMsg('Opening Google Drive folder...')} className="text-[13px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer">
                      View Folder
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold text-slate-800">Website</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      Draft prepared
                    </span>
                    <button onClick={() => showMsg('Opening website draft preview...')} className="text-[13px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer">
                      View Draft
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckSquare className="w-5 h-5 text-rose-500" />
                    <span className="font-semibold text-slate-800">Asana</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      Card Created
                    </span>
                    <button onClick={() => showMsg('Opening Asana task card...')} className="text-[13px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer">
                      View Card
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-800">Next Best Action</h3>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Complete missing information</h4>
                  <p className="text-[13px] text-slate-400 mt-0.5">
                    2 items require agent input to proceed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('Missing Information')}
                className="w-full mt-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
              >
                View Missing Information →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: DOCUMENTS ===================== */}
      {activeTab === 'Documents' && (
        <div className="grid grid-cols-12 gap-5 items-start">
          {/* PANEL 1: SOURCE DOCUMENTS (Left) */}
          <div className="col-span-12 md:col-span-3 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 px-1">Source Documents</h3>
            <div className="space-y-1.5">
              {sourceDocuments.map((doc) => {
                const isSelected = selectedDocId === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => { setSelectedDocId(doc.id); setCurrentPage(1); }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-200 shadow-xs'
                        : 'bg-white border-slate-100 hover:bg-slate-50 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {doc.title}
                        </h4>
                        <span className="text-[13px] text-slate-400">
                          {doc.format} • {doc.pages} pages
                        </span>
                      </div>
                    </div>

                    <div>
                      {doc.isVerified ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const ext = file.name.split('.').pop()?.toUpperCase() ?? 'FILE';
                const newId = `doc_upload_${Date.now()}`;
                setUploadedDocs(prev => [...prev, {
                  id: newId,
                  title: file.name.replace(/\.[^/.]+$/, ''),
                  format: ext,
                  pages: 1,
                  isVerified: false,
                }]);
                setSelectedDocId(newId);
                setCurrentPage(1);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 mt-2 rounded-2xl border border-dashed border-blue-300 text-blue-600 font-semibold text-xs hover:bg-blue-50/50 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Document</span>
            </button>
          </div>

          {/* PANEL 2: INTERACTIVE DOCUMENT PREVIEW (Center) */}
          <div className="col-span-12 md:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <div className="flex items-center gap-1 font-semibold text-slate-800">
                  <span>{currentPage} / {activeDoc.pages}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 cursor-pointer" />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setZoomLevel((prev) => Math.max(50, prev - 10))}
                  className="p-1 rounded-md hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <Minus className="w-3 h-3 text-slate-500" />
                </button>
                <span className="text-[13px] font-semibold text-slate-700 w-9 text-center">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((prev) => Math.min(200, prev + 10))}
                  className="p-1 rounded-md hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-slate-500" />
                </button>
              </div>

              <div className="flex items-center gap-1 text-slate-400">
                <button onClick={() => showMsg('Full screen mode coming soon.')} className="p-1.5 rounded-lg hover:bg-slate-200/60 hover:text-slate-600 transition cursor-pointer" title="Maximize">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => showMsg('Document text search coming soon.')} className="p-1.5 rounded-lg hover:bg-slate-200/60 hover:text-slate-600 transition cursor-pointer" title="Search">
                  <Search className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `data:text/plain,${activeDoc.title}\n\nDocument preview file.`;
                    link.download = activeDoc.fileName;
                    link.click();
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 hover:text-slate-600 transition cursor-pointer"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* DYNAMIC DOCUMENT PREVIEW */}
            <div className="p-6 bg-slate-100/50 min-h-[580px] flex justify-center overflow-auto">
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className="bg-white border border-slate-200/80 shadow-md rounded-xl p-6 w-full max-w-[480px] space-y-4 text-[13px] text-slate-800 transition-transform"
              >
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    {activeDoc.title}
                  </h2>
                  <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">
                    {activeDoc.docType}
                  </span>
                </div>

                {/* Render Sections Dynamically */}
                <div className="space-y-3.5">
                  {activeDoc.sections.map((sec, idx) => (
                    <div key={idx} className="space-y-1 border-b border-slate-50 pb-2.5 last:border-b-0">
                      <h4 className="text-[12px] font-bold text-slate-900 uppercase">
                        {sec.title}
                      </h4>
                      {sec.content}
                    </div>
                  ))}
                </div>

                <div className="pt-4 text-right text-[13px] text-slate-400">
                  Page {currentPage} of {activeDoc.pages}
                </div>
              </div>
            </div>
          </div>

          

          {/* PANEL 3: EXTRACTED INFORMATION & DETAILS (Right) */}
          <div className="col-span-12 md:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex items-center border-b border-slate-100 text-xs font-semibold">
              <button
                onClick={() => setDocDetailTab('Extracted Information')}
                className={`pb-2.5 px-2 border-b-2 transition cursor-pointer ${
                  docDetailTab === 'Extracted Information'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Extracted Information
              </button>
              <button
                onClick={() => setDocDetailTab('Document Details')}
                className={`pb-2.5 px-2 border-b-2 transition cursor-pointer ${
                  docDetailTab === 'Document Details'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Document Details
              </button>
            </div>

            {docDetailTab === 'Extracted Information' ? (
              <div className="space-y-2">
                {activeDoc.extracted.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 max-w-[55%]">
                      <span className="text-[13px] text-slate-400 block leading-tight">
                        {item.field}
                      </span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {item.value}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
                          item.score >= 90
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}
                      >
                        {item.score}%
                      </span>
                      <span className="text-[13px] text-slate-400 font-medium flex items-center gap-0.5">
                        <FileText className="w-3 h-3" />
                        {item.page}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                  <span className="text-slate-400 block text-[13px]">File Name</span>
                  <span className="font-semibold text-slate-800">{activeDoc.fileName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                  <span className="text-slate-400 block text-[13px]">Upload Date</span>
                  <span className="font-semibold text-slate-800">{activeDoc.uploadDate}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                  <span className="text-slate-400 block text-[13px]">Extracted By</span>
                  <span className="font-semibold text-slate-800">Document AI Parser v2.4</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: VALIDATION ===================== */}
      {activeTab === 'Validation' && (
        <div className="flex gap-5 items-start">
          <div className="flex-1 bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Validation</h3>
              <p className="text-xs text-slate-400 mt-0.5">Review and confirm extracted information from source documents.</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-600 mr-2">
                {readinessScore === 100 ? '14 of 14' : '12 of 14'} fields confirmed
              </span>
              <div className="w-48 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${readinessScore === 100 ? 100 : 86}%` }}></div>
              </div>
              <span className="text-xs font-bold text-emerald-600">{readinessScore === 100 ? '100%' : '86%'}</span>
            </div>
          </div>

          {/* Filter tabs + Search */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              {(['All', 'Confirmed', 'Review', 'Conflict'] as const).map((f) => {
                const counts: Record<string, number> = { All: 14, Confirmed: 11, Review: 2, Conflict: 1 };
                const active = validationFilter === f;
                const dotColor = f === 'Confirmed' ? 'bg-emerald-500' : f === 'Review' ? 'bg-amber-500' : f === 'Conflict' ? 'bg-rose-500' : '';
                return (
                  <button
                    key={f}
                    onClick={() => setValidationFilter(f)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      active ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    {f !== 'All' && <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>}
                    {f} ({counts[f]})
                  </button>
                );
              })}
            </div>
            <div className="relative w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search fields..."
                value={validationSearch}
                onChange={(e) => setValidationSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#f8fafc] text-slate-400 font-medium text-[13px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Field</th>
                  <th className="py-3 px-4">AI Extracted Value</th>
                  <th className="py-3 px-4">Source Document</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reviewer Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockListingValidations
                  .filter(item => {
                    if (validationFilter !== 'All' && item.status !== validationFilter) return false;
                    if (validationSearch && !item.field.toLowerCase().includes(validationSearch.toLowerCase())) return false;
                    return true;
                  })
                  .map((item) => (
                  <tr key={item.id} className={`hover:bg-slate-50/70 transition-colors ${item.status === 'Conflict' ? 'bg-rose-50/20' : ''}`}>
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.field}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{item.extractedValue}</td>
                    <td className="py-3 px-4 text-slate-500">{item.sourceDoc}</td>
                    <td className="py-3 px-4 font-semibold">
                      <span className={item.confidence >= 90 ? 'text-emerald-600' : item.confidence >= 70 ? 'text-amber-600' : 'text-rose-600'}>
                        {item.confidence}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {(item.status === 'Confirmed' || readinessScore === 100) ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[13px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Confirmed
                        </span>
                      ) : item.status === 'Review' ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full text-[13px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Review
                        </span>
                      ) : item.status === 'Conflict' ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full text-[13px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Conflict
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full text-[13px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Missing
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {(item.status === 'Confirmed' || readinessScore === 100) && <span className="text-slate-300">—</span>}
                      {item.status === 'Review' && readinessScore < 100 && (
                        <button onClick={() => showMsg(`Reviewing field: ${item.field}`)} className="flex items-center gap-1 px-3 py-1 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-[13px] transition cursor-pointer">
                          Review <ChevronDown className="w-3 h-3" />
                        </button>
                      )}
                      {item.status === 'Conflict' && readinessScore < 100 && (
                        <button
                          onClick={() => setShowConflictPanel(true)}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] transition cursor-pointer"
                        >
                          Resolve <ChevronDown className="w-3 h-3" />
                        </button>
                      )}
                      {item.status === 'Missing' && readinessScore < 100 && (
                        <button onClick={() => showMsg(`Add data for: ${item.field}`)} className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[13px] transition cursor-pointer">
                          Add
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>

          {/* Resolve Conflict Side Panel */}
          {showConflictPanel && (
            <div className="w-80 shrink-0 bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Resolve Conflict</h3>
                <button onClick={() => setShowConflictPanel(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500">Multiple sources detected for this field. Review and select the correct value.</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Condo Fees</span>
                <span className="text-[12px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">Conflict</span>
              </div>
              <div className="space-y-2.5">
                <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-blue-500 bg-blue-50/30 cursor-pointer">
                  <input type="radio" name="conflict" defaultChecked className="mt-0.5 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">$699.00</span>
                      <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">92% confidence</span>
                    </div>
                    <p className="text-[13px] text-slate-500 mt-0.5">Source: Status Certificate (p.5)</p>
                    <p className="text-[13px] text-slate-600">Extracted: $699.00 per month</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input type="radio" name="conflict" className="mt-0.5 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">$650.00</span>
                      <span className="text-[12px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">68% confidence</span>
                    </div>
                    <p className="text-[13px] text-slate-500 mt-0.5">Source: MLS Input Form (p.1)</p>
                    <p className="text-[13px] text-slate-600">Extracted: $650.00 per month</p>
                  </div>
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Comments (optional)</label>
                <textarea
                  placeholder="Add a note about your decision..."
                  rows={3}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[12px] text-slate-400 text-right mt-0.5">0/500</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button onClick={() => setShowConflictPanel(false)} className="flex-1 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                  Cancel
                </button>
                <button onClick={() => setShowConflictPanel(false)} className="flex-1 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition cursor-pointer">
                  Confirm Value
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 4: MISSING INFORMATION ===================== */}
      {activeTab === 'Missing Information' && (
        <div className="grid grid-cols-12 gap-5 items-start">
          {/* LEFT: Missing Items */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Missing Items</h3>
              <p className="text-xs text-slate-400 mt-0.5">3 items required to complete the listing.</p>
            </div>
            <div className="space-y-2.5">
              {[
                { name: 'Condo Management Information', desc: 'Building name, management company, monthly fees' },
                { name: 'Property Measurements', desc: 'No floor plan received\nTotal square footage, room dimensions' },
                { name: 'Parking Details', desc: 'Awaiting agent\nNumber of spaces, type (owned/rented), level, spot #' },
              ].map((item) => (
                <div key={item.name} className="p-3.5 rounded-2xl border border-rose-100 bg-rose-50/30 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span className="text-xs font-bold text-slate-800 leading-tight">{item.name}</span>
                    </div>
                    <span className="text-[12px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-md shrink-0">Required</span>
                  </div>
                  <p className="text-[13px] text-slate-500 pl-6 whitespace-pre-line">{item.desc}</p>
                  <p className="text-[13px] text-amber-600 font-medium pl-6 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Awaiting agent
                  </p>
                </div>
              ))}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-600 mb-2">Optional Items</h4>
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-slate-700 leading-tight">Amenities List</span>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-md shrink-0">Optional</span>
                </div>
                <p className="text-[13px] text-slate-500 pl-6">Building amenities (gym, pool, concierge, etc.)</p>
                <p className="text-[13px] text-slate-400 pl-6">Not provided</p>
              </div>
            </div>
          </div>

          {/* CENTER: Email Composer */}
          <div className="col-span-12 lg:col-span-6 bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Send Email to Agent</h3>
              <p className="text-xs text-slate-400 mt-0.5">A draft email has been prepared with the missing information.</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs border-b border-slate-100 pb-3">
                <span className="text-slate-400 w-12 shrink-0">To</span>
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  {emailRecipient && (
                    <span className="flex items-center gap-1 bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-lg">
                      {agentData.email}
                      <button onClick={() => setEmailRecipient(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                </div>
                <button onClick={() => setShowCcField(v => !v)} className="text-blue-600 font-medium text-[13px] shrink-0 cursor-pointer">Cc</button>
              </div>
              {showCcField && (
                <div className="flex items-center gap-3 text-xs border-b border-slate-100 pb-3">
                  <span className="text-slate-400 w-12 shrink-0">Cc</span>
                  <input type="email" placeholder="Add CC recipient..." className="flex-1 text-xs text-slate-800 focus:outline-none bg-transparent placeholder-slate-400" />
                </div>
              )}
              <div className="flex items-center gap-3 text-xs border-b border-slate-100 pb-3">
                <span className="text-slate-400 w-12 shrink-0">Subject</span>
                <input
                  type="text"
                  defaultValue="Action Required: 123 Main Street – Missing Information"
                  className="flex-1 text-xs text-slate-800 font-medium focus:outline-none bg-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-1 border-b border-slate-100 pb-3">
              {['B', 'I', 'U'].map((fmt) => (
                <button key={fmt} className="w-6 h-6 rounded text-[13px] font-medium text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer">{fmt}</button>
              ))}
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button className="w-6 h-6 rounded text-[13px] text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer">≡</button>
              <button className="w-6 h-6 rounded text-[13px] text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer">1.</button>
              <button className="w-6 h-6 rounded text-[13px] text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer">🔗</button>
              <button className="w-6 h-6 rounded text-[13px] text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer">📎</button>
              <button className="w-6 h-6 rounded text-[13px] text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer">···</button>
            </div>
            <textarea
              rows={10}
              defaultValue={`Hi John,\n\nWe're almost ready to publish 123 Main Street, but we're missing a few items to complete the listing. Could you please provide the following when you have a moment?\n\n1. Condo Management Information\n   - Building name and management company\n   - Monthly fees (if available)\n\n2. Property Measurements\n   - Total square footage and room dimensions (if available)\n\n3. Parking Details\n   - Number of spaces, type (owned/rented), level and spot number\n\nThank you!\nMaría`}
              className="w-full text-xs text-slate-700 leading-relaxed resize-none focus:outline-none bg-transparent border-0 p-0"
            />
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button onClick={() => showMsg('Attach documents functionality coming soon.')} className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-700 cursor-pointer">
                <span>📎</span>
                <span>Attach relevant documents (optional)</span>
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => showMsg('Email preview coming soon.')} className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer">Preview</button>
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      window.open(`mailto:${agentData.email}?subject=Action Required: Missing Information – ${listing.address}`, '_blank');
                      showMsg('Opening email client...');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-l-xl transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </button>
                  <button onClick={() => showMsg('Select send options...')} className="px-2 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-r-xl border-l border-blue-500 transition cursor-pointer">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Request History */}
          <div className="col-span-12 lg:col-span-3 bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Request History</h3>
            <div className="space-y-4 text-xs">
              <div className="relative pl-5 border-l-2 border-slate-200 space-y-1">
                <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-blue-600"></span>
                <span className="font-bold text-slate-800 block">Missing info email draft created</span>
                <span className="text-[13px] text-slate-400 block">Sep 24, 2024 10:15 AM</span>
                <span className="text-[13px] text-slate-500">By María López</span>
              </div>
              <div className="relative pl-5 border-l-2 border-slate-200 space-y-1">
                <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="font-bold text-slate-800 block">Missing info email sent</span>
                <span className="text-[13px] text-slate-400 block">Sep 24, 2024 10:18 AM</span>
                <span className="text-[13px] text-slate-500">By María López</span>
              </div>
              <div className="relative pl-5 border-l-2 border-slate-200 space-y-1">
                <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-bold text-slate-800 block">Agent replied</span>
                <span className="text-[13px] text-slate-400 block">Sep 24, 2024 2:32 PM</span>
                <span className="text-[13px] text-slate-500">2 of 3 items provided</span>
              </div>
              <div className="relative pl-5 border-l-2 border-slate-200 space-y-1">
                <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="font-bold text-slate-800 block">Follow up reminder set</span>
                <span className="text-[13px] text-slate-400 block">Sep 25, 2024 9:00 AM</span>
                <span className="text-[13px] text-slate-500">Automatic reminder</span>
              </div>
              <div className="relative pl-5 border-l-2 border-slate-200 space-y-1">
                <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-slate-400"></span>
                <span className="font-bold text-slate-700 block">Pending response</span>
                <span className="text-[13px] text-slate-400 block">Awaiting agent</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 space-y-2">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-800">Need to follow up later?</p>
                  <p className="text-[13px] text-blue-600">Set a reminder and we'll notify you.</p>
                </div>
              </div>
              <button onClick={() => showMsg('Reminder set for tomorrow at 9:00 AM.')} className="w-full flex items-center justify-center gap-1.5 py-2 text-[13px] font-semibold text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition cursor-pointer">
                <span>📅</span>
                <span>Set Reminder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 5: ACTIVITY ===================== */}
      {activeTab === 'Activity' && (
        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-slate-900">Activity Timeline</h3>
              <div className="text-xs text-slate-500">
                Show: <span className="font-bold text-blue-600 cursor-pointer">All Activity</span>
              </div>
            </div>

            <div className="space-y-4">
              {mockListingActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    {act.type === 'approved' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : act.type === 'completed' ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800">{act.title}</h4>
                      <span className="text-[13px] text-slate-400">
                        {act.date} {act.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{act.description}</p>
                    <span className="text-[13px] text-slate-400 font-medium">By {act.user}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Next Steps</h3>
              <p className="text-[13px] text-slate-400">Prepare for submission</p>

              <div className="space-y-2.5 text-xs text-slate-700">
                {[
                  { label: 'Review listing details', done: true },
                  { label: 'Confirm TREB payload', done: true },
                  { label: 'Submit to TREB', done: false },
                  { label: 'Confirm TREB live', done: false },
                  { label: 'Submit to FUB', done: false },
                  { label: 'Confirm FUB live', done: false },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      defaultChecked={step.done}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span className={step.done ? 'font-medium text-slate-800' : 'text-slate-500'}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">System Updates</h3>
              <div className="space-y-3">
                {[
                  { label: 'TREB', sub: 'Not submitted', iconBg: 'bg-sky-50', iconText: 'text-sky-600', iconBorder: 'border-sky-100', abbr: 'TREB', action: 'Prepare' },
                  { label: 'FUB', sub: 'Not submitted', iconBg: 'bg-indigo-50', iconText: 'text-indigo-600', iconBorder: 'border-indigo-100', abbr: 'FD', action: 'Prepare' },
                  { label: 'Google Drive', sub: 'Organized', iconBg: 'bg-amber-50', iconText: 'text-amber-500', iconBorder: 'border-amber-100', abbr: null, action: 'View Folder', isFolder: true },
                  { label: 'Website', sub: 'Draft prepared', iconBg: 'bg-blue-50', iconText: 'text-blue-500', iconBorder: 'border-blue-100', abbr: null, action: 'View Draft', isGlobe: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${item.iconBg} ${item.iconText} font-black text-[12px] flex items-center justify-center border ${item.iconBorder}`}>
                        {item.isFolder ? <Folder className="w-3.5 h-3.5" /> : item.isGlobe ? <Globe className="w-3.5 h-3.5" /> : item.abbr}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{item.label}</span>
                        <span className="text-[12px] text-slate-400">{item.sub}</span>
                      </div>
                    </div>
                    <button onClick={() => showMsg(`Opening ${item.label}...`)} className="px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer">
                      {item.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Activity Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Documents Received', value: '9 / 12', color: 'text-blue-600' },
                  { label: 'Fields Validated', value: '11 / 14', color: 'text-emerald-600' },
                  { label: 'Open Requests', value: '3', color: 'text-amber-600' },
                  { label: 'Days Until Live', value: '4', color: 'text-rose-600' },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-1">
                    <p className={`text-base font-extrabold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[13px] text-slate-500 leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Agent Modal Drawer */}
      {isEditAgentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Edit Assigned Agent</h3>
              </div>
              <button
                onClick={() => setIsEditAgentOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAgent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Agent Full Name</label>
                <input
                  type="text"
                  required
                  value={tempAgentData.name}
                  onChange={(e) => setTempAgentData({ ...tempAgentData, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={tempAgentData.email}
                  onChange={(e) => setTempAgentData({ ...tempAgentData, email: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={tempAgentData.phone}
                  onChange={(e) => setTempAgentData({ ...tempAgentData, phone: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditAgentOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Update Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom-Right Info Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[51] flex items-center gap-2.5 bg-slate-800 text-white text-xs font-medium px-4 py-3 rounded-2xl shadow-xl max-w-xs animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top-Right Success Toast */}
      {showApprovalToast && (
        <div className="fixed top-6 right-6 z-50 flex items-start gap-3 bg-emerald-50/95 border border-emerald-200/90 rounded-2xl px-4 py-3 shadow-xl text-xs max-w-sm animate-in fade-in slide-in-from-top-2">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-3 h-3 stroke-[2.5]" />
          </div>
          <div className="flex-1 pr-1">
            <span className="font-bold text-slate-900 block">Listing approved!</span>
            <span className="text-[13px] text-slate-500 block mt-0.5">
              All connected systems are being updated.
            </span>
          </div>
          <button
            onClick={() => setShowApprovalToast(false)}
            className="text-slate-400 hover:text-slate-600 p-0.5 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 p-5 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="pr-4">
                <h3 className="text-sm font-bold text-slate-900">Approve Listing?</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  This will publish the listing and update all connected systems (TREB, FUB, Asana,
                  Google Drive and Website).
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl border border-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveAction}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer"
              >
                Approve Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
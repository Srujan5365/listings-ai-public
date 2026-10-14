import React, { useState, useRef } from 'react';
import { Search, Upload, MoreHorizontal, FileText, X } from 'lucide-react';

type DocsTab = 'all' | 'pending' | 'received' | 'processed' | 'missing';

interface DocRow {
  id: string;
  address: string;
  mls: string;
  image: string;
  docType: string;
  fileName: string | null;
  requestedOn: string | null;
  dateReceived: string | null;
  dateProcessed: string | null;
  status: 'Received' | 'Missing' | 'Processed';
  fileSize?: string;
  uploadedBy?: string;
}

const images = [
  'photo-1568605117036',
  'photo-1570129477492',
  'photo-1576941089067',
  'photo-1580587771525',
  'photo-1598228723793',
  'photo-1512917774080',
  'photo-1600596542815',
  'photo-1600585154340',
].map((id) => `https://images.unsplash.com/${id}?w=80&auto=format&fit=crop&q=80`);

const allDocs: DocRow[] = [
  { id: 'd1', address: '123 Main Street', mls: 'X1234567', image: images[0], docType: 'Listing Agreement', fileName: 'Listing_Agreement.pdf', requestedOn: null, dateReceived: 'Sep 25, 2024', dateProcessed: 'Sep 25, 2024', status: 'Received', fileSize: '2.4 MB', uploadedBy: 'John Smith (Agent)' },
  { id: 'd2', address: '456 Oak Avenue', mls: 'X1234568', image: images[1], docType: 'Property Survey', fileName: 'Survey.pdf', requestedOn: null, dateReceived: 'Sep 26, 2024', dateProcessed: 'Sep 26, 2024', status: 'Received', fileSize: '1.8 MB', uploadedBy: 'Sarah Lee (Agent)' },
  { id: 'd3', address: '789 Pine Road', mls: 'X1234569', image: images[2], docType: 'Floor Plans', fileName: 'FloorPlans.pdf', requestedOn: null, dateReceived: 'Sep 26, 2024', dateProcessed: 'Sep 26, 2024', status: 'Received', fileSize: '3.1 MB', uploadedBy: 'Michael Chen (Agent)' },
  { id: 'd4', address: '321 Maple Drive', mls: 'X1234570', image: images[3], docType: 'Property Tax Bill', fileName: null, requestedOn: 'Sep 25, 2024', dateReceived: null, dateProcessed: null, status: 'Missing' },
  { id: 'd5', address: '654 Birch Lane', mls: 'X1234571', image: images[4], docType: 'Condo Management Info', fileName: null, requestedOn: 'Sep 25, 2024', dateReceived: null, dateProcessed: null, status: 'Missing' },
  { id: 'd6', address: '987 Cedar Court', mls: 'X1234572', image: images[5], docType: 'MLS Input Form', fileName: 'MLS_Input_Form.pdf', requestedOn: null, dateReceived: 'Sep 24, 2024', dateProcessed: 'Sep 24, 2024', status: 'Received', fileSize: '0.9 MB', uploadedBy: 'System' },
  { id: 'd7', address: '159 Elm Street', mls: 'X1234573', image: images[6], docType: 'Photos', fileName: 'Photos.zip', requestedOn: null, dateReceived: 'Sep 24, 2024', dateProcessed: 'Sep 24, 2024', status: 'Received', fileSize: '18.4 MB', uploadedBy: 'John Smith (Agent)' },
  { id: 'd8', address: '258 King Street', mls: 'X1234574', image: images[7], docType: 'Condo Status Certificate', fileName: null, requestedOn: 'Sep 24, 2024', dateReceived: null, dateProcessed: null, status: 'Missing' },
];

const receivedDocs = allDocs.filter((d) => d.status === 'Received');
const missingDocs = allDocs.filter((d) => d.status === 'Missing');
const processedDocs = receivedDocs.map((d) => ({ ...d, status: 'Processed' as const }));

const tabs: { key: DocsTab; label: string; count?: number }[] = [
  { key: 'all', label: 'All Documents' },
  { key: 'pending', label: 'Pending', count: 5 },
  { key: 'received', label: 'Received' },
  { key: 'processed', label: 'Processed' },
  { key: 'missing', label: 'Missing', count: 3 },
];

function StatusBadge({ status }: { status: 'Received' | 'Missing' | 'Processed' }) {
  if (status === 'Received') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-800">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        Received
      </span>
    );
  }
  if (status === 'Processed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
        Processed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-800">
      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
      Missing
    </span>
  );
}

function AddressCell({ doc }: { doc: DocRow }) {
  return (
    <div className="flex items-center gap-3">
      <img src={doc.image} alt={doc.address} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
      <div>
        <div className="font-bold text-slate-900">{doc.address}</div>
        <div className="text-[13px] text-slate-400">{doc.mls}</div>
      </div>
    </div>
  );
}

function FiltersRow({ showStatus = false, search, onSearch, onClear }: {
  showStatus?: boolean;
  search: string;
  onSearch: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search documents..."
          className="pl-8 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
        />
      </div>
      <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
        <option>All listings</option>
      </select>
      <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
        <option>All document types</option>
      </select>
      {showStatus && (
        <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option>All statuses</option>
        </select>
      )}
      <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
        <option>All dates</option>
      </select>
      {search && (
        <button onClick={onClear} className="text-xs text-blue-600 font-medium hover:text-blue-700 transition">
          Clear Filters
        </button>
      )}
    </div>
  );
}

function DocumentDetailPanel({ doc, onClose }: { doc: DocRow; onClose: () => void }) {
  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-slate-100 z-40 flex flex-col">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Document Detail</h3>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 leading-tight">{doc.fileName || '—'}</p>
              <p className="text-[13px] text-slate-400 mt-0.5">
                {doc.dateReceived ? `Uploaded on ${doc.dateReceived}` : 'Not yet received'}
              </p>
            </div>
          </div>
          <StatusBadge status={doc.status} />
        </div>

        <div className="space-y-1">
          <p className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide">Listing Address</p>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <img src={doc.image} alt={doc.address} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900">{doc.address}</p>
              <p className="text-[13px] text-slate-400">MLS # {doc.mls}</p>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide">Document Type</p>
          <p className="text-xs font-medium text-slate-800">{doc.docType}</p>
        </div>

        <div className="space-y-2">
          <p className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide">File Information</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">File Name</span>
              <span className="font-medium text-slate-800">{doc.fileName || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">File Size</span>
              <span className="font-medium text-slate-800">{doc.fileSize || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Uploaded By</span>
              <span className="font-medium text-slate-800">{doc.uploadedBy || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <button className="flex-1 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer">
            Open
          </button>
          <button className="flex-1 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer">
            Download
          </button>
          <button className="flex-1 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer whitespace-nowrap">
            View in Folder
          </button>
          <button className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
            <MoreHorizontal className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

export const DocumentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DocsTab>('all');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docSearch, setDocSearch] = useState('');
  const [requestToast, setRequestToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedDoc = allDocs.find((d) => d.id === selectedDocId) ?? null;

  const toggleDoc = (id: string) => {
    setSelectedDocId((prev) => (prev === id ? null : id));
  };

  const showRequestToast = (docType: string) => {
    setRequestToast(`Request sent for "${docType}"`);
    setTimeout(() => setRequestToast(''), 3500);
  };

  const filteredDocs = docSearch
    ? allDocs.filter((d) =>
        d.address.toLowerCase().includes(docSearch.toLowerCase()) ||
        d.docType.toLowerCase().includes(docSearch.toLowerCase()) ||
        (d.fileName ?? '').toLowerCase().includes(docSearch.toLowerCase())
      )
    : allDocs;

  const filteredReceived = filteredDocs.filter((d) => d.status === 'Received');
  const filteredMissing = filteredDocs.filter((d) => d.status === 'Missing');
  const filteredProcessed = filteredReceived.map((d) => ({ ...d, status: 'Processed' as const }));

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      {requestToast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          {requestToast}
        </div>
      )}
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.zip" className="hidden" />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Documents</h1>
          <p className="text-xs text-slate-500 mt-1">Manage all listing documents.</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer">
          <Upload className="w-3.5 h-3.5" />
          Upload Documents
        </button>
      </div>

      <div className="flex items-center gap-6 border-b border-slate-200/80 text-xs font-semibold text-slate-400">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 border-b-2 transition -mb-px cursor-pointer flex items-center gap-1 ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-700'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="bg-slate-100 text-slate-600 text-[12px] px-1.5 py-0.5 rounded-full ml-0.5">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'all' && (
        <div className="space-y-4">
          <FiltersRow showStatus search={docSearch} onSearch={setDocSearch} onClear={() => setDocSearch('')} />
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#f8fafc] text-slate-400 font-medium text-[13px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 w-10"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer" /></th>
                  <th className="py-3 px-3">Listing Address</th>
                  <th className="py-3 px-3">Document Type</th>
                  <th className="py-3 px-3">File Name</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Date Received</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className={`hover:bg-slate-50/70 transition-colors ${selectedDocId === doc.id ? 'bg-blue-50/20' : ''}`}>
                    <td className="py-3.5 px-4"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer" /></td>
                    <td className="py-3.5 px-3"><AddressCell doc={doc} /></td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">{doc.docType}</td>
                    <td className="py-3.5 px-3 text-slate-500 font-mono text-[13px]">{doc.fileName || '—'}</td>
                    <td className="py-3.5 px-3"><StatusBadge status={doc.status} /></td>
                    <td className="py-3.5 px-3 text-slate-500">{doc.dateReceived || '—'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button onClick={() => toggleDoc(doc.id)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition cursor-pointer">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(activeTab === 'pending' || activeTab === 'missing') && (
        <div className="space-y-4">
          <FiltersRow search={docSearch} onSearch={setDocSearch} onClear={() => setDocSearch('')} />
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#f8fafc] text-slate-400 font-medium text-[13px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 w-10"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer" /></th>
                  <th className="py-3 px-3">Listing Address</th>
                  <th className="py-3 px-3">Document Type</th>
                  <th className="py-3 px-3">File Name</th>
                  <th className="py-3 px-3">Requested On</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMissing.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer" /></td>
                    <td className="py-3.5 px-3"><AddressCell doc={doc} /></td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">{doc.docType}</td>
                    <td className="py-3.5 px-3 text-slate-400">—</td>
                    <td className="py-3.5 px-3 text-slate-500">{doc.requestedOn || '—'}</td>
                    <td className="py-3.5 px-3"><StatusBadge status={doc.status} /></td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => showRequestToast(doc.docType)}
                        className="text-xs text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition cursor-pointer font-medium">
                        Request
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'received' && (
        <div className="space-y-4">
          <FiltersRow search={docSearch} onSearch={setDocSearch} onClear={() => setDocSearch('')} />
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#f8fafc] text-slate-400 font-medium text-[13px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 w-10"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer" /></th>
                  <th className="py-3 px-3">Listing Address</th>
                  <th className="py-3 px-3">Document Type</th>
                  <th className="py-3 px-3">File Name</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Date Received</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceived.map((doc) => (
                  <tr key={doc.id} className={`hover:bg-slate-50/70 transition-colors ${selectedDocId === doc.id ? 'bg-blue-50/20' : ''}`}>
                    <td className="py-3.5 px-4"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer" /></td>
                    <td className="py-3.5 px-3"><AddressCell doc={doc} /></td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">{doc.docType}</td>
                    <td className="py-3.5 px-3 text-slate-500 font-mono text-[13px]">{doc.fileName}</td>
                    <td className="py-3.5 px-3"><StatusBadge status={doc.status} /></td>
                    <td className="py-3.5 px-3 text-slate-500">{doc.dateReceived}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button onClick={() => toggleDoc(doc.id)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition cursor-pointer">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'processed' && (
        <div className="space-y-4">
          <FiltersRow search={docSearch} onSearch={setDocSearch} onClear={() => setDocSearch('')} />
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#f8fafc] text-slate-400 font-medium text-[13px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 w-10"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer" /></th>
                  <th className="py-3 px-3">Listing Address</th>
                  <th className="py-3 px-3">Document Type</th>
                  <th className="py-3 px-3">File Name</th>
                  <th className="py-3 px-3">Date Processed</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProcessed.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer" /></td>
                    <td className="py-3.5 px-3"><AddressCell doc={doc} /></td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">{doc.docType}</td>
                    <td className="py-3.5 px-3 text-slate-500 font-mono text-[13px]">{doc.fileName}</td>
                    <td className="py-3.5 px-3 text-slate-500">{doc.dateProcessed}</td>
                    <td className="py-3.5 px-3"><StatusBadge status={doc.status} /></td>
                    <td className="py-3.5 px-4 text-right">
                      <button onClick={() => toggleDoc(doc.id)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition cursor-pointer">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedDoc && (
        <DocumentDetailPanel doc={selectedDoc} onClose={() => setSelectedDocId(null)} />
      )}
    </div>
  );
};

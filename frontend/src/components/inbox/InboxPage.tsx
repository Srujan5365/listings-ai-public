import React, { useState } from 'react';
import { Search, CheckCheck, MoreHorizontal } from 'lucide-react';

type InboxTab = 'all' | 'agent' | 'system' | 'comments';

interface InboxMessage {
  id: string;
  initials: string;
  bgColor: string;
  from: string;
  subject: string;
  preview: string;
  address: string;
  mls: string;
  type: 'Agent Request' | 'System';
  date: string;
  unread: boolean;
}

interface CommentMessage {
  id: string;
  initials: string;
  bgColor: string;
  from: string;
  comment: string;
  address: string;
  mls: string;
  date: string;
}

const allMessages: InboxMessage[] = [
  { id: 'm1', initials: 'JS', bgColor: 'bg-slate-500', from: 'John Smith (Agent)', subject: 'Missing floor plan', preview: 'Hi, please find attached the updated floor plan…', address: '123 Main Street', mls: 'X1234567', type: 'Agent Request', date: 'Sep 26, 2024 10:14 AM', unread: true },
  { id: 'm2', initials: 'RE', bgColor: 'bg-slate-400', from: 'RE/MAX Support', subject: 'Document format issue', preview: 'The floor plan is unreadable. Please upload a clea…', address: '456 Oak Avenue', mls: 'X1234568', type: 'System', date: 'Sep 26, 2024 9:02 AM', unread: true },
  { id: 'm3', initials: 'MK', bgColor: 'bg-indigo-600', from: 'Michael Kim (Agent)', subject: 'Additional photos', preview: 'Please add 2 additional exterior photos.', address: '789 Pine Road', mls: 'X1234569', type: 'Agent Request', date: 'Sep 25, 2024 4:36 PM', unread: true },
  { id: 'm4', initials: 'SY', bgColor: 'bg-slate-400', from: 'System', subject: 'Validation completed', preview: 'All required fields validated (87% confidence).', address: '321 Maple Drive', mls: 'X1234570', type: 'System', date: 'Sep 25, 2024 2:15 PM', unread: true },
  { id: 'm5', initials: 'JS', bgColor: 'bg-slate-500', from: 'John Smith (Agent)', subject: 'Legal description', preview: 'Please find the legal description document.', address: '654 Birch Lane', mls: 'X1234571', type: 'Agent Request', date: 'Sep 24, 2024 11:08 AM', unread: true },
  { id: 'm6', initials: 'SY', bgColor: 'bg-slate-400', from: 'System', subject: 'Listing created', preview: 'Listing intake initiated from agent email.', address: '159 Elm Street', mls: 'X1234572', type: 'System', date: 'Sep 24, 2024 10:15 AM', unread: false },
];

const comments: CommentMessage[] = [
  { id: 'c1', initials: 'RT', bgColor: 'bg-slate-500', from: 'Robert Taylor (Team)', comment: 'Looks good. Once we receive the updated floor plan we can move this to review.', address: '123 Main Street', mls: 'X1234567', date: 'Sep 24, 2024 3:22 PM' },
];

const tabs: { key: InboxTab; label: string; count: number }[] = [
  { key: 'all', label: 'All', count: 6 },
  { key: 'agent', label: 'Agent Requests', count: 3 },
  { key: 'system', label: 'System Notifications', count: 2 },
  { key: 'comments', label: 'Comments', count: 1 },
];

function TypeBadge({ type }: { type: 'Agent Request' | 'System' }) {
  if (type === 'Agent Request') {
    return (
      <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[12px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap">
        Agent Request
      </span>
    );
  }
  return (
    <span className="bg-slate-100 text-slate-600 text-[12px] font-semibold px-2 py-0.5 rounded-md">
      System
    </span>
  );
}

function MessageTable({ messages, showSenderFilter = true, showTypeFilter = false, onMarkAllRead }: {
  messages: InboxMessage[];
  showSenderFilter?: boolean;
  showTypeFilter?: boolean;
  onMarkAllRead: () => void;
}) {
  const [search, setSearch] = useState('');
  const displayed = search
    ? messages.filter((m) =>
        m.from.toLowerCase().includes(search.toLowerCase()) ||
        m.subject.toLowerCase().includes(search.toLowerCase()) ||
        m.address.toLowerCase().includes(search.toLowerCase())
      )
    : messages;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="pl-8 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
          />
        </div>
        <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option>All listings</option>
        </select>
        {showSenderFilter && (
          <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option>All senders</option>
          </select>
        )}
        {showTypeFilter && (
          <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option>All types</option>
          </select>
        )}
        <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option>All dates</option>
        </select>
        <button onClick={onMarkAllRead} className="ml-auto flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-700 transition">
          <CheckCheck className="w-3.5 h-3.5" />
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-[#f8fafc] text-slate-400 font-medium text-[13px] border-b border-slate-100">
            <tr>
              <th className="py-3 px-4 w-10">
                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer" />
              </th>
              <th className="py-3 px-2 w-6"></th>
              <th className="py-3 px-3">From</th>
              <th className="py-3 px-3">Subject</th>
              <th className="py-3 px-3">Related Listing</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-4 text-right">•••</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayed.map((msg) => (
              <tr key={msg.id} className={`hover:bg-slate-50/70 transition-colors ${msg.unread ? 'bg-white' : 'bg-slate-50/30'}`}>
                <td className="py-3.5 px-4">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer" />
                </td>
                <td className="py-3.5 px-2">
                  {msg.unread && <span className="w-2 h-2 rounded-full bg-blue-600 block"></span>}
                </td>
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full ${msg.bgColor} text-white text-[12px] font-bold flex items-center justify-center shrink-0`}>
                      {msg.initials}
                    </div>
                    <span className={`${msg.unread ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'} whitespace-nowrap`}>
                      {msg.from}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-3 max-w-[200px]">
                  <div className={`${msg.unread ? 'font-semibold text-slate-800' : 'font-medium text-slate-700'} truncate`}>{msg.subject}</div>
                  <div className="text-[13px] text-slate-400 truncate">{msg.preview}</div>
                </td>
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <div className="font-medium text-slate-800">{msg.address}</div>
                  <div className="text-[13px] text-slate-400">{msg.mls}</div>
                </td>
                <td className="py-3.5 px-3">
                  <TypeBadge type={msg.type} />
                </td>
                <td className="py-3.5 px-3 text-[13px] text-slate-400 whitespace-nowrap">{msg.date}</td>
                <td className="py-3.5 px-4 text-right">
                  <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CommentsTable() {
  const [search, setSearch] = useState('');
  const displayed = search
    ? comments.filter((c) =>
        c.from.toLowerCase().includes(search.toLowerCase()) ||
        c.comment.toLowerCase().includes(search.toLowerCase()) ||
        c.address.toLowerCase().includes(search.toLowerCase())
      )
    : comments;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comments..."
            className="pl-8 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
          />
        </div>
        <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option>All listings</option>
        </select>
        <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option>All users</option>
        </select>
        <div className="ml-auto" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-[#f8fafc] text-slate-400 font-medium text-[13px] border-b border-slate-100">
            <tr>
              <th className="py-3 px-4 w-10">
                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer" />
              </th>
              <th className="py-3 px-3">From</th>
              <th className="py-3 px-3">Comment</th>
              <th className="py-3 px-3">Related Listing</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-4 text-right">•••</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayed.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer" />
                </td>
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full ${c.bgColor} text-white text-[12px] font-bold flex items-center justify-center shrink-0`}>
                      {c.initials}
                    </div>
                    <span className="font-semibold text-slate-800 whitespace-nowrap">{c.from}</span>
                  </div>
                </td>
                <td className="py-3.5 px-3 max-w-[320px]">
                  <span className="text-slate-700">{c.comment}</span>
                </td>
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <div className="font-medium text-slate-800">{c.address}</div>
                  <div className="text-[13px] text-slate-400">{c.mls}</div>
                </td>
                <td className="py-3.5 px-3 text-[13px] text-slate-400 whitespace-nowrap">{c.date}</td>
                <td className="py-3.5 px-4 text-right">
                  <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const InboxPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InboxTab>('all');
  const [messages, setMessages] = useState<InboxMessage[]>(allMessages);

  const agentMessages = messages.filter((m) => m.type === 'Agent Request');
  const systemMessages = messages.filter((m) => m.type === 'System');

  const handleMarkAllRead = () => {
    setMessages((prev) => prev.map((m) => ({ ...m, unread: false })));
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inbox</h1>
        <p className="text-xs text-slate-500 mt-1">Messages and requests related to your listings.</p>
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
            <span className="bg-slate-100 text-slate-600 text-[12px] px-1.5 py-0.5 rounded-full ml-0.5">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'all' && <MessageTable messages={messages} showSenderFilter showTypeFilter onMarkAllRead={handleMarkAllRead} />}
      {activeTab === 'agent' && <MessageTable messages={agentMessages} showSenderFilter={false} onMarkAllRead={handleMarkAllRead} />}
      {activeTab === 'system' && <MessageTable messages={systemMessages} showSenderFilter={false} onMarkAllRead={handleMarkAllRead} />}
      {activeTab === 'comments' && <CommentsTable />}
    </div>
  );
};

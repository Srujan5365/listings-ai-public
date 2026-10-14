import React, { useState, useMemo, useEffect } from 'react';
import { 
  Folder, 
  Globe, 
  CheckSquare, 
  MoreHorizontal, 
  Plus, 
  Search, 
  X, 
  CheckCircle2, 
  Lock, 
  ChevronDown,
  Calendar
} from 'lucide-react';
import {
  mockIntegrations,
  mockDocumentTypes,
  mockValidationRules,
} from '../../data/mockData';
import type {
  DocumentTypeSetting,
  ValidationRuleSetting
} from '../../types/index';
import { listUsers, createUser, type AppUser } from '../../api/users';
import type { AuthUser } from '../../api/auth';

const ROLE_DISPLAY: Record<string, string> = {
  listings_coordinator: 'Listings Coordinator',
  team_lead: 'Team Lead',
  reviewer: 'Reviewer',
  admin: 'Admin',
};

const ROLE_OPTIONS = [
  { label: 'Listings Coordinator', value: 'listings_coordinator' },
  { label: 'Team Lead', value: 'team_lead' },
  { label: 'Reviewer', value: 'reviewer' },
  { label: 'Admin', value: 'admin' },
];

function formatRole(role: string | null) {
  return role ? (ROLE_DISPLAY[role] ?? role) : 'No Role';
}

function userInitials(name: string) {
  return name.split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || 'US';
}

const AVATAR_COLORS = ['bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-500', 'bg-rose-600'];
function avatarColor(user: AppUser) {
  const hash = (user.full_name + user.email).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface SettingsPageProps {
  currentUser?: AuthUser | null;
}

export const SettingsPage: React.FC<SettingsPageProps> = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    'General' | 'Integrations' | 'Notifications' | 'Document Types' | 'Validation Rules' | 'User Access'
  >('General');

  // General Settings State
  const [defaultView, setDefaultView] = useState('Listings Queue');
  const [itemsPerPage, setItemsPerPage] = useState('25');
  const [dateFormat, setDateFormat] = useState(
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())
  );
  const [timezone, setTimezone] = useState('(GMT-03:00) Buenos Aires');
  const [showPropertyImages, setShowPropertyImages] = useState(true);
  const [autoRefreshData, setAutoRefreshData] = useState(true);
  const [enableSound, setEnableSound] = useState(false);

  // Notifications Toggles
const [emailNotifications, setEmailNotifications] = useState({
  newAgentRequests: true,
  missingInfoUpdates: true,
  docProcessingComplete: true,
  listingReadyForReview: true,
  statusChanges: true,
  systemAlerts: false,
});
  const [inAppNotifications, setInAppNotifications] = useState({
    showInApp: true,
    playSound: false,
    showDesktop: true,
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    title: 'Changes saved!',
    description: 'Your preferences have been updated.',
  });

  const triggerToast = (title: string, description: string) => {
    setToastMessage({ title, description });
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3500);
  };


  // General settings save handler
  const handleSaveChanges = () => {
    triggerToast('Changes saved!', 'Your preferences have been updated.');
  };

  // Document types state (initialized with mock data)
  const [documentTypesList, setDocumentTypesList] = useState<DocumentTypeSetting[]>(mockDocumentTypes);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);

  const [newDocForm, setNewDocForm] = useState({
    name: '',
    required: 'Yes' as 'Yes' | 'No' | 'Conditional',
    appliesTo: 'All Listings',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const handleCreateDocType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocForm.name.trim()) return;

    const newDoc: DocumentTypeSetting = {
      id: `dt_${Date.now()}`,
      name: newDocForm.name.trim(),
      required: newDocForm.required,
      appliesTo: newDocForm.appliesTo,
      status: newDocForm.status,
    };

    setDocumentTypesList((prev) => [newDoc, ...prev]);
    setIsAddDocModalOpen(false);
    setNewDocForm({
      name: '',
      required: 'Yes',
      appliesTo: 'All Listings',
      status: 'Active',
    });
    triggerToast('Document type created!', `"${newDoc.name}" has been added to required documents.`);
  };

  // Document Types search & filter states
  const [docSearch, setDocSearch] = useState('');
  const [docStatusFilter, setDocStatusFilter] = useState('All statuses');

  // Computed list filtered by query and status
  const filteredDocumentTypes = useMemo(() => {
  return documentTypesList.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(docSearch.toLowerCase().trim());

    const matchesStatus =
      docStatusFilter === 'All statuses' || doc.status === docStatusFilter;

    return matchesSearch && matchesStatus;
  });
}, [documentTypesList, docSearch, docStatusFilter]);

  // Validation rules list state initialized with mock data
  const [rulesList, setRulesList] = useState<ValidationRuleSetting[]>(mockValidationRules);
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);

  const [newRuleForm, setNewRuleForm] = useState({
    field: '',
    rule: '',
    severity: 'Medium' as 'High' | 'Medium' | 'Low',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleForm.field.trim() || !newRuleForm.rule.trim()) return;

    const newRule: ValidationRuleSetting = {
      id: `vr_${Date.now()}`,
      field: newRuleForm.field.trim(),
      rule: newRuleForm.rule.trim(),
      severity: newRuleForm.severity,
      status: newRuleForm.status,
    };

    setRulesList((prev) => [newRule, ...prev]);
    setIsAddRuleModalOpen(false);
    setNewRuleForm({
      field: '',
      rule: '',
      severity: 'Medium',
      status: 'Active',
    });
    triggerToast('Rule created!', `Rule for "${newRule.field}" has been registered.`);
  };

  // User Management State
  const [userList, setUserList] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All roles');
  const [userStatusFilter, setUserStatusFilter] = useState('All statuses');

  useEffect(() => {
    setUsersLoading(true);
    setUsersError('');
    listUsers()
      .then((res) => setUserList(res.items))
      .catch(() => setUsersError('Failed to load users. Please refresh.'))
      .finally(() => setUsersLoading(false));
  }, []);

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'Email' | 'In-App'>('Email');
  const [createUserError, setCreateUserError] = useState('');

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'listings_coordinator',
    password: '',
  });

  // Validation Rules filter states
  const [ruleSearch, setRuleSearch] = useState('');
  const [ruleFieldFilter, setRuleFieldFilter] = useState('All fields');
  const [ruleStatusFilter, setRuleStatusFilter] = useState('All statuses');

  // Computed filtered validation rules
  const filteredValidationRules = useMemo(() => {
    return rulesList.filter((rule) => {
      const matchesSearch =
        rule.field.toLowerCase().includes(ruleSearch.toLowerCase().trim()) ||
        rule.rule.toLowerCase().includes(ruleSearch.toLowerCase().trim());
      const matchesField =
        ruleFieldFilter === 'All fields' || rule.field === ruleFieldFilter;
      const matchesStatus =
        ruleStatusFilter === 'All statuses' || rule.status === ruleStatusFilter;

      return matchesSearch && matchesField && matchesStatus;
    });
  }, [rulesList, ruleSearch, ruleFieldFilter, ruleStatusFilter]);
  // Role Permissions Modal State
  const [selectedPermissionRole, setSelectedPermissionRole] = useState('Listings Coordinator');
  const [permissions, setPermissions] = useState({
    viewListings: true,
    manageDocs: true,
    requestAgentInfo: true,
    validateInfo: true,
    publishTreb: false,
    publishFub: false,
    manageUsers: false,
    systemSettings: false,
  });

  const subTabs = [
    'General',
    'Integrations',
    'Notifications',
    'Document Types',
    'Validation Rules',
    'User Access',
  ] as const;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) return;
    setCreateUserError('');
    try {
      const created = await createUser({
        full_name: newUserForm.name,
        email: newUserForm.email,
        password: newUserForm.password,
        role_name: newUserForm.role,
      });
      setUserList((prev) => [created, ...prev]);
      setIsAddUserModalOpen(false);
      setNewUserForm({ name: '', email: '', role: 'listings_coordinator', password: '' });
      triggerToast('User created!', `"${created.full_name}" has been granted ${formatRole(created.role)} access.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user.';
      setCreateUserError(msg);
    }
  };

  // Severity indicator for Validation Rules
  const getSeverityBadge = (sev: 'High' | 'Medium' | 'Low') => {
    switch (sev) {
      case 'High':
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Medium
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span> Low
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure your preferences and system settings.
        </p>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left Sub-Tab Navigation */}
        <div className="col-span-12 md:col-span-3 space-y-1">
          {subTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                activeSubTab === tab
                  ? 'bg-blue-50/80 text-blue-600 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{tab}</span>
            </button>
          ))}
        </div>

        {/* Right Content Area */}
        <div className="col-span-12 md:col-span-9 bg-white rounded-3xl border border-slate-100 shadow-xs p-6">
          {/* TAB 1: GENERAL SETTINGS */}
          {activeSubTab === 'General' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">General Settings</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage your workspace preferences.</p>
                </div>
                <button 
                onClick={handleSaveChanges}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer">
                  Save Changes
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default View</label>
                  <select
                    value={defaultView}
                    onChange={(e) => setDefaultView(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="Listings Queue">Listings Queue</option>
                    <option value="Analytics">Analytics</option>
                    <option value="Team Activity">Team Activity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Items per Page</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date Format</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
                    />
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Zone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="(GMT-03:00) Buenos Aires">(GMT-03:00) Buenos Aires</option>
                    <option value="(GMT-05:00) Eastern Time (US & Canada)">(GMT-05:00) Eastern Time (US & Canada)</option>
                    <option value="(GMT-08:00) Pacific Time (US & Canada)">(GMT-08:00) Pacific Time (US & Canada)</option>
                    <option value="(GMT+00:00) UTC">(GMT+00:00) UTC</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Show property images</span>
                    <span className="text-[13px] text-slate-400">Display property thumbnails in listings table</span>
                  </div>
                  <button
                    onClick={() => setShowPropertyImages(!showPropertyImages)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                      showPropertyImages ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                        showPropertyImages ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Auto-refresh data</span>
                    <span className="text-[13px] text-slate-400">Automatically sync with external APIs periodically</span>
                  </div>
                  <button
                    onClick={() => setAutoRefreshData(!autoRefreshData)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                      autoRefreshData ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                        autoRefreshData ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Enable sound notifications</span>
                    <span className="text-[13px] text-slate-400">Play an audio cue when high priority items need review</span>
                  </div>
                  <button
                    onClick={() => setEnableSound(!enableSound)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                      enableSound ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                        enableSound ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTEGRATIONS */}
          {activeSubTab === 'Integrations' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-bold text-slate-900">Integrations</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage connections with external systems.</p>
              </div>

              <div className="space-y-3">
                {mockIntegrations.map((int) => (
                  <div
                    key={int.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Icon */}
                      {int.iconTag === 'TREB' && (
                        <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 font-black text-xs flex items-center justify-center border border-sky-100">
                          TREB
                        </div>
                      )}
                      {int.iconTag === 'FD' && (
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 font-black text-xs flex items-center justify-center border border-indigo-100">
                          FD
                        </div>
                      )}
                      {int.iconTag === 'Drive' && (
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                          <Folder className="w-4 h-4" />
                        </div>
                      )}
                      {int.iconTag === 'Website' && (
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                          <Globe className="w-4 h-4" />
                        </div>
                      )}
                      {int.iconTag === 'Asana' && (
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
                          <CheckSquare className="w-4 h-4" />
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{int.name}</h4>
                        {int.lastSync && (
                          <p className="text-[13px] text-slate-400">Last sync: {int.lastSync}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {int.status === 'Connected' ? (
                        <span className="text-[13px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Connected
                        </span>
                      ) : (
                        <span className="text-[13px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                          Not connected
                        </span>
                      )}
                      <button onClick={() => triggerToast('Configuration', `${int.name} integration settings coming soon.`)} className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer">
                        Configure
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeSubTab === 'Notifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Configure when and how you receive notifications.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
                  >
                    Open Modal View
                  </button>
                  <button 
                  onClick={handleSaveChanges}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer">
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Email Notifications */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-800">Email Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'newAgentRequests', label: 'New agent requests' },
                    { key: 'missingInfoUpdates', label: 'Missing information updates' },
                    { key: 'docProcessingComplete', label: 'Document processing completed' },
                    { key: 'listingReadyForReview', label: 'Listing ready for review' },
                    { key: 'statusChanges', label: 'Status changes' },
                    { key: 'systemAlerts', label: 'System alerts' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-1">
                      <span className="text-xs text-slate-700">{item.label}</span>
                      <button
                        onClick={() =>
                          setEmailNotifications({
                            ...emailNotifications,
                            [item.key as keyof typeof emailNotifications]:
                              !emailNotifications[item.key as keyof typeof emailNotifications],
                          })
                        }
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                          emailNotifications[item.key as keyof typeof emailNotifications]
                            ? 'bg-blue-600'
                            : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                            emailNotifications[item.key as keyof typeof emailNotifications]
                              ? 'right-1'
                              : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* In-App Notifications */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800">In-App Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'showInApp', label: 'Show in-app notifications' },
                    { key: 'playSound', label: 'Play sound' },
                    { key: 'showDesktop', label: 'Show desktop notifications' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-1">
                      <span className="text-xs text-slate-700">{item.label}</span>
                      <button
                        onClick={() =>
                          setInAppNotifications({
                            ...inAppNotifications,
                            [item.key as keyof typeof inAppNotifications]:
                              !inAppNotifications[item.key as keyof typeof inAppNotifications],
                          })
                        }
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                          inAppNotifications[item.key as keyof typeof inAppNotifications]
                            ? 'bg-blue-600'
                            : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                            inAppNotifications[item.key as keyof typeof inAppNotifications]
                              ? 'right-1'
                              : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOCUMENT TYPES */}
          {activeSubTab === 'Document Types' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Document Types</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage the list of required and optional documents.</p>
                </div>
                <button 
                onClick={() => setIsAddDocModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Document Type</span>
                </button>
              </div>

              {/* Filter Bar */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search document types..."
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>
                <div className="relative">
                  <select 
                    value={docStatusFilter}
                    onChange={(e) => setDocStatusFilter(e.target.value)}
                    className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-2xs focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="All statuses">All statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-[#f8fafc] text-slate-400 font-medium text-[13px] border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Document Type</th>
                      <th className="py-3 px-4">Required</th>
                      <th className="py-3 px-4">Applies To</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocumentTypes.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800">{doc.name}</td>
                        <td className="py-3 px-4">{doc.required}</td>
                        <td className="py-3 px-4">{doc.appliesTo}</td>
                        <td className="py-3 px-4">
                          {doc.status === 'Active' ? (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[13px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-[13px]">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredDocumentTypes.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                          No document types match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: VALIDATION RULES */}
          {activeSubTab === 'Validation Rules' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Validation Rules</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Define the rules used to validate listing information.</p>
                </div>
                <button 
                  onClick={() => setIsAddRuleModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </button>
              </div>

              {/* Filters */}
              <div className="flex items-center justify-between gap-3 text-xs">
                {/* Search Bar */}
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search validation rules..."
                    value={ruleSearch}
                    onChange={(e) => setRuleSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {/* All Fields Dropdown */}
                  <div className="relative">
                    <select
                      value={ruleFieldFilter}
                      onChange={(e) => setRuleFieldFilter(e.target.value)}
                      className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-2xs focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="All fields">All fields</option>
                      <option value="MLS Number">MLS Number</option>
                      <option value="Property Address">Property Address</option>
                      <option value="Listing Price">Listing Price</option>
                      <option value="Bedrooms">Bedrooms</option>
                      <option value="Bathrooms">Bathrooms</option>
                      <option value="Square Footage">Square Footage</option>
                      <option value="Live Date">Live Date</option>
                      <option value="Property Type">Property Type</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* All Statuses Dropdown */}
                  <div className="relative">
                    <select
                      value={ruleStatusFilter}
                      onChange={(e) => setRuleStatusFilter(e.target.value)}
                      className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-2xs focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="All statuses">All statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-[#f8fafc] text-slate-400 font-medium text-[13px] border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Field</th>
                      <th className="py-3 px-4">Rule</th>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredValidationRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800">{rule.field}</td>
                        <td className="py-3 px-4">{rule.rule}</td>
                        <td className="py-3 px-4">{getSeverityBadge(rule.severity)}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[13px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
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

          {/* TAB 6: USER ACCESS */}
          {activeSubTab === 'User Access' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">User Access</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage users and their permissions.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPermissionsModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Role Permissions</span>
                  </button>
                  <button
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add User</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-2xs focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="All roles">All roles</option>
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.label}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value)}
                      className="appearance-none bg-white pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 shadow-2xs focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="All statuses">All statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-[#f8fafc] text-slate-400 font-medium text-[13px] border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-slate-400">Loading users...</td>
                      </tr>
                    ) : usersError ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-rose-500">{usersError}</td>
                      </tr>
                    ) : userList
                      .filter((u) => {
                        const matchesSearch =
                          u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearch.toLowerCase());
                        const displayRole = formatRole(u.role);
                        const matchesRole =
                          userRoleFilter === 'All roles' || displayRole === userRoleFilter;
                        const statusLabel = u.is_active ? 'Active' : 'Inactive';
                        const matchesStatus =
                          userStatusFilter === 'All statuses' || statusLabel === userStatusFilter;
                        return matchesSearch && matchesRole && matchesStatus;
                      })
                      .map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-full text-white text-[12px] font-bold flex items-center justify-center shrink-0 ${avatarColor(u)}`}
                              >
                                {userInitials(u.full_name)}
                              </div>
                              <span className="font-semibold text-slate-800">{u.full_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-600">{u.email}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{formatRole(u.role)}</td>
                          <td className="py-3 px-4">
                            {u.is_active ? (
                              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[13px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full text-[13px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
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
        </div>
      </div>

      {/* SCREEN 7: ADD USER MODAL */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 relative">
            <button
              onClick={() => setIsAddUserModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-slate-900 mb-4">Add User</h3>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="Enter email address"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Set initial password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {createUserError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{createUserError}</p>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddUserModalOpen(false); setCreateUserError(''); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCREEN 8: ROLE PERMISSIONS MODAL */}
      {isPermissionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 relative">
            <button
              onClick={() => setIsPermissionsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-sm font-bold text-slate-900">Role Permissions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Configure permissions for each role.</p>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={selectedPermissionRole}
                  onChange={(e) => setSelectedPermissionRole(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
                >
                  <option value="Listings Coordinator">Listings Coordinator</option>
                  <option value="Agent">Agent</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="Reviewer">Reviewer</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Permissions</label>
                <div className="space-y-2.5 text-xs text-slate-700">
                  {[
                    { key: 'viewListings', label: 'View listings' },
                    { key: 'manageDocs', label: 'Manage documents' },
                    { key: 'requestAgentInfo', label: 'Request agent information' },
                    { key: 'validateInfo', label: 'Validate information' },
                    { key: 'publishTreb', label: 'Publish to TREB' },
                    { key: 'publishFub', label: 'Publish to FUB' },
                    { key: 'manageUsers', label: 'Manage users' },
                    { key: 'systemSettings', label: 'System settings' },
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions[perm.key as keyof typeof permissions]}
                        onChange={() =>
                          setPermissions({
                            ...permissions,
                            [perm.key as keyof typeof permissions]:
                              !permissions[perm.key as keyof typeof permissions],
                          })
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPermissionsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setIsPermissionsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 9: NOTIFICATIONS PREFERENCES MODAL */}
      {isNotificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 relative">
            <button
              onClick={() => setIsNotificationModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-slate-900 mb-3">Notification Preferences</h3>

            {/* Modal Tabs */}
            <div className="grid grid-cols-2 border-b border-slate-100 mb-4 text-xs font-semibold text-center">
              <button
                onClick={() => setModalTab('Email')}
                className={`pb-2.5 transition border-b-2 cursor-pointer ${
                  modalTab === 'Email'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setModalTab('In-App')}
                className={`pb-2.5 transition border-b-2 cursor-pointer ${
                  modalTab === 'In-App'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                In-App
              </button>
            </div>

            <p className="text-[13px] text-slate-400 mb-3">
              Select the notifications you want to receive by {modalTab.toLowerCase()}.
            </p>

            {/* DYNAMIC LIST BASED ON ACTIVE TAB */}
            <div className="space-y-3">
              {modalTab === 'Email' ? (
                <>
                  {[
                    { key: 'newAgentRequests', label: 'New agent requests' },
                    { key: 'missingInfoUpdates', label: 'Missing information updates' },
                    { key: 'docProcessingComplete', label: 'Document processing completed' },
                    { key: 'listingReadyForReview', label: 'Listing ready for review' },
                    { key: 'statusChanges', label: 'Status changes' },
                    { key: 'systemAlerts', label: 'System alerts' },
                  ].map((item) => {
                    const isChecked = emailNotifications[item.key as keyof typeof emailNotifications];
                    return (
                      <div key={item.key} className="flex items-center justify-between py-1">
                        <span className="text-xs text-slate-700">{item.label}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setEmailNotifications((prev) => ({
                              ...prev,
                              [item.key]: !prev[item.key as keyof typeof emailNotifications],
                            }))
                          }
                          className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                            isChecked ? 'bg-blue-600' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                              isChecked ? 'right-1' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  {[
                    { key: 'showInApp', label: 'Show in-app notifications' },
                    { key: 'playSound', label: 'Play sound' },
                    { key: 'showDesktop', label: 'Show desktop notifications' },
                  ].map((item) => {
                    const isChecked = inAppNotifications[item.key as keyof typeof inAppNotifications];
                    return (
                      <div key={item.key} className="flex items-center justify-between py-1">
                        <span className="text-xs text-slate-700">{item.label}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setInAppNotifications((prev) => ({
                              ...prev,
                              [item.key]: !prev[item.key as keyof typeof inAppNotifications],
                            }))
                          }
                          className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                            isChecked ? 'bg-blue-600' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                              isChecked ? 'right-1' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="mt-6 pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNotificationModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveChanges();
                  setIsNotificationModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Toast Banner */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200/90 rounded-2xl px-4 py-3 shadow-lg text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div>
            {/* Must use the state variables here, NOT hardcoded text */}
            <span className="font-bold text-slate-800 block">{toastMessage.title}</span>
            <span className="text-[13px] text-slate-500 block">{toastMessage.description}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            className="text-slate-400 hover:text-slate-600 ml-3 p-0.5 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ADD DOCUMENT TYPE MODAL */}
  {isAddDocModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 relative animate-in zoom-in-95 duration-150">
        <button
          onClick={() => setIsAddDocModalOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <h3 className="text-sm font-bold text-slate-900">Add Document Type</h3>
          <p className="text-xs text-slate-400 mt-0.5">Specify rules and requirements for a new document.</p>
        </div>

        <form onSubmit={handleCreateDocType} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Document Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Lead Paint Disclosure"
              value={newDocForm.name}
              onChange={(e) => setNewDocForm({ ...newDocForm, name: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Required</label>
              <select
                value={newDocForm.required}
                onChange={(e) =>
                  setNewDocForm({
                    ...newDocForm,
                    required: e.target.value as 'Yes' | 'No' | 'Conditional',
                  })
                }
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Conditional">Conditional</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Applies To</label>
              <select
                value={newDocForm.appliesTo}
                onChange={(e) => setNewDocForm({ ...newDocForm, appliesTo: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="All Listings">All Listings</option>
                <option value="Condos Only">Condos Only</option>
                <option value="Freehold Only">Freehold Only</option>
                <option value="Commercial Only">Commercial Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={newDocForm.status}
              onChange={(e) =>
                setNewDocForm({
                  ...newDocForm,
                  status: e.target.value as 'Active' | 'Inactive',
                })
              }
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddDocModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer"
            >
              Add Document Type
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* ADD VALIDATION RULE MODAL */}
  {isAddRuleModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 relative animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={() => setIsAddRuleModalOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <h3 className="text-sm font-bold text-slate-900">Add Validation Rule</h3>
          <p className="text-xs text-slate-400 mt-0.5">Define a condition required for listing verification.</p>
        </div>

        <form onSubmit={handleCreateRule} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Field Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Lot Size, Postal Code"
              value={newRuleForm.field}
              onChange={(e) => setNewRuleForm({ ...newRuleForm, field: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Validation Rule / Condition</label>
            <input
              type="text"
              required
              placeholder="e.g. Must be alphanumeric and 6 characters"
              value={newRuleForm.rule}
              onChange={(e) => setNewRuleForm({ ...newRuleForm, rule: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
              <select
                value={newRuleForm.severity}
                onChange={(e) =>
                  setNewRuleForm({
                    ...newRuleForm,
                    severity: e.target.value as 'High' | 'Medium' | 'Low',
                  })
                }
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={newRuleForm.status}
                onChange={(e) =>
                  setNewRuleForm({
                    ...newRuleForm,
                    status: e.target.value as 'Active' | 'Inactive',
                  })
                }
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddRuleModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer"
            >
              Add Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
      
    </div>
  );
};
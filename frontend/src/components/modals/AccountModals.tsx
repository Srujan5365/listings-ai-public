import React, { useState } from 'react';
import { X, User, KeyRound, Sliders, CheckCircle2 } from 'lucide-react';
import type { AuthUser } from '../../api/auth';

export type AccountModalTab = 'profile' | 'password' | 'preferences';

interface AccountModalProps {
  isOpen: boolean;
  activeTab: AccountModalTab;
  onClose: () => void;
  onTabChange: (tab: AccountModalTab) => void;
  user: AuthUser;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  activeTab,
  onClose,
  onTabChange,
  user,
}) => {
  const nameParts = user.full_name.split(' ');
  const [profileData, setProfileData] = useState({
    firstName: nameParts[0] ?? '',
    lastName: nameParts.slice(1).join(' '),
    email: user.email,
    role: user.role,
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    desktopNotifications: true,
    compactView: false,
    autoRefresh: true,
  });

  const [savedMessage, setSavedMessage] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">Account Settings</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-6 border-b border-slate-100 bg-[#f8fafc]/60">
          <button
            onClick={() => onTabChange('profile')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition -mb-px ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => onTabChange('password')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition -mb-px ${
              activeTab === 'password'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Change Password</span>
          </button>

          <button
            onClick={() => onTabChange('preferences')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition -mb-px ${
              activeTab === 'preferences'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
          
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-2">
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                  {currentUser.initials}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {profileData.firstName} {profileData.lastName}
                  </h4>
                  <p className="text-xs text-slate-400">{profileData.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">First Name</label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Last Name</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Work Email</label>
                <input
                  type="email"
                  disabled
                  value={profileData.email}
                  className="w-full text-xs px-3 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Change Password */}
          {activeTab === 'password' && (
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Re-type new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* TAB 3: Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/60 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Email Alerts</span>
                  <span className="text-[13px] text-slate-400">Receive summaries for listings requiring attention</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailAlerts}
                  onChange={(e) => setPreferences({ ...preferences, emailAlerts: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0 cursor-pointer w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/60 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Browser Notifications</span>
                  <span className="text-[13px] text-slate-400">Notify immediately when an agent updates docs</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.desktopNotifications}
                  onChange={(e) => setPreferences({ ...preferences, desktopNotifications: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0 cursor-pointer w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/60 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Automatic Real-Time Sync</span>
                  <span className="text-[13px] text-slate-400">Poll live intake feeds without manual page refresh</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.autoRefresh}
                  onChange={(e) => setPreferences({ ...preferences, autoRefresh: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0 cursor-pointer w-4 h-4"
                />
              </label>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {savedMessage ? (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Changes saved successfully!
              </span>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
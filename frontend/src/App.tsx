import React, { Component, useEffect, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { ListingsPage } from './components/listings/ListingsPage';
import { LoginScreen } from './components/auth/LoginScreen';
import { AccountModal } from './components/modals/AccountModals';
import { SettingsPage } from './components/settings/SettingsPage';
import type { AccountModalTab } from './components/modals/AccountModals';
import { ActivityPage } from './components/activity/ActivityPage';
import { InboxPage } from './components/inbox/InboxPage';
import { DocumentsPage } from './components/documents/DocumentsPage';
import type { AuthUser } from './api/auth';
import { getMe } from './api/auth';
import { clearTokens, getAccessToken } from './api/client';

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#f4f7fb] text-slate-500">
          <h2 className="text-lg font-semibold text-slate-700 mb-1">Something went wrong</h2>
          <p className="text-xs">Please refresh the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeNav, setActiveNav] = useState('Home');
  const [sessionExpired, setSessionExpired] = useState(false);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<AccountModalTab>('profile');
  const [globalSearch, setGlobalSearch] = useState('');

  // On mount: restore session from localStorage if token exists
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => { clearTokens(); })
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  // Listen for session expiry events from the API client
  useEffect(() => {
    const handler = () => {
      setUser(null);
      clearTokens();
      setActiveNav('Home');
      setSessionExpired(true);
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const handleOpenAccountModal = (tab: AccountModalTab) => {
    setAccountModalTab(tab);
    setIsAccountModalOpen(true);
  };

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    setActiveNav('Home');
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {sessionExpired && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-lg shadow-lg">
            Your session expired. Please sign in again.
          </div>
        )}
        <LoginScreen onLoginSuccess={(u) => { setUser(u); setSessionExpired(false); }} />
      </>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-[#f4f7fb] overflow-hidden">
        <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Navbar
            onOpenAccountModal={handleOpenAccountModal}
            onLogout={handleLogout}
            user={user}
            onSearch={(term) => {
              setGlobalSearch(term);
              if (term.trim()) setActiveNav('Listings');
            }}
          />

          <main className="flex-1">
            {activeNav === 'Home' && <DashboardPage user={user} onNavigate={setActiveNav} />}
            {activeNav === 'Listings' && <ListingsPage initialSearch={globalSearch} />}
            {activeNav === 'Settings' && <SettingsPage currentUser={user} />}
            {activeNav === 'Activity' && <ActivityPage />}
            {activeNav === 'Inbox' && <InboxPage />}
            {activeNav === 'Documents' && <DocumentsPage />}

            {activeNav !== 'Home' && activeNav !== 'Listings' && activeNav !== 'Activity' && activeNav !== 'Settings' && activeNav !== 'Inbox' && activeNav !== 'Documents' && (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
                <div className="text-5xl font-bold text-slate-200 mb-3">404</div>
                <h2 className="text-base font-semibold text-slate-700 mb-1">Page not found</h2>
                <p className="text-xs text-slate-400 mb-4">The page you're looking for doesn't exist.</p>
                <button
                  onClick={() => setActiveNav('Home')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  ← Back to Home
                </button>
              </div>
            )}
          </main>
        </div>

        <AccountModal
          isOpen={isAccountModalOpen}
          activeTab={accountModalTab}
          onClose={() => setIsAccountModalOpen(false)}
          onTabChange={(tab) => setAccountModalTab(tab)}
          user={user}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;

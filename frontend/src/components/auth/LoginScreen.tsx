import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { login, forgotPassword } from '../../api/auth';
import type { AuthUser } from '../../api/auth';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

type AuthMode = 'login' | 'forgot-password' | 'reset-sent';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      onLoginSuccess(user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg === 'Incorrect email or password' ? 'Incorrect email or password' : 'Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setAuthMode('reset-sent');
    } catch {
      // Always show success to avoid email enumeration
      setAuthMode('reset-sent');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative z-10 border border-slate-100 transition-all">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-xl mb-3 shadow-md">
            LA
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Listings AI</h2>
          <p className="text-xs text-slate-500 mt-1">
            {authMode === 'login' && 'Sign in to your coordinator dashboard'}
            {authMode === 'forgot-password' && 'Reset your account password'}
            {authMode === 'reset-sent' && 'Check your inbox'}
          </p>
        </div>

        {/* 1. LOGIN VIEW */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot-password')}
                  className="text-[13px] text-blue-600 font-medium hover:underline focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-0" />
                <span>Remember me for 30 days</span>
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 rounded-xl shadow-md transition disabled:opacity-70 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 2. FORGOT PASSWORD VIEW */}
        {authMode === 'forgot-password' && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your email address and we will send you a secure verification link to reset your credentials.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Registered Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 rounded-xl shadow-md transition disabled:opacity-70 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Sending Recovery Link...</span>
              ) : (
                <>
                  <span>Send Reset Instructions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium py-2 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </form>
        )}

        {/* 3. RESET LINK SENT CONFIRMATION */}
        {authMode === 'reset-sent' && (
          <div className="space-y-4 text-center py-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mb-1">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              We sent a password recovery link to <span className="font-semibold text-slate-800">{email}</span>. Please check your inbox and spam folder.
            </p>
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Sign In</span>
            </button>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-[13px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Enterprise SSO & End-to-End Encryption</span>
        </div>
      </div>
    </div>
  );
};
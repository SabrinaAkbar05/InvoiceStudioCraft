'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getFriendlyAuthErrorMessage } from '@/lib/firebase/errors';
import { ArrowLeft, Mail, Lock, User, AlertCircle, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, user, loading } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  React.useEffect(() => {
    if (user && !loading && !success) {
      router.push('/dashboard');
    }
  }, [user, loading, router, success]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await signUpWithEmail(email, password, displayName);
      setSuccess(true);
      setTimeout(() => {
        router.push('/setup');
      }, 1200);
    } catch (err: unknown) {
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      // On desktop popup resolves → go to dashboard (user may already have workspace)
      // On mobile, page navigates away; this code won't run
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getFriendlyAuthErrorMessage(err));
      setGoogleSubmitting(false);
    }
  };

  // Show loading spinner while mobile redirect is being processed
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F1128] via-[#1B1E3F] to-[#0A0C1E] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6254E8] to-[#9085FF] flex items-center justify-center shadow-lg animate-pulse">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <p className="text-slate-400 text-sm">Signing you in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1128] via-[#1B1E3F] to-[#0A0C1E] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#6254E8]/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6254E8] to-[#9085FF] flex items-center justify-center shadow-lg shadow-[#6254E8]/40 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">InvoiceCraft Studio</h1>
            <p className="text-xs text-slate-400">Create your new cloud workspace</p>
          </div>
        </div>

        <div className="bg-[#171A38]/80 backdrop-blur-xl py-8 px-5 sm:px-8 rounded-3xl border border-white/10 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Account created! Redirecting to workspace setup…</span>
            </div>
          )}

          {/* Google Sign Up */}
          <button
            type="button"
            id="google-register-btn"
            onClick={handleGoogleSignup}
            disabled={googleSubmitting || submitting || success}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-all shadow-md active:scale-[0.99] disabled:opacity-50 touch-manipulation"
          >
            {googleSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>Sign up with Google</span>
          </button>

          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-white/10" />
            <span className="px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Or with email
            </span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            <div>
              <label htmlFor="reg-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name / Business Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#6254E8] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#6254E8] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#6254E8] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-xs font-medium text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="reg-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#6254E8] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              id="register-submit-btn"
              disabled={submitting || googleSubmitting || success}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#6254E8] to-[#7B70E2] hover:from-[#5143D6] hover:to-[#6C60D0] text-white text-sm font-bold shadow-lg shadow-[#6254E8]/30 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 touch-manipulation"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Create Workspace</span>
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-bold text-[#9085FF] hover:text-white transition-colors"
            >
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

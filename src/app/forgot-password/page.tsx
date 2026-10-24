'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getFriendlyAuthErrorMessage } from '@/lib/firebase/errors';
import { ArrowLeft, Mail, AlertCircle, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1128] via-[#1B1E3F] to-[#0A0C1E] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#6254E8]/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6254E8] to-[#9085FF] flex items-center justify-center shadow-lg shadow-[#6254E8]/40 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Reset Password</h1>
            <p className="text-xs text-slate-400">We&apos;ll send a recovery link to your inbox</p>
          </div>
        </div>

        <div className="bg-[#171A38]/80 backdrop-blur-xl py-8 px-5 sm:px-8 rounded-3xl border border-white/10 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-white">Check your email</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                If an account exists for{' '}
                <span className="text-white font-medium break-all">{email}</span>, you will receive
                password reset instructions shortly.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-all touch-manipulation"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="reset-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Account Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    id="reset-email"
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

              <button
                type="submit"
                id="reset-submit-btn"
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#6254E8] to-[#7B70E2] hover:from-[#5143D6] hover:to-[#6C60D0] text-white text-sm font-bold shadow-lg shadow-[#6254E8]/30 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 touch-manipulation"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Send Reset Link</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

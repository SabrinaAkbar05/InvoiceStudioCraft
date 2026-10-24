'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

type ToastListener = (toast: ToastItem) => void;
const listeners: Set<ToastListener> = new Set();

function emitToast(type: ToastType, message: string, title?: string, duration: number = 4000) {
  const item: ToastItem = {
    id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type,
    message,
    title,
    duration
  };
  listeners.forEach((listener) => listener(item));
}

export const toast = {
  success: (message: string, title?: string, duration?: number) => emitToast('success', message, title, duration),
  error: (message: string, title?: string, duration?: number) => emitToast('error', message, title || 'Error', duration || 5000),
  warning: (message: string, title?: string, duration?: number) => emitToast('warning', message, title, duration),
  info: (message: string, title?: string, duration?: number) => emitToast('info', message, title, duration)
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast: ToastListener = (newToast) => {
      setToasts((prev) => [...prev.slice(-4), newToast]);

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(newToast.id);
        }, newToast.duration);
      }
    };

    listeners.add(handleToast);
    return () => {
      listeners.delete(handleToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => {
        const config = {
          success: {
            icon: CheckCircle2,
            bg: 'bg-white',
            border: 'border-emerald-200',
            iconColor: 'text-emerald-500',
            titleColor: 'text-emerald-950',
            badgeBg: 'bg-emerald-50'
          },
          error: {
            icon: AlertCircle,
            bg: 'bg-white',
            border: 'border-rose-200',
            iconColor: 'text-rose-500',
            titleColor: 'text-rose-950',
            badgeBg: 'bg-rose-50'
          },
          warning: {
            icon: AlertTriangle,
            bg: 'bg-white',
            border: 'border-amber-200',
            iconColor: 'text-amber-500',
            titleColor: 'text-amber-950',
            badgeBg: 'bg-amber-50'
          },
          info: {
            icon: Info,
            bg: 'bg-white',
            border: 'border-indigo-200',
            iconColor: 'text-indigo-500',
            titleColor: 'text-indigo-950',
            badgeBg: 'bg-indigo-50'
          }
        }[t.type];

        const Icon = config.icon;

        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl shadow-slate-900/10 border ${config.bg} ${config.border} transition-all duration-300 animate-in fade-in slide-in-from-bottom-3`}
          >
            <div className={`p-1.5 rounded-xl ${config.badgeBg} ${config.iconColor} flex-shrink-0 mt-0.5`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              {t.title && (
                <p className={`text-xs font-bold leading-tight ${config.titleColor}`}>
                  {t.title}
                </p>
              )}
              <p className="text-xs text-slate-600 leading-snug mt-0.5 break-words">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

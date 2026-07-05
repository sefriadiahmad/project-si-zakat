import * as React from 'react'
import { cn } from '@shared/lib/utils'

// ── Toast Context ──────────────────────────────────────────────────────────────

const ToastContext = React.createContext(null)

function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider />')
  }
  return ctx
}

// ── Provider + Renderer ────────────────────────────────────────────────────────

function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([])

  const toast = React.useCallback(
    ({ title, description, variant = 'default', duration = 5000 }) => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [...prev, { id, title, description, variant }])
      if (duration !== Infinity) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }, duration)
      }
      return id
    },
    []
  )

  const dismiss = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Viewport rendered inside the provider */}
      <div
        className="fixed bottom-4 right-4 z-[100] flex max-h-screen w-full max-w-[420px] flex-col-reverse gap-2 pointer-events-none"
        aria-live="polite"
        aria-label="Notifikasi"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/** Legacy: keep Toaster as an alias — just renders nothing by itself */
function Toaster() { return null }

function ToastItem({ id, title, description, variant = 'default', onDismiss }) {
  const variantClasses = {
    default: 'border border-slate-200 bg-white text-slate-900 shadow-lg',
    destructive: 'border border-red-200 bg-red-50 text-red-900 shadow-lg',
    success: 'border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-lg',
  }

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-xl p-4 transition-all animate-in slide-in-from-bottom-2',
        variantClasses[variant] || variantClasses.default
      )}
    >
      <div className="flex-1 min-w-0">
        {title && (
          <div className="text-sm font-semibold leading-snug">{title}</div>
        )}
        {description && (
          <div className="mt-0.5 text-xs opacity-80 leading-snug">{description}</div>
        )}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity focus:outline-none"
        aria-label="Tutup notifikasi"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

export { Toaster, ToastProvider, useToast }

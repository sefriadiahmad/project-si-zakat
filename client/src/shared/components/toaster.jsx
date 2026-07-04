import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@shared/lib/utils'

const toastStyles = cva(
  'pointer-events-auto flex w-full flex-col items-center gap-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive: 'destructive group border-destructive bg-destructive text-destructive-foreground',
        success: 'border-green-500 bg-green-50 text-green-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const ToastContext = React.createContext(undefined)

function useToast() {
  const toastState = React.useContext(ToastContext)
  if (!toastState) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return toastState
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([])

  const addToast = React.useCallback(({ title, description, variant = 'default', duration = 5000 }) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { id, title, description, variant, duration }

    setToasts((prev) => [...prev, newToast])

    if (duration !== Infinity) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const removeToast = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = React.useMemo(
    () => ({
      toast: addToast,
      dismiss: removeToast,
    }),
    [addToast, removeToast]
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  )
}

function ToastViewport({ className, ...props }) {
  const toasts = React.useContext(ToastContext)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div
      className={cn(
        'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
        className
      )}
      {...props}
    >
      {toasts.toast ? null : null}
    </div>
  )
}

function Toast({ className, variant = 'default', ...props }) {
  return <div className={cn(toastStyles({ variant }), className)} {...props} />
}

function Toaster() {
  const [toasts, setToasts] = React.useState([])

  const addToast = React.useCallback(({ title, description, variant = 'default', duration = 5000 }) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { id, title, description, variant, duration }

    setToasts((prev) => [...prev, newToast])

    if (duration !== Infinity) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const removeToast = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  if (typeof window !== 'undefined') {
    window.toast = { toast: addToast, dismiss: removeToast }
  }

  return (
    <ToastProvider>
      <div
        className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            className="mb-2"
          >
            {t.title && <div className="text-sm font-semibold">{t.title}</div>}
            {t.description && <div className="text-sm opacity-90">{t.description}</div>}
          </Toast>
        ))}
      </div>
    </ToastProvider>
  )
}

export { Toast, Toaster, useToast, ToastProvider }

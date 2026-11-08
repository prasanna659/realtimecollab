import { createContext, useContext, useMemo, useState } from "react";
import { CheckCircle2, X, AlertCircle, Info } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

const ToastContext = createContext<{
  push: (message: string, tone?: ToastTone) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = (message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, tone, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2600);
  };

  const value = useMemo(() => ({ push }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => {
          const toneClasses = {
            success: "border-emerald-200 bg-emerald-50 text-emerald-900",
            error: "border-red-200 bg-red-50 text-red-900",
            info: "border-slate-200 bg-white text-slate-800",
          };

          const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? AlertCircle : Info;

          return (
            <div
              key={toast.id}
              className={"pointer-events-auto flex items-start gap-3 rounded-xl border px-3 py-2.5 shadow-sm backdrop-blur-sm " + toneClasses[toast.tone]}
            >
              <Icon size={16} className="mt-0.5 shrink-0" />
              <span className="flex-1 text-sm font-medium">{toast.message}</span>
              <button
                type="button"
                onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                className="rounded p-1 text-current/70 hover:text-current"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

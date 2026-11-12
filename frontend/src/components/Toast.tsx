import { CheckCircle2, X, AlertCircle, Info } from "lucide-react";
import { useToastStore, type ToastTone } from "../store/toastStore";

const toneClasses: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-slate-200 bg-white text-slate-800",
};

/** Renders the toast stack. State lives in toastStore so any code can raise a toast. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((t) => {
          const Icon = t.tone === "success" ? CheckCircle2 : t.tone === "error" ? AlertCircle : Info;
          return (
            <div
              key={t.id}
              className={"pointer-events-auto flex items-start gap-3 rounded-xl border px-3 py-2.5 shadow-sm " + toneClasses[t.tone]}
            >
              <Icon size={16} className="mt-0.5 shrink-0" />
              <span className="flex-1 text-sm font-medium">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="rounded p-1 opacity-70 hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

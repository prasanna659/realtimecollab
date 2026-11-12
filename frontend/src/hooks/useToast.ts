import { useToastStore } from "../store/toastStore";

/** const { push } = useToast();  Prefer `toast.error(...)` from store/toastStore outside components. */
export function useToast() {
  return { push: useToastStore((s) => s.push) };
}

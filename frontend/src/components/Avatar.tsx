import { initials } from "../lib/format";

const GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-cyan-500 to-teal-500",
  "from-emerald-500 to-green-600",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

const SIZES = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-7 w-7 text-[10px]",
  md: "h-8 w-8 text-[10px]",
  lg: "h-10 w-10 text-xs",
} as const;

export function Avatar({ name, size = "sm" }: { name: string; size?: keyof typeof SIZES }) {
  const gradient = GRADIENTS[(name.charCodeAt(0) || 0) % GRADIENTS.length];
  return (
    <div
      title={name}
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} font-bold text-white shadow-sm ${SIZES[size]}`}
    >
      {initials(name) || "?"}
    </div>
  );
}

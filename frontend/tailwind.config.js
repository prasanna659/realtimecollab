/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Page background — cool off-white
        canvas:   "#F0F2F7",
        // Card / surface
        surface:  "#FFFFFF",
        // Sidebar — deep ocean navy
        sidebar:  "#0F1629",
        "sidebar-hover":    "#1A2540",
        "sidebar-selected": "#1E3A5F",

        // Primary — electric violet
        primary:        "#6366F1",
        "primary-hover":"#4F51D8",
        "primary-light":"#EEF2FF",

        // Accent — cyan teal
        teal:        "#06B6D4",
        "teal-light":"#ECFEFF",

        // Semantic
        success: "#10B981",
        warning: "#F59E0B",
        danger:  "#EF4444",
        info:    "#3B82F6",

        // Text
        ink:    "#0F172A",
        "ink-2":"#475569",
        muted:  "#94A3B8",

        // Borders & backgrounds
        border:     "#E2E8F0",
        "hover-bg": "#F1F5F9",
        selected:   "#EEF2FF",

        // Chart palette — cool vivid
        "chart-1": "#6366F1",
        "chart-2": "#06B6D4",
        "chart-3": "#10B981",
        "chart-4": "#F59E0B",
        "chart-5": "#EC4899",
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "'Inter'", "sans-serif"],
        body:    ["'Inter'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        card:  "14px",
        modal: "16px",
        btn:   "10px",
      },
      boxShadow: {
        card:       "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
        "card-hover":"0 8px 24px rgba(99,102,241,0.10), 0 2px 6px rgba(15,23,42,0.06)",
        modal:      "0 24px 64px rgba(15,23,42,0.16), 0 8px 24px rgba(99,102,241,0.08)",
        sidebar:    "4px 0 16px rgba(15,23,42,0.20)",
        glow:       "0 0 20px rgba(99,102,241,0.25)",
      },
      animation: {
        "fade-in":    "fadeIn 0.2s ease-out",
        "slide-up":   "slideUp 0.25s ease-out",
        "slide-right":"slideRight 0.3s ease-out",
      },
      keyframes: {
        fadeIn:     { "0%": { opacity: "0" },                                   "100%": { opacity: "1" } },
        slideUp:    { "0%": { opacity: "0", transform: "translateY(8px)" },     "100%": { opacity: "1", transform: "translateY(0)" } },
        slideRight: { "0%": { opacity: "0", transform: "translateX(20px)" },    "100%": { opacity: "1", transform: "translateX(0)" } },
      },
    },
  },
  plugins: [],
};

import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fondo: "#F3F2F7",
        papel: "#FFFFFF",
        tinta: "#241F3A",
        humo: "#6B6483",
        borde: "#E2DFEB",
        acento: "#5B4BC4",
        dorado: "#C8922E",
        verde: "#2F7D63",
      },
      fontFamily: {
        libro: ["var(--font-libro)", "Georgia", "serif"],
        ui: ["var(--font-ui)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        tapa: "0 1px 2px rgba(36,31,58,.10), 0 8px 20px -12px rgba(36,31,58,.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;

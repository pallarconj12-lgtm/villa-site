import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palette pulled from the photography: walnut joinery, travertine floors, dusk water.
        ink: "#1c201d", // charcoal
        bone: "#f6f2ea", // limestone, the light ground
        sand: "#d9cdb6", // travertine
        umber: "#69645a", // muted text on light
        haze: "#b9a992", // muted text on dark
        lagoon: "#1f4d3a", // pool water, used sparingly on light
        "lagoon-light": "#9dbfa9",
        gold: "#b8975a", // same, on dark
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        cine: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nusantara: {
          ink: "#1B1B1B",
          bone: "#F7F1E3",
          batik: "#7A1E1E",
          teak: "#7B4E2E",
          jade: "#0F766E",
          gold: "#B45309",
        },
      },
      backgroundImage: {
        "batik-grid":
          "radial-gradient(circle at 1px 1px, rgba(122,30,30,.08) 1px, transparent 0), radial-gradient(circle at 9px 9px, rgba(15,118,110,.06) 1px, transparent 0)",
      },
      backgroundSize: {
        "batik-grid": "16px 16px",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

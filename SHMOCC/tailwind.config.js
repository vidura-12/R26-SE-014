// tailwind.config.js
export default {
  darkMode: "class", // must be exactly this, not "media"
  content: ["./index.html", "./src/**/*.{js,jsx}"], // make sure this covers your files
  theme: { extend: { /* your brand colors */ } },
};
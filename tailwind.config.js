/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark"],
  },
  // DaisyUI class'larının purge edilmemesi için safelist
  safelist: [
    // Menu class'ları
    'menu',
    'menu-title',
    'menu-item',
    // Menu nested selectors için
    {
      pattern: /^menu/,
    },
    // Diğer DaisyUI component'leri
    {
      pattern: /^(btn|card|input|select|textarea|label|badge|alert|modal|drawer|dropdown|tooltip|popover|swap|stats|table|artboard|divider|footer|hero|indicator|join|link|loading|mask|progress|radial-progress|rating|stack|steps|toast|toggle|navbar|breadcrumbs|tabs|collapse|kbd|mockup-code|phone|window)/,
    },
    {
      pattern: /^(btn|card|input|select|textarea|label|badge|alert|modal|drawer|dropdown|tooltip|popover|swap|stats|table|artboard|divider|footer|hero|indicator|join|link|loading|mask|progress|radial-progress|rating|stack|steps|toast|toggle|navbar|breadcrumbs|tabs|collapse|kbd|mockup-code|phone|window)-/,
    },
  ],
};

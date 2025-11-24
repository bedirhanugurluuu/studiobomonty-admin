/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    // DaisyUI'nin tüm dosyalarını da tarayalım (optional - genelde gerekmez)
  ],
  theme: {
    extend: {},
  },
  // DaisyUI CSS'inin purge edilmemesi için
  important: false,
  corePlugins: {
    preflight: true,
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark"],
    base: true, // DaisyUI base styles'ı ekle
    styled: true, // DaisyUI styled components'ı ekle
    utils: true, // DaisyUI utility classes'ı ekle
    logs: false, // DaisyUI log'larını kapat
    rtl: false, // RTL desteği kapalı
    prefix: "", // Prefix yok
    darkTheme: "dark", // Dark theme
  },
  // DaisyUI class'larının purge edilmemesi için safelist
  safelist: [
    // Menu class'ları
    'menu',
    'menu-title',
    'menu-item',
    // Button variants
    'btn-primary',
    'btn-secondary',
    'btn-accent',
    'btn-info',
    'btn-success',
    'btn-warning',
    'btn-error',
    'btn-ghost',
    'btn-link',
    'btn-outline',
    'btn-active',
    'btn-disabled',
    'btn-sm',
    'btn-md',
    'btn-lg',
    'btn-xs',
    'btn-wide',
    'btn-block',
    'btn-circle',
    'btn-square',
    // Alert variants
    'alert-info',
    'alert-success',
    'alert-warning',
    'alert-error',
    // Badge variants
    'badge-primary',
    'badge-secondary',
    'badge-accent',
    'badge-info',
    'badge-success',
    'badge-warning',
    'badge-error',
    'badge-ghost',
    'badge-outline',
    // Card variants
    'card-bordered',
    'card-compact',
    'card-normal',
    'card-side',
    // Input variants
    'input-bordered',
    'input-ghost',
    'input-primary',
    'input-secondary',
    'input-accent',
    'input-info',
    'input-success',
    'input-warning',
    'input-error',
    // Select variants
    'select-bordered',
    'select-ghost',
    'select-primary',
    'select-secondary',
    'select-accent',
    'select-info',
    'select-success',
    'select-warning',
    'select-error',
    // Textarea variants
    'textarea-bordered',
    'textarea-ghost',
    'textarea-primary',
    'textarea-secondary',
    'textarea-accent',
    'textarea-info',
    'textarea-success',
    'textarea-warning',
    'textarea-error',
    // Pattern matching for all DaisyUI components and variants
    {
      pattern: /^(menu|btn|card|input|select|textarea|label|badge|alert|modal|drawer|dropdown|tooltip|popover|swap|stats|table|artboard|divider|footer|hero|indicator|join|link|loading|mask|progress|radial-progress|rating|stack|steps|toast|toggle|navbar|breadcrumbs|tabs|collapse|kbd|mockup-code|phone|window)/,
    },
    {
      pattern: /^(menu|btn|card|input|select|textarea|label|badge|alert|modal|drawer|dropdown|tooltip|popover|swap|stats|table|artboard|divider|footer|hero|indicator|join|link|loading|mask|progress|radial-progress|rating|stack|steps|toast|toggle|navbar|breadcrumbs|tabs|collapse|kbd|mockup-code|phone|window)-/,
    },
  ],
};

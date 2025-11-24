module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // CSS optimize'i kapat - DaisyUI CSS selector'larının korunması için
    ...(process.env.NODE_ENV === 'production' ? {} : {}),
  },
}

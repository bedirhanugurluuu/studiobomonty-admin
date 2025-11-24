# StudioBomonty Admin Panel

Bu admin panel StudioBomonty projesinin içerik yönetim sistemidir.

## 🚀 Deployment

Bu proje Vercel'de ayrı bir proje olarak deploy edilir.

### Vercel Deployment Ayarları

1. **Framework Preset**: Vite (otomatik algılanır)
2. **Build Command**: `npm run build` (otomatik)
3. **Output Directory**: `dist` (otomatik)
4. **Install Command**: `npm install` (otomatik)

### Environment Variables

Vercel dashboard'da şu environment variable'ları ekleyin:

```
VITE_API_BASE_URL=https://studiobomontyy.vercel.app
VITE_SUPABASE_URL=your_supabase_url (eğer kullanılıyorsa)
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key (eğer kullanılıyorsa)
```

**Önemli:** `VITE_API_BASE_URL` ana Next.js uygulamanızın production URL'ini işaret etmeli.

## 📦 Development

```bash
npm install
npm run dev
```

Admin panel `http://localhost:3002` adresinde çalışacak.

## 🏗️ Build

```bash
npm run build
```

Build çıktısı `dist/` klasörüne oluşturulur.

## 📝 Notlar

- Ana Next.js uygulaması `http://localhost:3000` portunda çalışmalı
- Admin panel API isteklerini `VITE_API_BASE_URL` üzerinden yapar
- Development modunda otomatik olarak `localhost:3000` kullanılır (3002 portu ignore edilir)

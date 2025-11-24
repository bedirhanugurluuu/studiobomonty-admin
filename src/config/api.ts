// Merkezi API konfigürasyonu
export const API_CONFIG = {
  // Development
  development: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    apiPath: '/api'
  },
  // Production
  production: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://studiobomontyy.vercel.app',
    apiPath: '/api'
  }
};

// Environment'a göre API URL'ini belirle
const getApiConfig = () => {
  // Debug için console.log
  console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('NODE_ENV:', import.meta.env.MODE);
  console.log('DEV:', import.meta.env.DEV);
  
  // Development modunda kontrol et
  const isDevelopment = import.meta.env.MODE === 'development' || 
                        import.meta.env.DEV;
  
  // Eğer VITE_API_BASE_URL set edilmişse
  if (import.meta.env.VITE_API_BASE_URL) {
    const viteUrl = import.meta.env.VITE_API_BASE_URL;
    
    // Development modunda ve URL localhost:3002 ise (Vite dev server), ignore et
    if (isDevelopment && (viteUrl.includes(':3002') || viteUrl.includes('localhost:3002'))) {
      console.warn('VITE_API_BASE_URL points to Vite dev server (3002), using Next.js default (3000)');
      return {
        baseURL: 'http://localhost:3000',
        apiPath: '/api'
      };
    }
    
    // Production veya doğru URL ise kullan
    console.log('Using VITE_API_BASE_URL:', viteUrl);
    return {
      baseURL: viteUrl,
      apiPath: '/api'
    };
  }
  
  // Development modunda localhost:3000 kullan, aksi halde production URL'i kullan
  const env = isDevelopment ? 'development' : 'production';
  console.log('Selected env:', env);
  const config = API_CONFIG[env as keyof typeof API_CONFIG] || API_CONFIG.development;
  console.log('Using API config:', config);
  return config;
};

// Merkezi API base URL - Always ensure absolute URL
const apiConfig = getApiConfig();
// baseURL'in sonundaki slash'ı temizle
const cleanBaseURL = apiConfig.baseURL.replace(/\/+$/, '');
// apiPath'in başındaki slash'ı temizle (zaten /api olarak tanımlı)
const cleanApiPath = apiConfig.apiPath.replace(/^\/+/, '/');
let apiBaseUrl = `${cleanBaseURL}${cleanApiPath}`;

// Ensure it's an absolute URL (starts with http:// or https://)
if (!apiBaseUrl.startsWith('http://') && !apiBaseUrl.startsWith('https://')) {
  // Fallback to localhost:3000 if somehow relative
  apiBaseUrl = `http://localhost:3000${cleanApiPath}`;
  console.warn('API_BASE_URL was relative, using fallback:', apiBaseUrl);
}

export const API_BASE_URL = apiBaseUrl;
console.log('Final API_BASE_URL:', API_BASE_URL);

// API endpoint'leri
export const API_ENDPOINTS = {
  // Auth
  auth: '/auth',
  
  // About
  about: '/about',
  aboutGallery: '/about-gallery',
  
  // Projects
  projects: '/projects',
  
  // News
  news: '/news',
  
  // Intro Banners
  introBanners: '/intro-banners',
  
  // Awards
  awards: '/awards',
  
  // Slider
  slider: '/slider',
  
  // What We Do
  whatWeDo: '/what-we-do',
  
  // Contact
  contact: '/contact',
  contactSubmissions: '/contact-submissions'
} as const;

// Tam API URL'lerini oluştur
export const getApiUrl = (endpoint: keyof typeof API_ENDPOINTS) => {
  return `${API_BASE_URL}${API_ENDPOINTS[endpoint]}`;
};

// Axios instance için base URL
export const axiosBaseURL = API_BASE_URL;

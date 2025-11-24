export interface Project {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  banner_media?: string; // backend'de banner_media olarak saklanıyor
  featured: boolean; // is_featured değil, featured
  is_featured: boolean;
  featured_order: number;
  description: string;
  client_name?: string;
  tab1?: string;
  tab2?: string;
  external_link?: string;
  gallery_images?: string[]; // galeri görselleri
  display_order?: number; // Proje sıralaması için
  created_at?: string;
  updated_at?: string;
}

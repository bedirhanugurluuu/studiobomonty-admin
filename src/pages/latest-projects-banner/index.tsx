import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../utils/api';
import { storageUtils } from '../../utils/supabaseStorage';
import Swal from 'sweetalert2';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { FormLayout } from '../../components/common/PageLayout';
import { FormInput, FormButton } from '../../components/common/FormComponents';

interface LatestProjectsBanner {
  id: string;
  title: string;
  subtitle: string;
  image_path?: string;
  created_at: string;
  updated_at: string;
}

const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads/')) {
    return `https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${path.replace('/uploads/', '')}`;
  }
  return `https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${path}`;
};

export default function LatestProjectsBannerPage() {
  const { setBreadcrumbs } = useBreadcrumb();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [banner, setBanner] = useState<LatestProjectsBanner | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImagePath, setCurrentImagePath] = useState<string>('');

  useEffect(() => {
    setBreadcrumbs([
      { name: 'Ana Sayfa', to: '/admin/dashboard' },
      { name: 'Hakkımızda', to: '/admin/about' },
      { name: 'Latest Projects Banner' }
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    fetchBanner();
  }, []);

  const fetchBanner = async () => {
    try {
      setFetching(true);
      const { data, error } = await api.latestProjectsBanner.get();
      if (error) throw error;
      if (data) {
        setBanner(data as LatestProjectsBanner);
        setTitle(data.title || 'LATEST PROJECTS');
        setSubtitle(data.subtitle || 'How to craft visual narratives that leave a lasting impact');
        setCurrentImagePath(data.image_path || '');
        if (data.image_path) {
          const imageUrl = getImageUrl(data.image_path);
          if (imageUrl) setPreviewUrl(imageUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching latest projects banner:', error);
      Swal.fire('Hata', 'Latest Projects Banner ayarları yüklenemedi', 'error');
    } finally {
      setFetching(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = async () => {
    // Eski görseli storage'dan sil
    if (currentImagePath) {
      try {
        const filename = currentImagePath.replace('/uploads/', '');
        await storageUtils.deleteFile(filename);
      } catch (error) {
        console.error('Error deleting old image:', error);
      }
    }

    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCurrentImagePath('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      Swal.fire('Hata', 'Lütfen başlığı girin', 'error');
      return;
    }

    if (!subtitle.trim()) {
      Swal.fire('Hata', 'Lütfen alt başlığı girin', 'error');
      return;
    }

    try {
      setLoading(true);
      let imagePath = currentImagePath;

      // Yeni görsel yüklenmişse
      if (file) {
        // Eski görseli sil
        if (currentImagePath) {
          try {
            const filename = currentImagePath.replace('/uploads/', '');
            await storageUtils.deleteFile(filename);
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }

        // Yeni görseli yükle
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const filename = `latest-projects-banner-${timestamp}-${Math.random().toString(36).slice(2)}.${extension}`;
        const { error: uploadError } = await storageUtils.uploadFile(file, filename);
        if (uploadError) throw uploadError;
        imagePath = `/uploads/${filename}`;
      }

      const { error } = await api.latestProjectsBanner.update({ 
        title, 
        subtitle,
        image_path: imagePath || null
      });
      if (error) throw error;

      Swal.fire('Başarılı', 'Latest Projects Banner başarıyla güncellendi', 'success');
      fetchBanner();
    } catch (error: any) {
      console.error('Error updating latest projects banner:', error);
      Swal.fire('Hata', error?.message || 'Latest Projects Banner güncellenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mediaPreview = useMemo(() => {
    if (previewUrl) {
      return (
        <div className="relative w-full max-w-md">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-auto rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
          >
            ✕
          </button>
        </div>
      );
    }
    return null;
  }, [previewUrl, currentImagePath]);

  if (fetching) {
    return (
      <FormLayout
        title="Latest Projects Banner Ayarları"
        subtitle="Latest Projects Banner başlık ve alt başlığını yönetin"
        backUrl="/admin/about"
      >
        <div className="text-center py-12">Yükleniyor...</div>
      </FormLayout>
    );
  }

  return (
    <FormLayout
      title="Latest Projects Banner Ayarları"
      subtitle="Latest Projects Banner başlık ve alt başlığını yönetin"
      backUrl="/admin/about"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          label="Başlık"
          value={title}
          onChange={(value) => setTitle(value)}
          placeholder="LATEST PROJECTS"
          required
        />

        <FormInput
          label="Alt Başlık"
          value={subtitle}
          onChange={(value) => setSubtitle(value)}
          placeholder="How to craft visual narratives that leave a lasting impact"
          required
        />

        <div className="form-control">
          <label className="label">
            <span className="label-text">Görsel</span>
          </label>
          {mediaPreview}
          {!previewUrl && (
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input file-input-bordered w-full"
            />
          )}
          {previewUrl && (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (previewUrl && previewUrl.startsWith('blob:')) {
                  URL.revokeObjectURL(previewUrl);
                }
                setPreviewUrl(null);
              }}
              className="btn mt-2"
            >
              Görseli Değiştir
            </button>
          )}
        </div>

        <FormButton type="submit" loading={loading}>
          Kaydet
        </FormButton>
      </form>
    </FormLayout>
  );
}


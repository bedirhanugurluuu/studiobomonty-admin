import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../utils/api';
import { storageUtils } from '../../utils/supabaseStorage';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { FormLayout } from '../../components/common/PageLayout';
import { FormInput, FormTextarea, FormButton, FormActions } from '../../components/common/FormComponents';

const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads/')) {
    return `https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${path.replace('/uploads/', '')}`;
  }
  return `https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${path}`;
};

export default function GalleryItemsNewPage() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumb();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { name: 'Ana Sayfa', to: '/admin/dashboard' },
      { name: 'Gallery Items', to: '/admin/gallery-items' },
      { name: 'Yeni Gallery Item' }
    ]);
  }, [setBreadcrumbs]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    display_order: 0
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setFormData({ ...formData, image: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      Swal.fire('Hata', 'Lütfen başlık girin', 'error');
      return;
    }

    if (!file && !formData.image) {
      Swal.fire('Hata', 'Lütfen bir görsel seçin', 'error');
      return;
    }

    try {
      setLoading(true);
      let imagePath = formData.image;

      if (file) {
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const filename = `gallery-${timestamp}-${Math.random().toString(36).slice(2)}.${extension}`;
        const { error: uploadError } = await storageUtils.uploadFile(file, filename);
        if (uploadError) throw uploadError;
        imagePath = `/uploads/${filename}`;
      }

      const payload = {
        title: formData.title,
        description: formData.description || null,
        image: imagePath,
        display_order: formData.display_order || 0,
      };

      const { error } = await api.galleryItems.create(payload);
      if (error) throw error;

      Swal.fire('Başarılı', 'Gallery item başarıyla oluşturuldu', 'success');
      navigate('/admin/gallery-items');
    } catch (error: any) {
      console.error('Error creating gallery item:', error);
      Swal.fire('Hata', error?.message || 'Gallery item oluşturulamadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mediaPreview = useMemo(() => {
    const url = previewUrl || (formData.image ? getImageUrl(formData.image) : null);
    if (!url) return null;
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url);
    return { url, isVideo };
  }, [previewUrl, formData.image]);

  return (
    <FormLayout
      title="Yeni Gallery Item Oluştur"
      subtitle="3D Gallery sayfasına yeni bir görsel ekleyin"
      backUrl="/admin/gallery-items"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          label="Başlık"
          value={formData.title}
          onChange={(value) => setFormData({ ...formData, title: value })}
          placeholder="örn: Creative Design"
          required
        />

        <FormTextarea
          label="Açıklama"
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="Görsel hakkında açıklama..."
          rows={4}
        />

        <FormInput
          label="Sıra Numarası"
          type="number"
          value={formData.display_order.toString()}
          onChange={(value) => setFormData({ ...formData, display_order: parseInt(value) || 0 })}
          placeholder="0"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Görsel <span className="text-red-500">*</span>
          </label>
          {mediaPreview ? (
            <div className="relative mb-4">
              {mediaPreview.isVideo ? (
                <video
                  src={mediaPreview.url}
                  controls
                  className="w-full max-w-md rounded-lg"
                />
              ) : (
                <img
                  src={mediaPreview.url}
                  alt="Preview"
                  className="w-full max-w-md rounded-lg"
                />
              )}
              <button
                type="button"
                onClick={handleRemoveImage}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Görseli Kaldır
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
          )}
        </div>

        <FormActions>
          <FormButton type="submit" loading={loading}>
            Gallery Item Oluştur
          </FormButton>
        </FormActions>
      </form>
    </FormLayout>
  );
}


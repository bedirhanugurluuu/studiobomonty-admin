import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../utils/api';
import { storageUtils } from '../../utils/supabaseStorage';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { FormLayout } from '../../components/common/PageLayout';
import { FormInput, FormButton, FormActions } from '../../components/common/FormComponents';

const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads/')) {
    return `https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${path.replace('/uploads/', '')}`;
  }
  return `https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${path}`;
};

export default function ServicesNewPage() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumb();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { name: 'Ana Sayfa', to: '/admin/dashboard' },
      { name: 'Servisler', to: '/admin/services' },
      { name: 'Yeni Servis' }
    ]);
  }, [setBreadcrumbs]);

  const [formData, setFormData] = useState({
    name: '',
    order_index: 0,
    image_path: ''
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
    setFormData({ ...formData, image_path: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      Swal.fire('Hata', 'Lütfen servis adını girin', 'error');
      return;
    }

    try {
      setLoading(true);
      let imagePath = formData.image_path;

      if (file) {
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const filename = `service-${timestamp}-${Math.random().toString(36).slice(2)}.${extension}`;
        const { error: uploadError } = await storageUtils.uploadFile(file, filename);
        if (uploadError) throw uploadError;
        imagePath = `/uploads/${filename}`;
      }

      const payload = {
        name: formData.name,
        order_index: formData.order_index,
        image_path: imagePath || null,
      };

      const { error } = await api.services.create(payload);
      if (error) throw error;

      Swal.fire('Başarılı', 'Servis başarıyla oluşturuldu', 'success');
      navigate('/admin/services');
    } catch (error: any) {
      console.error('Error creating service:', error);
      Swal.fire('Hata', error?.message || 'Servis oluşturulamadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mediaPreview = useMemo(() => {
    const url = previewUrl || (formData.image_path ? getImageUrl(formData.image_path) : null);
    if (!url) return null;
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url);
    return { url, isVideo };
  }, [previewUrl, formData.image_path]);

  return (
    <FormLayout
      title="Yeni Servis Oluştur"
      subtitle="Listeye yeni bir servis ekleyin"
      backUrl="/admin/services"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          label="Servis Adı"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value })}
          placeholder="örn: Strateji"
          required
        />

        <FormInput
          label="Sıra Numarası"
          type="number"
          value={formData.order_index.toString()}
          onChange={(value) => setFormData({ ...formData, order_index: parseInt(value) || 0 })}
          placeholder="0"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Servis Görseli/Video
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
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          )}
        </div>

        <FormActions>
          <FormButton type="submit" loading={loading}>
            Servis Oluştur
          </FormButton>
        </FormActions>
      </form>
    </FormLayout>
  );
}


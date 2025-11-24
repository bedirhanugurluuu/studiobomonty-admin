import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useNavigate } from 'react-router-dom';
import { FormLayout } from '../../components/common/PageLayout';
import { FormInput, FormButton, FormActions } from '../../components/common/FormComponents';

interface Recognition {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function RecognitionPage() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumb();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [recognition, setRecognition] = useState<Recognition | null>(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    setBreadcrumbs([
      { name: 'Ana Sayfa', to: '/admin/dashboard' },
      { name: 'Hakkımızda', to: '/admin/about' },
      { name: 'Tanınma' }
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    fetchRecognition();
  }, []);

  const fetchRecognition = async () => {
    try {
      setFetching(true);
      const { data, error } = await api.recognition.get();
      if (error) throw error;
      if (data) {
        setRecognition(data as Recognition);
        setTitle(data.title || 'Recognition');
      }
    } catch (error) {
      console.error('Error fetching recognition:', error);
      Swal.fire('Hata', 'Tanınma bilgisi yüklenemedi', 'error');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      Swal.fire('Hata', 'Lütfen başlığı girin', 'error');
      return;
    }

    try {
      setLoading(true);
      const { error } = await api.recognition.update({ title });
      if (error) throw error;

      Swal.fire('Başarılı', 'Tanınma başlığı başarıyla güncellendi', 'success');
      fetchRecognition();
    } catch (error: any) {
      console.error('Error updating recognition:', error);
      Swal.fire('Hata', error?.message || 'Tanınma bilgisi güncellenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <FormLayout
        title="Tanınma Ayarları"
        subtitle="Tanınma başlığını yönetin"
        backUrl="/admin/about"
      >
        <div className="text-center py-12">Yükleniyor...</div>
      </FormLayout>
    );
  }

  return (
    <FormLayout
      title="Tanınma Ayarları"
      subtitle="Tanınma başlığını yönetin"
      backUrl="/admin/about"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          label="Tanınma Başlığı"
          value={title}
          onChange={(value) => setTitle(value)}
          placeholder="Tanınma"
          required
        />

        <div className="flex gap-4">
          <FormButton type="submit" loading={loading}>
            Başlığı Kaydet
          </FormButton>
          <button
            type="button"
            onClick={() => navigate('/admin/recognition/items')}
            className="btn btn-secondary p-6 rounded-lg"
          >
            Tanınma Öğelerini Yönet
          </button>
        </div>
      </form>
    </FormLayout>
  );
}


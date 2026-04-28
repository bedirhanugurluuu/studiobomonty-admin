import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useNavigate } from 'react-router-dom';
import { FormLayout } from '../../components/common/PageLayout';
import { FormInput, FormButton, FormActions } from '../../components/common/FormComponents';

interface ClientsSettings {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function ClientsPage() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumb();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [clientsSettings, setClientsSettings] = useState<ClientsSettings | null>(null);
  const [title, setTitle] = useState('');
  const [showClients, setShowClients] = useState(true);

  useEffect(() => {
    setBreadcrumbs([
      { name: 'Ana Sayfa', to: '/admin/dashboard' },
      { name: 'Hakkımızda', to: '/admin/about' },
      { name: 'Müşteriler' }
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    fetchClientsSettings();
  }, []);

  const fetchClientsSettings = async () => {
    try {
      setFetching(true);
      const { data, error } = await api.clients.get();
      if (error) throw error;
      if (data) {
        setClientsSettings(data as ClientsSettings);
        setTitle(data.title || 'Clients');
      }

      const { data: aboutData, error: aboutError } = await api.about.get();
      if (!aboutError && aboutData) {
        setShowClients(aboutData.show_clients !== false);
      }
    } catch (error) {
      console.error('Error fetching clients settings:', error);
      Swal.fire('Hata', 'Müşteriler ayarları yüklenemedi', 'error');
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
      const { error } = await api.clients.update({ title });
      if (error) throw error;

      const { error: aboutError } = await api.about.update({
        show_clients: showClients,
      });
      if (aboutError) throw aboutError;

      Swal.fire('Başarılı', 'Müşteriler başlığı başarıyla güncellendi', 'success');
      fetchClientsSettings();
    } catch (error: any) {
      console.error('Error updating clients settings:', error);
      Swal.fire('Hata', error?.message || 'Müşteriler ayarları güncellenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <FormLayout
        title="Müşteriler Ayarları"
        subtitle="Müşteriler başlığını yönetin"
        backUrl="/admin/about"
      >
        <div className="text-center py-12">Yükleniyor...</div>
      </FormLayout>
    );
  }

  return (
    <FormLayout
      title="Müşteriler Ayarları"
      subtitle="Müşteriler başlığını yönetin"
      backUrl="/admin/about"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          label="Müşteriler Başlığı"
          value={title}
          onChange={(value) => setTitle(value)}
          placeholder="Clients"
          required
        />

        <label className="label cursor-pointer justify-start gap-3 border rounded-lg p-4">
          <input
            type="checkbox"
            className="checkbox checkbox-primary border border-gray-700"
            checked={showClients}
            onChange={(e) => setShowClients(e.target.checked)}
          />
          <span className="label-text font-medium text-[#121820]">Ön yüzde Müşteriler bölümünü göster</span>
        </label>

        <div className="flex gap-4">
          <FormButton type="submit" loading={loading}>
            Başlığı Kaydet
          </FormButton>
          <button
            type="button"
            onClick={() => navigate('/admin/clients/items')}
            className="btn btn-secondary p-6 rounded-lg"
          >
            Müşteri Öğelerini Yönet
          </button>
        </div>
      </form>
    </FormLayout>
  );
}


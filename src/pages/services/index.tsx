import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import PageLayout from '../../components/common/PageLayout';
import DataTable from '../../components/common/DataTable';

interface Service {
  id: string;
  name: string;
  image_path?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export default function ServicesListPage() {
  const { setBreadcrumbs } = useBreadcrumb();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setBreadcrumbs([
      { name: 'Ana Sayfa', to: '/admin/dashboard' },
      { name: 'Services' }
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await api.services.getAll();
      if (error) throw error;
      setServices(data as Service[]);
    } catch (error) {
      console.error('Error fetching services:', error);
      Swal.fire('Hata', 'Servisler yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Emin misiniz?',
      text: "Bu işlem geri alınamaz!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Evet, sil!'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await api.services.delete(id);
        if (error) throw error;
        Swal.fire('Silindi!', 'Servis başarıyla silindi.', 'success');
        fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        Swal.fire('Hata', 'Servis silinemedi', 'error');
      }
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'İsim',
      className: 'font-medium text-gray-900'
    },
    {
      key: 'order_index',
      label: 'Sıra',
      className: 'text-gray-600'
    },
    {
      key: 'image_path',
      label: 'Görsel',
      render: (value: string) => {
        if (!value) return <span className="text-gray-400">Görsel yok</span>;
        return (
          <img 
            src={value.startsWith('http') ? value : `https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${value.replace('/uploads/', '')}`}
            alt="Service"
            className="w-16 h-16 object-cover rounded"
          />
        );
      },
      className: 'text-gray-600'
    }
  ];

  return (
    <PageLayout
      title="Servisler Yönetimi"
      subtitle="Hakkımızda sayfasında gösterilen servisleri yönetin"
      showNewButton={true}
      newUrl="/admin/services/new"
      newButtonText="Yeni Servis"
    >
      <DataTable
        columns={columns}
        data={services}
        loading={loading}
        emptyMessage="Henüz servis bulunmuyor. İlk servisinizi oluşturun!"
        onEdit={(item) => window.location.href = `/admin/services/edit/${item.id}`}
        onDelete={handleDelete}
        editButtonText="Düzenle"
        deleteButtonText="Sil"
      />
    </PageLayout>
  );
}


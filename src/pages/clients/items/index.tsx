import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import Swal from 'sweetalert2';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import PageLayout from '../../../components/common/PageLayout';
import DataTable from '../../../components/common/DataTable';

interface Client {
  id: string;
  name: string;
  image_path?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export default function ClientsItemsListPage() {
  const { setBreadcrumbs } = useBreadcrumb();
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setBreadcrumbs([
      { name: 'Ana Sayfa', to: '/admin/dashboard' },
      { name: 'Hakkımızda', to: '/admin/about' },
      { name: 'Müşteriler', to: '/admin/clients' },
      { name: 'Müşteri Öğeleri' }
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await api.clientsItems.getAll();
      if (error) throw error;
      setItems(data as Client[]);
    } catch (error) {
      console.error('Error fetching clients items:', error);
      Swal.fire('Hata', 'Müşteri öğeleri yüklenemedi', 'error');
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
        const { error } = await api.clientsItems.delete(id);
        if (error) throw error;
        Swal.fire('Silindi!', 'Müşteri öğesi başarıyla silindi.', 'success');
        fetchItems();
      } catch (error) {
        console.error('Error deleting client item:', error);
        Swal.fire('Hata', 'Müşteri öğesi silinemedi', 'error');
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
      key: 'image_path',
      label: 'Görsel',
      render: (value: string) => {
        if (!value) return <span className="text-gray-400">Görsel yok</span>;
        return (
          <img 
            src={value.startsWith('http') ? value : `https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${value.replace('/uploads/', '')}`}
            alt="Client"
            className="w-16 h-16 object-cover rounded"
          />
        );
      },
      className: 'text-gray-600'
    },
    {
      key: 'order_index',
      label: 'Sıra',
      className: 'text-gray-600'
    }
  ];

  return (
    <PageLayout
      title="Müşteri Öğeleri Yönetimi"
      subtitle="Hakkımızda sayfasında gösterilen müşteri öğelerini yönetin"
      showNewButton={true}
      newUrl="/admin/clients/items/new"
      newButtonText="Yeni Müşteri Öğesi"
    >
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="Henüz müşteri öğesi bulunmuyor. İlk öğenizi oluşturun!"
        onEdit={(item) => window.location.href = `/admin/clients/items/edit/${item.id}`}
        onDelete={handleDelete}
        editButtonText="Düzenle"
        deleteButtonText="Sil"
      />
    </PageLayout>
  );
}


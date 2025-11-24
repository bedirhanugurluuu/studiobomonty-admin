import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import Swal from 'sweetalert2';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import PageLayout from '../../../components/common/PageLayout';
import DataTable from '../../../components/common/DataTable';

interface RecognitionItem {
  id: string;
  recognition_id: string;
  organization_name: string;
  awards: string[];
  counts: string[];
  order_index: number;
  created_at: string;
  updated_at: string;
}

export default function RecognitionItemsListPage() {
  const { setBreadcrumbs } = useBreadcrumb();
  const [items, setItems] = useState<RecognitionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recognitionId, setRecognitionId] = useState<string>('');

  useEffect(() => {
    setBreadcrumbs([
      { name: 'Ana Sayfa', to: '/admin/dashboard' },
      { name: 'Hakkımızda', to: '/admin/about' },
      { name: 'Tanınma', to: '/admin/recognition' },
      { name: 'Tanınma Öğeleri' }
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    fetchRecognition();
  }, []);

  const fetchRecognition = async () => {
    try {
      const { data, error } = await api.recognition.get();
      if (error) throw error;
      if (data) {
        setRecognitionId(data.id);
        fetchItems(data.id);
      }
    } catch (error) {
      console.error('Error fetching recognition:', error);
      Swal.fire('Hata', 'Tanınma bilgisi yüklenemedi', 'error');
    }
  };

  const fetchItems = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await api.recognitionItems.getAll(id);
      if (error) throw error;
      setItems(data as RecognitionItem[]);
    } catch (error) {
      console.error('Error fetching recognition items:', error);
      Swal.fire('Hata', 'Tanınma öğeleri yüklenemedi', 'error');
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
        const { error } = await api.recognitionItems.delete(id);
        if (error) throw error;
        Swal.fire('Silindi!', 'Tanınma öğesi başarıyla silindi.', 'success');
        if (recognitionId) fetchItems(recognitionId);
      } catch (error) {
        console.error('Error deleting recognition item:', error);
        Swal.fire('Hata', 'Tanınma öğesi silinemedi', 'error');
      }
    }
  };

  const columns = [
    {
      key: 'organization_name',
      label: 'Organization',
      className: 'font-medium text-gray-900'
    },
    {
      key: 'awards',
      label: 'Awards',
      render: (value: string[]) => {
        if (!value || !Array.isArray(value)) return '-';
        return value.join(', ');
      },
      className: 'text-gray-600'
    },
    {
      key: 'counts',
      label: 'Counts',
      render: (value: string[]) => {
        if (!value || !Array.isArray(value)) return '-';
        return value.join(', ');
      },
      className: 'text-gray-600'
    },
    {
      key: 'order_index',
      label: 'Order',
      className: 'text-gray-600'
    }
  ];

  return (
    <PageLayout
      title="Tanınma Öğeleri Yönetimi"
      subtitle="Hakkımızda sayfasında gösterilen tanınma öğelerini yönetin"
      showNewButton={true}
      newUrl={`/admin/recognition/items/new${recognitionId ? `?recognitionId=${recognitionId}` : ''}`}
      newButtonText="Yeni Tanınma Öğesi"
    >
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="Henüz tanınma öğesi bulunmuyor. İlk öğenizi oluşturun!"
        onEdit={(item) => window.location.href = `/admin/recognition/items/edit/${item.id}`}
        onDelete={handleDelete}
        editButtonText="Düzenle"
        deleteButtonText="Sil"
      />
    </PageLayout>
  );
}


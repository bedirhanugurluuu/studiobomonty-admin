import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import PageLayout from '../../components/common/PageLayout';
import DataTable from '../../components/common/DataTable';

interface ProjectTab {
  id: string;
  name: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export default function ProjectTabsListPage() {
  const { setBreadcrumbs } = useBreadcrumb();
  const [tabs, setTabs] = useState<ProjectTab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setBreadcrumbs([
      { name: 'Ana Sayfa', to: '/admin/dashboard' },
      { name: 'Project Tabs' }
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    fetchTabs();
  }, []);

  const fetchTabs = async () => {
    try {
      setLoading(true);
      const { data, error } = await api.projectTabs.getAll();
      if (error) throw error;
      setTabs(data as ProjectTab[]);
    } catch (error) {
      console.error('Error fetching project tabs:', error);
      Swal.fire('Hata', 'Project tablar yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Emin misiniz?',
      text: "Bu tab'ı silerseniz, bu tab'a bağlı projeler etkilenebilir!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Evet, sil!'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await api.projectTabs.delete(id);
        if (error) throw error;
        Swal.fire('Silindi!', 'Tab başarıyla silindi.', 'success');
        fetchTabs();
      } catch (error) {
        console.error('Error deleting tab:', error);
        Swal.fire('Hata', 'Tab silinemedi', 'error');
      }
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Tab Adı',
      className: 'font-medium text-gray-900'
    },
    {
      key: 'order_index',
      label: 'Sıra',
      className: 'text-gray-600'
    }
  ];

  return (
    <PageLayout
      title="Project Tabs Yönetimi"
      subtitle="Proje kategorilerini (tablar) yönetin"
      showNewButton={true}
      newUrl="/admin/project-tabs/new"
      newButtonText="Yeni Tab"
    >
      <DataTable
        columns={columns}
        data={tabs}
        loading={loading}
        emptyMessage="Henüz tab bulunmuyor. İlk tabınızı oluşturun!"
        onEdit={(item) => window.location.href = `/admin/project-tabs/edit/${item.id}`}
        onDelete={handleDelete}
        editButtonText="Düzenle"
        deleteButtonText="Sil"
      />
    </PageLayout>
  );
}


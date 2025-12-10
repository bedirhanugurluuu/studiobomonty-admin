import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';
import { useNavigate, useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { FormLayout } from '../../components/common/PageLayout';
import { FormInput, FormButton, FormActions } from '../../components/common/FormComponents';

interface ProjectTab {
  id: string;
  name: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export default function ProjectTabsEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setBreadcrumbs } = useBreadcrumb();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    setBreadcrumbs([
      { name: 'Ana Sayfa', to: '/admin/dashboard' },
      { name: 'Project Tabs', to: '/admin/project-tabs' },
      { name: 'Tab Düzenle' }
    ]);
  }, [setBreadcrumbs]);

  const [formData, setFormData] = useState({
    name: '',
    order_index: 0
  });

  useEffect(() => {
    if (id) {
      fetchTab();
    }
  }, [id]);

  const fetchTab = async () => {
    try {
      setFetching(true);
      const { data, error } = await api.projectTabs.getById(id!);
      if (error) throw error;
      const tab = data as ProjectTab;
      setFormData({
        name: tab.name,
        order_index: tab.order_index
      });
    } catch (error) {
      console.error('Error fetching tab:', error);
      Swal.fire('Hata', 'Tab yüklenemedi', 'error');
      navigate('/admin/project-tabs');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      Swal.fire('Hata', 'Lütfen tab adını girin', 'error');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        order_index: formData.order_index
      };

      const { error } = await api.projectTabs.update(id!, payload);
      if (error) throw error;

      Swal.fire('Başarılı', 'Tab başarıyla güncellendi', 'success');
      navigate('/admin/project-tabs');
    } catch (error: any) {
      console.error('Error updating tab:', error);
      Swal.fire('Hata', error?.message || 'Tab güncellenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <FormLayout
        title="Tab Düzenle"
        subtitle="Tab bilgilerini güncelleyin"
        backUrl="/admin/project-tabs"
      >
        <div className="text-center py-12">Yükleniyor...</div>
      </FormLayout>
    );
  }

  return (
    <FormLayout
      title="Tab Düzenle"
      subtitle="Tab bilgilerini güncelleyin"
      backUrl="/admin/project-tabs"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          label="Tab Adı"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value })}
          placeholder="örn: Branding, Digital, Print"
          required
        />

        <FormInput
          label="Sıra Numarası"
          type="number"
          value={formData.order_index.toString()}
          onChange={(value) => setFormData({ ...formData, order_index: parseInt(value) || 0 })}
          placeholder="0"
        />

        <FormActions>
          <FormButton type="submit" loading={loading}>
            Tab'ı Güncelle
          </FormButton>
        </FormActions>
      </form>
    </FormLayout>
  );
}


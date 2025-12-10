import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { FormLayout } from '../../components/common/PageLayout';
import { FormInput, FormButton, FormActions } from '../../components/common/FormComponents';

export default function ProjectTabsNewPage() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumb();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBreadcrumbs([
      { name: 'Ana Sayfa', to: '/admin/dashboard' },
      { name: 'Project Tabs', to: '/admin/project-tabs' },
      { name: 'Yeni Tab' }
    ]);
  }, [setBreadcrumbs]);

  const [formData, setFormData] = useState({
    name: '',
    order_index: 0
  });

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

      const { error } = await api.projectTabs.create(payload);
      if (error) throw error;

      Swal.fire('Başarılı', 'Tab başarıyla oluşturuldu', 'success');
      navigate('/admin/project-tabs');
    } catch (error: any) {
      console.error('Error creating tab:', error);
      Swal.fire('Hata', error?.message || 'Tab oluşturulamadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormLayout
      title="Yeni Tab"
      subtitle="Yeni bir proje kategorisi (tab) oluşturun"
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
            Tab Oluştur
          </FormButton>
        </FormActions>
      </form>
    </FormLayout>
  );
}


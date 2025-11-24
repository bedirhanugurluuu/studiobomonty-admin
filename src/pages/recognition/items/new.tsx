import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../../utils/api';
import Swal from 'sweetalert2';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { FormLayout } from '../../../components/common/PageLayout';
import { FormInput, FormButton, FormActions } from '../../../components/common/FormComponents';

export default function RecognitionItemsNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recognitionId = searchParams.get('recognitionId') || '';
  const { setBreadcrumbs } = useBreadcrumb();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    organization_name: string;
    awards: string[];
    counts: string[];
    order_index: number;
    recognition_id?: string;
  }>({
    organization_name: '',
    awards: [''],
    counts: [''],
    order_index: 0,
  });

  useEffect(() => {
    setBreadcrumbs([
      { name: 'Ana Sayfa', to: '/admin/dashboard' },
      { name: 'Hakkımızda', to: '/admin/about' },
      { name: 'Tanınma', to: '/admin/recognition' },
      { name: 'Tanınma Öğeleri', to: '/admin/recognition/items' },
      { name: 'Yeni Tanınma Öğesi' }
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    if (!recognitionId) {
      fetchRecognitionId();
    }
  }, []);

  const fetchRecognitionId = async () => {
    try {
      const { data, error } = await api.recognition.get();
      if (error) throw error;
      if (data) {
        // recognitionId state'ini güncelle
        setFormData(prev => ({ ...prev, recognition_id: data.id }));
      }
    } catch (error) {
      console.error('Error fetching recognition:', error);
    }
  };

  const handleAwardChange = (index: number, value: string) => {
    const newAwards = [...formData.awards];
    newAwards[index] = value;
    setFormData({ ...formData, awards: newAwards });
  };

  const handleCountChange = (index: number, value: string) => {
    const newCounts = [...formData.counts];
    newCounts[index] = value;
    setFormData({ ...formData, counts: newCounts });
  };

  const addAwardRow = () => {
    setFormData({
      ...formData,
      awards: [...formData.awards, ''],
      counts: [...formData.counts, '']
    });
  };

  const removeAwardRow = (index: number) => {
    const newAwards = formData.awards.filter((_, i) => i !== index);
    const newCounts = formData.counts.filter((_, i) => i !== index);
    setFormData({ ...formData, awards: newAwards, counts: newCounts });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.organization_name.trim()) {
      Swal.fire('Hata', 'Lütfen organizasyon adını girin', 'error');
      return;
    }

    // Boş award ve count'ları filtrele
    const filteredAwards = formData.awards.filter(a => a.trim() !== '');
    const filteredCounts = formData.counts.filter((c, i) => formData.awards[i]?.trim() !== '');

    if (filteredAwards.length === 0) {
      Swal.fire('Hata', 'Lütfen en az bir ödül ekleyin', 'error');
      return;
    }

    if (filteredAwards.length !== filteredCounts.length) {
      Swal.fire('Hata', 'Her ödül için bir sayı belirtilmelidir', 'error');
      return;
    }

    try {
      setLoading(true);
      const finalRecognitionId = recognitionId || formData.recognition_id;
      if (!finalRecognitionId) {
        throw new Error('Tanınma ID gerekli');
      }

      const payload = {
        recognition_id: finalRecognitionId,
        organization_name: formData.organization_name,
        awards: filteredAwards,
        counts: filteredCounts,
        order_index: formData.order_index,
      };

      const { error } = await api.recognitionItems.create(payload);
      if (error) throw error;

      Swal.fire('Başarılı', 'Tanınma öğesi başarıyla oluşturuldu', 'success');
      navigate('/admin/recognition/items');
    } catch (error: any) {
      console.error('Error creating recognition item:', error);
      Swal.fire('Hata', error?.message || 'Tanınma öğesi oluşturulamadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormLayout
      title="Yeni Tanınma Öğesi Oluştur"
      subtitle="Yeni bir tanınma öğesi ekleyin"
      backUrl="/admin/recognition/items"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          label="Organizasyon Adı"
          value={formData.organization_name}
          onChange={(value) => setFormData({ ...formData, organization_name: value })}
          placeholder="örn: Awwwards"
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
            Ödüller & Sayılar
          </label>
          <div className="space-y-4">
            {formData.awards.map((award, index) => (
              <div key={index} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Ödül {index + 1}</label>
                  <input
                    type="text"
                    value={award}
                    onChange={(e) => handleAwardChange(index, e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="örn: Site of the day"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-gray-600 mb-1">Sayı</label>
                  <input
                    type="text"
                    value={formData.counts[index] || ''}
                    onChange={(e) => handleCountChange(index, e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="örn: x10"
                  />
                </div>
                {formData.awards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAwardRow(index)}
                    className="btn btn-error btn-sm"
                  >
                    Kaldır
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addAwardRow}
              className="btn btn-sm"
            >
              + Ödül Ekle
            </button>
          </div>
        </div>

        <FormActions>
          <FormButton type="submit" loading={loading}>
            Tanınma Öğesi Oluştur
          </FormButton>
        </FormActions>
      </form>
    </FormLayout>
  );
}


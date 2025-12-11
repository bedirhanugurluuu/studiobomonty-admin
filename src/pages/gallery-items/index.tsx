import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import PageLayout from '../../components/common/PageLayout';
import DataTable from '../../components/common/DataTable';

interface GalleryItem {
  id: string;
  image: string;
  title: string;
  description?: string;
  display_order?: number;
  created_at: string;
  updated_at: string;
}

const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads/')) {
    return `https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${path.replace('/uploads/', '')}`;
  }
  return `https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${path}`;
};

type SortOrder = 'asc' | 'desc';

export default function GalleryItemsListPage() {
  const { setBreadcrumbs } = useBreadcrumb();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setBreadcrumbs([
      { name: 'Ana Sayfa', to: '/admin/dashboard' },
      { name: 'Gallery Items' }
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await api.galleryItems.getAll();
      if (error) throw error;
      setItems(data as GalleryItem[]);
    } catch (error) {
      Swal.fire('Hata', 'Gallery items yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: GalleryItem | string) => {
    // Extract id from item (can be object or string)
    const id = typeof item === 'string' ? item : item.id;
    
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
        const { error } = await api.galleryItems.delete(id);
        if (error) {
          throw new Error((error as any)?.message || 'Gallery item silinemedi');
        }
        Swal.fire('Silindi!', 'Gallery item ve görseli başarıyla silindi.', 'success');
        fetchItems();
      } catch (error: any) {
        Swal.fire(
          'Hata', 
          error?.message || 'Gallery item silinemedi. Lütfen tekrar deneyin.', 
          'error'
        );
      }
    }
  };

  // Filtered and sorted items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items;

    // Filter by title
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by created_at
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [items, searchTerm, sortOrder]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedItems.slice(startIndex, endIndex);
  }, [filteredAndSortedItems, currentPage]);

  // Total pages
  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);

  // Reset to first page when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder]);

  const columns = [
    {
      key: 'image',
      label: 'Görsel',
      render: (value: string) => {
        if (!value) return <span className="text-gray-400">Görsel yok</span>;
        const imageUrl = getImageUrl(value);
        return (
          <img 
            src={imageUrl || ''}
            alt="Gallery"
            className="w-16 h-16 object-cover rounded"
          />
        );
      },
      className: 'text-gray-600'
    },
    {
      key: 'title',
      label: 'Başlık',
      className: 'font-medium text-gray-900'
    },
    {
      key: 'description',
      label: 'Açıklama',
      render: (value: string) => {
        if (!value) return <span className="text-gray-400">-</span>;
        return <span className="text-gray-600">{value.length > 50 ? value.substring(0, 50) + '...' : value}</span>;
      },
      className: 'text-gray-600'
    },
    {
      key: 'display_order',
      label: 'Sıra',
      className: 'text-gray-600'
    }
  ];

  return (
    <PageLayout
      title="Gallery Items Yönetimi"
      subtitle="3D Gallery sayfasında gösterilecek görselleri yönetin"
      showNewButton={true}
      newUrl="/admin/gallery-items/new"
      newButtonText="Yeni Gallery Item"
    >
      {/* Search and Sort Controls */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Başlık ile Ara
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Başlık yazın..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sıralama
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="desc">Sondan Başa</option>
              <option value="asc">Baştan Sona</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          Toplam {filteredAndSortedItems.length} item bulundu
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={paginatedItems}
        loading={loading}
        emptyMessage={searchTerm ? "Arama sonucu bulunamadı." : "Henüz gallery item bulunmuyor. İlk item'ınızı oluşturun!"}
        onEdit={(item) => window.location.href = `/admin/gallery-items/edit/${item.id}`}
        onDelete={handleDelete}
        editButtonText="Düzenle"
        deleteButtonText="Sil"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Sayfa {currentPage} / {totalPages} (Toplam {filteredAndSortedItems.length} item)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Önceki
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return <span key={page} className="px-2">...</span>;
                }
                return null;
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sonraki
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}


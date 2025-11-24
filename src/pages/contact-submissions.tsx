import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import PageLayout from '../components/common/PageLayout';
import DataTable from '../components/common/DataTable';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config/api';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export default function ContactSubmissionsPage() {
  const { setBreadcrumbs } = useBreadcrumb();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setBreadcrumbs([
      { name: 'Ana Sayfa', to: '/admin/dashboard' },
      { name: 'İletişim Formu', to: '/admin/contact-submissions' },
    ]);
  }, [setBreadcrumbs]);

  const isFetchingRef = useRef(false);
  const hasShownErrorRef = useRef(false);

  const fetchSubmissions = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }
    
    isFetchingRef.current = true;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter === 'read') {
        params.append('is_read', 'true');
      } else if (filter === 'unread') {
        params.append('is_read', 'false');
      }
      params.append('limit', '100');
      params.append('offset', '0');

      // Ensure absolute URL (prevent Vite dev server from intercepting)
      let apiUrl = `${API_BASE_URL}/contact-submissions?${params.toString()}`;
      
      // Double check: If URL doesn't start with http, make it absolute
      if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
        // Fallback: use localhost:3000 directly
        apiUrl = `http://localhost:3000/api/contact-submissions?${params.toString()}`;
        console.warn('API URL was relative, using fallback:', apiUrl);
      }
      
      console.log('Fetching from:', apiUrl);
      console.log('API_BASE_URL:', API_BASE_URL);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 200));
        throw new Error(`API returned non-JSON response. Status: ${response.status}. This usually means the API endpoint doesn't exist or Next.js is not running.`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}: Failed to fetch submissions`);
      }

      const data = await response.json();
      setSubmissions(data.data || []);
      setTotalCount(data.count || 0);
      hasShownErrorRef.current = false; // Reset error flag on success
    } catch (error) {
      console.error('Error fetching submissions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Connection refused veya HTML response hatası için özel mesaj
      // Sadece ilk hatada göster (React StrictMode double-invoke için)
      if ((errorMessage.includes('Failed to fetch') || 
          errorMessage.includes('ERR_CONNECTION_REFUSED') ||
          errorMessage.includes('non-JSON response') ||
          errorMessage.includes('Unexpected token')) && !hasShownErrorRef.current) {
        hasShownErrorRef.current = true;
        Swal.fire({
          icon: 'error',
          title: 'Bağlantı Hatası',
          html: `
            <p>Next.js API'ye bağlanılamıyor veya endpoint bulunamadı.</p>
            <p class="text-sm mt-2">Lütfen şunları kontrol edin:</p>
            <ul class="text-sm text-left mt-2">
              <li>• Next.js uygulaması çalışıyor mu? (npm run dev)</li>
              <li>• Next.js hangi port'ta çalışıyor? (varsayılan: 3000)</li>
              <li>• API URL: <code>${API_BASE_URL}/contact-submissions</code></li>
              <li>• Browser'da <a href="${API_BASE_URL}/contact-submissions" target="_blank">bu linki</a> açarak test edin</li>
            </ul>
            <p class="text-xs mt-4 text-gray-500">Hata: ${errorMessage}</p>
          `,
        });
      } else if (!errorMessage.includes('non-JSON response') && !hasShownErrorRef.current) {
        // Non-JSON response hatası dışındaki hatalar için
        hasShownErrorRef.current = true;
        Swal.fire({
          icon: 'error',
          title: 'Hata',
          text: `Mesajlar yüklenirken bir hata oluştu: ${errorMessage}`,
        });
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [filter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/contact-submissions?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: !isRead }),
      });

      if (!response.ok) {
        throw new Error('Failed to update submission');
      }

      // Update local state
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === id ? { ...sub, is_read: !isRead } : sub
        )
      );

      Swal.fire({
        icon: 'success',
        title: 'Başarılı',
        text: isRead ? 'Mesaj okunmadı olarak işaretlendi.' : 'Mesaj okundu olarak işaretlendi.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error updating submission:', error);
      Swal.fire({
        icon: 'error',
        title: 'Hata',
        text: 'Mesaj güncellenirken bir hata oluştu.',
      });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Emin misiniz?',
      text: 'Bu mesajı silmek istediğinize emin misiniz?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Evet, sil',
      cancelButtonText: 'İptal',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_BASE_URL}/contact-submissions?id=${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete submission');
        }

        // Remove from local state
        setSubmissions((prev) => prev.filter((sub) => sub.id !== id));
        setTotalCount((prev) => prev - 1);

        Swal.fire({
          icon: 'success',
          title: 'Silindi',
          text: 'Mesaj başarıyla silindi.',
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error('Error deleting submission:', error);
        Swal.fire({
          icon: 'error',
          title: 'Hata',
          text: 'Mesaj silinirken bir hata oluştu.',
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      key: 'name',
      label: 'İsim',
      render: (value: any, item: ContactSubmission) => (
        <div className="text-[#3b3b3b] font-medium">{item.name}</div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (value: any, item: ContactSubmission) => (
        <a
          href={`mailto:${item.email}`}
          className="text-blue-500 hover:underline"
        >
          {item.email}
        </a>
      ),
    },
    {
      key: 'message',
      label: 'Mesaj',
      render: (value: any, item: ContactSubmission) => (
        <button
          onClick={() => {
            Swal.fire({
              title: 'Mesaj Detayı',
              html: `
                <div class="text-left">
                  <p class="mb-2"><strong>Gönderen:</strong> ${item.name}</p>
                  <p class="mb-2"><strong>Email:</strong> ${item.email}</p>
                  <p class="mb-2"><strong>Tarih:</strong> ${formatDate(item.created_at)}</p>
                  <p class="mb-2"><strong>Mesaj:</strong></p>
                  <p class="bg-gray-100 p-3 rounded whitespace-pre-wrap">${item.message}</p>
                </div>
              `,
              width: '600px',
              showCloseButton: true,
              showConfirmButton: true,
              confirmButtonText: 'Kapat',
            });
          }}
          className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
        >
          Mesajı Gör
        </button>
      ),
    },
    {
      key: 'is_read',
      label: 'Durum',
      render: (value: any, item: ContactSubmission) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            item.is_read
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {item.is_read ? 'Okundu' : 'Okunmadı'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Tarih',
      render: (value: any, item: ContactSubmission) => (
        <div className="text-sm text-gray-500">
          {formatDate(item.created_at)}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'İşlemler',
      render: (value: any, item: ContactSubmission) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleMarkAsRead(item.id, item.is_read)}
            className={`px-3 py-1 text-xs rounded ${
              item.is_read
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {item.is_read ? 'Okunmadı Yap' : 'Okundu Yap'}
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="px-3 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
          >
            Sil
          </button>
          <button
            onClick={() => {
              Swal.fire({
                title: item.name,
                html: `
                  <div class="text-left">
                    <p class="mb-2"><strong>Email:</strong> ${item.email}</p>
                    <p class="mb-2"><strong>Tarih:</strong> ${formatDate(item.created_at)}</p>
                    <p class="mb-2"><strong>Mesaj:</strong></p>
                    <p class="bg-gray-100 p-3 rounded">${item.message}</p>
                  </div>
                `,
                width: '600px',
                showCloseButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Kapat',
              });
            }}
            className="px-3 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Detay
          </button>
        </div>
      ),
    },
  ];

  const unreadCount = submissions.filter((s) => !s.is_read).length;
  const readCount = submissions.filter((s) => s.is_read).length;

  return (
    <PageLayout title="İletişim Formu">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Toplam</div>
            <div className="text-2xl text-[#3b3b3b] font-bold">{totalCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Okunmadı</div>
            <div className="text-2xl font-bold text-yellow-600">{unreadCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Okundu</div>
            <div className="text-2xl font-bold text-green-600">{readCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Filtre</div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'read' | 'unread')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Tümü</option>
              <option value="unread">Okunmadı</option>
              <option value="read">Okundu</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-8">Yükleniyor...</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Henüz mesaj bulunmuyor.
          </div>
        ) : (
          <DataTable columns={columns} data={submissions} showActions={false} />
        )}
      </div>
    </PageLayout>
  );
}


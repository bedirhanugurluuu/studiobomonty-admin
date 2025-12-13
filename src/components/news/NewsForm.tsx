import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../../utils/api';
import { storageUtils } from '../../utils/supabaseStorage';
import LoadingSpinner from '../common/LoadingSpinner';
import Swal from 'sweetalert2';

interface NewsFormData {
  title: string;
  category_text: string;
  slug: string;
  content: string;
  image_path?: string;
}

export default function NewsForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    category_text: 'DESIGN',
    slug: '',
    content: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [originalContent, setOriginalContent] = useState<string>('');
  const quillRef = useRef<ReactQuill>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Görsel yükleme handler'ı (React Quill için)
  const imageHandler = useCallback(() => {
    if (!imageInputRef.current) return;
    imageInputRef.current.click();
  }, []);

  // React Quill modül yapılandırması (memoize edilmiş)
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false,
    }
  }), [imageHandler]);

  const formats = useMemo(() => [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'link', 'image'
  ], []);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya tipini kontrol et
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: 'Lütfen bir görsel dosyası seçin.',
      });
      return;
    }

    setUploadingImage(true);
    
    try {
      // Temp klasörüne yükle
      const { data, error: uploadError, publicUrl } = await storageUtils.uploadTempImage(file);
      
      if (uploadError || !publicUrl) {
        throw uploadError || new Error('Görsel yüklenemedi');
      }

      // React Quill editor'a görseli ekle
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection(true);
        if (range) {
          quill.insertEmbed(range.index, 'image', publicUrl);
          quill.setSelection({ index: range.index + 1, length: 0 });
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'Başarılı!',
        text: 'Görsel geçici olarak yüklendi. İçeriği kaydettiğinizde kalıcı hale gelecektir.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error('Görsel yükleme hatası:', err);
      Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: err.message || 'Görsel yüklenirken hata oluştu.',
      });
    } finally {
      setUploadingImage(false);
      // Input'u temizle
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (isEditing) {
      fetchNews();
    }
  }, [id]);

  const fetchNews = async () => {
    try {
      setFetching(true);
      const { data, error } = await api.news.getById(id!);
      if (error) throw error;
      const news = data;
      
      setFormData({
        title: news.title || '',
        category_text: news.category_text || 'DESIGN',
        slug: news.slug || '',
        content: news.content || '',
        image_path: news.image_path || '',
      });
      
      // Eski içeriği sakla
      setOriginalContent(news.content || '');
      
      if (news.image_path) {
        setCurrentImage(`https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${news.image_path}`);
      }
    } catch (err) {
      setError('News yüklenirken hata oluştu');
      console.error('Error fetching news:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleContentChange = useCallback((content: string) => {
    setFormData(prev => ({ ...prev, content: content || '' }));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setCurrentImage(URL.createObjectURL(file));
    }
  };

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.slug) {
      setError('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let newImagePath = formData.image_path;
      let finalContent = formData.content;
      let journalId = id;

      // Yeni resim yüklendiyse (banner image)
      if (imageFile) {
        const timestamp = Date.now();
        const fileName = `news-${timestamp}-${Math.random().toString(36).substring(2)}.${imageFile.name.split('.').pop()}`;
        
        const { data: uploadData, error: uploadError } = await storageUtils.uploadFile(imageFile, fileName);
        if (uploadError) throw uploadError;
        
        newImagePath = fileName;
      }

      // İçerik kaydedilmeden önce temp görselleri kalıcı klasöre taşı
      if (isEditing && id) {
        // Mevcut kayıt için temp görselleri taşı
        const { updatedContent, error: moveError } = await storageUtils.moveTempImagesToPermanent(
          formData.content,
          id
        );
        
        if (moveError) {
          console.warn('Temp görseller taşınırken hata:', moveError);
          // Hata olsa bile devam et
        } else {
          finalContent = updatedContent;
        }
      }

      // Form data'yı güncelle
      const updateData = {
        ...formData,
        content: finalContent,
        image_path: newImagePath
      };

      if (isEditing) {
        const { data, error } = await api.news.update(id!, updateData);
        if (error) throw error;
        
        // Güncelleme sonrası temp görselleri taşı (eğer daha önce taşınmadıysa)
        if (!journalId) {
          journalId = data?.id?.toString();
        }
        
        if (journalId) {
          const { updatedContent: finalUpdatedContent, error: moveError } = await storageUtils.moveTempImagesToPermanent(
            finalContent,
            journalId
          );
          
          if (!moveError && finalUpdatedContent !== finalContent) {
            // İçerik güncellendi, tekrar kaydet
            await api.news.update(id!, {
              ...updateData,
              content: finalUpdatedContent
            });
          }
        }
        
        setOriginalContent(finalContent);
      } else {
        // Yeni kayıt oluştur
        const { data, error } = await api.news.create(updateData);
        if (error) throw error;
        
        // Yeni kayıt oluşturulduktan sonra temp görselleri kalıcı klasöre taşı
        const newJournalId = data?.id?.toString();
        if (newJournalId) {
          const { updatedContent: finalUpdatedContent, error: moveError } = await storageUtils.moveTempImagesToPermanent(
            finalContent,
            newJournalId
          );
          
          if (!moveError && finalUpdatedContent !== finalContent) {
            // İçerik güncellendi, tekrar kaydet
            await api.news.update(newJournalId, {
              ...updateData,
              content: finalUpdatedContent
            });
          }
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'Başarılı!',
        text: isEditing ? 'Makale güncellendi.' : 'Makale oluşturuldu.',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        navigate('/admin/news');
      });
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
      console.error('Error saving news:', err);
      Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: err.message || 'Kayıt sırasında bir hata oluştu.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Haber Makalesini Düzenle' : 'Yeni Haber Makalesi Ekle'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Başlık *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Makale başlığı"
              required
            />
          </div>

          {/* Category Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori Metni *
            </label>
            <input
              type="text"
              name="category_text"
              value={formData.category_text}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="örn: TASARIM, SANAT YÖNETİMİ"
              required
            />
          </div>
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL Kodu *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="makale-url-kodu"
              required
            />
            <button
              type="button"
              onClick={generateSlug}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Oluştur
            </button>
          </div>
        </div>

        {/* Content - React Quill Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            İçerik
          </label>
          
          {uploadingImage && (
            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              Görsel yükleniyor...
            </div>
          )}
          
          <div className="bg-white">
            {!fetching && (
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={formData.content || ''}
                onChange={handleContentChange}
                modules={modules}
                formats={formats}
                placeholder="Makale içeriğini buraya yazın..."
                style={{ minHeight: '400px' }}
                key={isEditing ? `quill-${id}` : 'quill-new'}
                bounds="self"
                preserveWhitespace
              />
            )}
            {fetching && (
              <div className="min-h-[400px] flex items-center justify-center border border-gray-300 rounded">
                <LoadingSpinner />
              </div>
            )}
          </div>
          
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
            className="hidden"
          />
          
          <div className="mt-2 text-sm text-gray-600">
            <p>💡 İpucu: Editörde görsel eklemek için toolbar'daki görsel butonunu kullanın. Görseller geçici olarak yüklenir ve içeriği kaydettiğinizde kalıcı hale gelir.</p>
          </div>
        </div>

        {/* Image (Banner) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Banner Görseli
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {currentImage && (
            <div className="mt-2">
              <img
                src={currentImage}
                alt="Önizleme"
                className="w-32 h-32 object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor...' : (isEditing ? 'Güncelle' : 'Oluştur')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/news')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md transition-colors"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
}

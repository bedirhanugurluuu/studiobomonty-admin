import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // HTML toolbar fonksiyonu
  const insertHTML = (openTag: string, closeTag: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    
    const newContent = 
      formData.content.substring(0, start) + 
      openTag + selectedText + closeTag + 
      formData.content.substring(end);
    
    setFormData(prev => ({ ...prev, content: newContent }));
    
    // Cursor pozisyonunu ayarla
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          start + openTag.length,
          end + openTag.length
        );
      }
    }, 0);
  };

  // Template ekleme fonksiyonu
  const insertTemplate = (templateType: 'text-only' | 'with-image') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    let template = '';
    
    if (templateType === 'text-only') {
      // Başlık - Yazı - Başlık - Yazı şeklinde
      template = '<h2>Başlık 1</h2>\n<p>Buraya yazınızı yazın...</p>\n\n<h2>Başlık 2</h2>\n<p>Buraya yazınızı yazın...</p>\n\n<h2>Başlık 3</h2>\n<p>Buraya yazınızı yazın...</p>';
    } else {
      // Başlık - Yazı - Görsel şeklinde
      template = '<h2>Başlık 1</h2>\n<p>Buraya yazınızı yazın...</p>\n<p><img src="GÖRSEL_URL_BURAYA" alt="Görsel açıklaması" style="max-width: 100%; height: auto; margin: 20px 0;" /></p>\n\n<h2>Başlık 2</h2>\n<p>Buraya yazınızı yazın...</p>\n<p><img src="GÖRSEL_URL_BURAYA" alt="Görsel açıklaması" style="max-width: 100%; height: auto; margin: 20px 0;" /></p>\n\n<h2>Başlık 3</h2>\n<p>Buraya yazınızı yazın...</p>\n<p><img src="GÖRSEL_URL_BURAYA" alt="Görsel açıklaması" style="max-width: 100%; height: auto; margin: 20px 0;" /></p>';
    }
    
    // Mevcut içeriği al
    const currentContent = formData.content || '';
    
    // Template'i mevcut içeriğin sonuna ekle
    const separator = currentContent.trim() ? '\n\n' : '';
    const newContent = 
      formData.content.substring(0, start) + 
      separator + 
      template + 
      formData.content.substring(end);
    
    setFormData(prev => ({ ...prev, content: newContent }));
    
    // Cursor'ı template'in sonuna taşı
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = start + separator.length + template.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }, 0);
  };

  // Görsel yükleme fonksiyonu
  const handleImageUpload = async () => {
    if (!imageInputRef.current) return;
    
    imageInputRef.current.click();
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    
    try {
      // Supabase Storage'a yükle
      const timestamp = Date.now();
      const fileName = `news-content-${timestamp}-${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`;
      
      const { data: uploadData, error: uploadError } = await storageUtils.uploadFile(file, fileName);
      if (uploadError) throw uploadError;

      // Public URL'i al
      const publicUrl = `https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${fileName}`;
      
      // HTML img tag'ini oluştur
      const imgTag = `<img src="${publicUrl}" alt="Görsel" style="max-width: 100%; height: auto; margin: 20px 0;" />`;
      
      // Cursor pozisyonuna ekle
      if (!textareaRef.current) return;
      
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Eğer cursor pozisyonunda metin varsa, önce satır sonu ekle
      const beforeCursor = formData.content.substring(0, start);
      const afterCursor = formData.content.substring(end);
      const needsNewLine = beforeCursor.trim() && !beforeCursor.endsWith('\n');
      const needsNewLineAfter = afterCursor.trim() && !afterCursor.startsWith('\n');
      
      const separatorBefore = needsNewLine ? '\n\n' : '';
      const separatorAfter = needsNewLineAfter ? '\n\n' : '';
      
      const newContent = 
        formData.content.substring(0, start) + 
        separatorBefore + 
        imgTag + 
        separatorAfter + 
        formData.content.substring(end);
      
      setFormData(prev => ({ ...prev, content: newContent }));
      
      // Cursor'ı görselin sonuna taşı
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = start + separatorBefore.length + imgTag.length + separatorAfter.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);

      Swal.fire({
        icon: 'success',
        title: 'Başarılı!',
        text: 'Görsel başarıyla yüklendi ve editöre eklendi.',
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
      
      console.log('=== NEWS FETCH DEBUG ===');
      console.log('News data:', news);
      console.log('Image path from DB:', news.image_path);
      
      setFormData({
        title: news.title || '',
        category_text: news.category_text || 'DESIGN',
        slug: news.slug || '',
        content: news.content || '',
        image_path: news.image_path || '',
      });
      
      if (news.image_path) {
        setCurrentImage(`https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${news.image_path}`);
      }
      
      console.log('=== END NEWS FETCH DEBUG ===');
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

      // Yeni resim yüklendiyse
      if (imageFile) {
        console.log('=== NEWS RESİM İŞLEMİ BAŞLADI ===');
        console.log('FormData image_path:', formData.image_path);
        console.log('Is editing:', isEditing);
        console.log('Image file:', imageFile.name);
        
        // Eski resmi sil (eğer varsa)
        if (isEditing && formData.image_path) {
          console.log('=== NEWS RESİM SİLME İŞLEMİ ===');
          console.log('Eski resim path:', formData.image_path);
          console.log('Silme işlemi başlıyor...');
          await storageUtils.deleteFile(formData.image_path);
          console.log('=== SİLME İŞLEMİ TAMAMLANDI ===');
        }
        
        // Yeni resmi yükle
        const timestamp = Date.now();
        const fileName = `news-${timestamp}-${Math.random().toString(36).substring(2)}.${imageFile.name.split('.').pop()}`;
        console.log('Yeni resim yükleniyor:', fileName);
        
        const { data: uploadData, error: uploadError } = await storageUtils.uploadFile(imageFile, fileName);
        if (uploadError) throw uploadError;
        
        newImagePath = fileName;
        console.log('Resim yüklendi:', newImagePath);
        console.log('=== NEWS RESİM İŞLEMİ BİTTİ ===');
      }

      // Form data'yı güncelle
      const updateData = {
        ...formData,
        image_path: newImagePath
      };

      if (isEditing) {
        const { error } = await api.news.update(id!, updateData);
        if (error) throw error;
      } else {
        const { error } = await api.news.create(updateData);
        if (error) throw error;
      }

      navigate('/admin/news');
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
      console.error('Error saving news:', err);
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

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            İçerik
          </label>
          
          {/* HTML Toolbar */}
          <div className="mb-2 p-2 bg-gray-50 border border-gray-300 rounded-t-md html-toolbar">
            <div className="flex flex-wrap gap-2 text-black">
              <button
                type="button"
                onClick={() => insertHTML('<strong>', '</strong>')}
                className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                title="Kalın"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onClick={() => insertHTML('<em>', '</em>')}
                className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                title="İtalik"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                onClick={() => insertHTML('<u>', '</u>')}
                className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                title="Altı Çizili"
              >
                <u>U</u>
              </button>
              <button
                type="button"
                onClick={() => insertHTML('<h2>', '</h2>')}
                className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                title="Başlık 2"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertHTML('<h3>', '</h3>')}
                className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                title="Başlık 3"
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => insertHTML('<ul><li>', '</li></ul>')}
                className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                title="Madde Listesi"
              >
                • Liste
              </button>
              <button
                type="button"
                onClick={() => insertHTML('<ol><li>', '</li></ol>')}
                className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                title="Numaralı Liste"
              >
                1. Liste
              </button>
              <button
                type="button"
                onClick={() => insertHTML('<p>', '</p>')}
                className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                title="Paragraf"
              >
                P
              </button>
              <button
                type="button"
                onClick={() => insertHTML('<blockquote>', '</blockquote>')}
                className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                title="Alıntı"
              >
                "
              </button>
              
              {/* Görsel Yükleme ve Template Butonları */}
              <div className="border-l border-gray-300 pl-2 ml-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleImageUpload}
                  disabled={uploadingImage}
                  className="px-3 py-1 text-sm bg-green-500 text-white border border-green-600 rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Görsel Yükle"
                >
                  {uploadingImage ? '⏳ Yükleniyor...' : '🖼️ Görsel Yükle'}
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                
                {/* Template Butonları */}
                <button
                  type="button"
                  onClick={() => insertTemplate('text-only')}
                  className="px-3 py-1 text-xs bg-blue-500 text-white border border-blue-600 rounded hover:bg-blue-600 transition-colors"
                  title="Başlık - Yazı Template'i"
                >
                  📝 Başlık-Yazı
                </button>
                <button
                  type="button"
                  onClick={() => insertTemplate('with-image')}
                  className="px-3 py-1 text-xs bg-purple-500 text-white border border-purple-600 rounded hover:bg-purple-600 transition-colors"
                  title="Başlık - Yazı - Görsel Template'i"
                >
                  🖼️ Başlık-Yazı-Görsel
                </button>
              </div>
            </div>
          </div>
          
          {uploadingImage && (
            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              Görsel yükleniyor...
            </div>
          )}
          
          <textarea
            ref={textareaRef}
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
            placeholder="Makale içeriğini buraya yazın... HTML etiketleri kullanabilirsiniz."
            style={{ color: '#111827' }}
          />

          <div className="mt-2 text-sm text-white">
            Toolbar butonlarını kullanarak metni formatlayabilirsiniz. HTML etiketleri de manuel olarak yazabilirsiniz.
          </div>
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Görsel
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
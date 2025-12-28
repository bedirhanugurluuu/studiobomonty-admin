import React, { useEffect, useState, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from '../../utils/api';
import { useBreadcrumb } from "../../contexts/BreadcrumbContext";
import { getImageUrl, getFallbackImageUrl } from "../../utils/imageUtils";
import { storageUtils } from "../../utils/supabaseStorage";
import { Project } from "../../types/Project";
import Swal from "sweetalert2";
import { FormLayout } from "../../components/common/PageLayout";
import { FormInput, FormTextarea, FormFileInput, FormSelect, FormCheckbox, FormButton, FormActions, FormMultiSelect } from "../../components/common/FormComponents";

const ProjectsEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState("");
  const [gallery, setGallery] = useState<any[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newBanner, setNewBanner] = useState<File | null>(null);
  const [newMobileBanner, setNewMobileBanner] = useState<File | null>(null);
  const [galleryOrderValues, setGalleryOrderValues] = useState<Record<string, number>>({});
  const [description, setDescription] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [clientName, setClientName] = useState("");
  const [tab1, setTab1] = useState("");
  const [tab2, setTab2] = useState("");
  const [projectTabIds, setProjectTabIds] = useState<(string | number)[]>([]);
  const [availableTabs, setAvailableTabs] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [newRoleTitle, setNewRoleTitle] = useState("");
  const [newPersonName, setNewPersonName] = useState("");
  const { setBreadcrumbs, setIsLoading } = useBreadcrumb();

  useEffect(() => {
    // Breadcrumb'ı ayarla
    setBreadcrumbs([
      { name: "Dashboard", to: "/admin/dashboard" },
      { name: "Projects", to: "/admin/projects" },
      { name: "Edit Project" }
    ]);

    const fetchProject = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await api.projects.getById(id!);
        if (error) throw error;
        const res = { data };

        setProject(res.data);
        setTitle(res.data.title);
        setSubtitle(res.data.subtitle);
        setSlug(res.data.slug || "");
        setDescription(res.data.description || "");
        setExternalLink(res.data.external_link || "");
        setClientName(res.data.client_name || "");
        setTab1(res.data.tab1 || "");
        setTab2(res.data.tab2 || "");
        // Fetch available tabs
        const { data: tabsData, error: tabsError } = await api.projectTabs.getAll();
        if (!tabsError && tabsData) {
          setAvailableTabs(tabsData);
        }
        
        // Fetch project tabs (categories) for this project
        if (id) {
          const { data: projectTabsData, error: projectTabsError } = await api.projectProjectTabs.getByProjectId(id);
          if (!projectTabsError && projectTabsData) {
            const tabIds = projectTabsData.map((item: any) => item.project_tab_id);
            setProjectTabIds(tabIds);
          }
        }
        
        // Team members'ı çek
        if (id) {
          const { data: teamData, error: teamError } = await api.projectTeamMembers.getAll(id);
          if (!teamError && teamData) {
            setTeamMembers(teamData);
          }
        }
        // featured alanını kontrol et
        console.log('Project featured:', res.data.featured);
        // Project gallery'den resimleri çek
        if (id) {
          const { data: galleryData, error: galleryError } = await api.projectGallery.getByProjectId(id);
          if (galleryError) {
            console.error("Gallery yükleme hatası:", galleryError);
            setGallery([]);
          } else {
            const galleryItems = galleryData || [];
            setGallery(galleryItems);
            // Initialize order values - id null ise image_path kullan
            const initialOrders: Record<string, number> = {};
            galleryItems.forEach((item: any) => {
              // ID varsa ID kullan, yoksa image_path kullan
              const key = item.id ? String(item.id) : `${item.project_id}_${item.image_path}`;
              initialOrders[key] = parseInt(item.sort) || 0;
            });
            setGalleryOrderValues(initialOrders);
          }
        }
        setIsLoading(false);
      } catch (err: any) {
        console.error("Proje getirme hatası:", err.response?.status, err.message);
        setError("Proje bulunamadı");
        setProject(null);
        setIsLoading(false);
      }
    };

    if (id) fetchProject();
  }, [id, setBreadcrumbs, setIsLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Yeni resimleri yükle
      let newBannerPath = project?.banner_media;
      let newMobileBannerPath = project?.mobile_image_url;

      if (newBanner) {
        // Eski banner'ı sil
        if (project?.banner_media) {
          const urlParts = project.banner_media.split('/');
          const fileName = urlParts[urlParts.length - 1];
          await storageUtils.deleteFile(fileName);
        }
        
        // Yeni banner'ı yükle
        const timestamp = Date.now();
        const fileName = `project-banner-${timestamp}-${Math.random().toString(36).substring(2)}.${newBanner.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await storageUtils.uploadFile(newBanner, fileName);
        if (uploadError) throw uploadError;
        newBannerPath = `/uploads/${fileName}`;
      }

      if (newMobileBanner) {
        // Eski mobile banner'ı sil
        if (project?.mobile_image_url) {
          const urlParts = project.mobile_image_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          await storageUtils.deleteFile(fileName);
        }
        
        // Yeni mobile banner'ı yükle
        const timestamp = Date.now();
        const fileName = `project-banner-mobile-${timestamp}-${Math.random().toString(36).substring(2)}.${newMobileBanner.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await storageUtils.uploadFile(newMobileBanner, fileName);
        if (uploadError) throw uploadError;
        newMobileBannerPath = `/uploads/${fileName}`;
      }

      const updateData: any = {};
      
      // Sadece değişen field'ları ekle
      if (title !== project?.title) updateData.title = title;
      if (subtitle !== project?.subtitle) updateData.subtitle = subtitle;
      if (slug !== project?.slug) updateData.slug = slug.toLowerCase().trim();
      if (description !== project?.description) updateData.description = description;
      if (externalLink !== project?.external_link) updateData.external_link = externalLink;
      if (clientName !== project?.client_name) updateData.client_name = clientName;
      if (tab1 !== project?.tab1) updateData.tab1 = tab1;
      if (tab2 !== project?.tab2) updateData.tab2 = tab2;
      // Project tabs will be handled separately via junction table
      
      // Resim path'lerini ekle
      if (newBanner) updateData.banner_media = newBannerPath;
      if (newMobileBanner) updateData.mobile_image_url = newMobileBannerPath;
      
      // Bu field'ları her zaman gönder (gerekli olabilir)
      if (!updateData.slug) updateData.slug = project?.slug || "";
      updateData.featured = project?.featured || false; // is_featured değil, featured
      updateData.is_featured = project?.is_featured || false;
      updateData.featured_order = project?.featured_order || 0;
      
      console.log('Update data:', updateData);
      console.log('Project ID:', id);
      
      const { error } = await api.projects.update(id!, updateData);
      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      // Project tabs'ı kaydet
      if (id) {
        const { error: tabsError } = await api.projectProjectTabs.setForProject(id, projectTabIds);
        if (tabsError) {
          console.error("Kategoriler kaydedilemedi:", tabsError);
          // Hata olsa bile devam et, kritik değil
        }
      }

      Swal.fire({
        icon: "success",
        title: "Başarılı!",
        text: "Proje başarıyla güncellendi.",
        timer: 2000,
        showConfirmButton: false,
      });
      navigate("/admin/projects");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Hata!",
        text: "Güncelleme sırasında hata oluştu.",
      });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImages(Array.from(e.target.files));
    }
  };

  const handleBannerChange = (file: File | null) => {
    setNewBanner(file);
  };

  const handleMobileBannerChange = (file: File | null) => {
    setNewMobileBanner(file);
  };

  const handleGalleryUpload = async () => {
    if (!newImages.length) {
      Swal.fire({
        icon: "warning",
        title: "Uyarı!",
        text: "Yüklenecek görsel seçilmedi.",
      });
      return;
    }

    try {
      const uploadedImages: any[] = [];
      
      // Her resmi Supabase Storage'a yükle ve project_gallery tablosuna kaydet
      for (const file of newImages) {
        const timestamp = Date.now();
        const fileName = `project-gallery-${timestamp}-${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`;
        
        const { data: uploadData, error: uploadError } = await storageUtils.uploadFile(file, fileName);
        if (uploadError) throw uploadError;
        
        const imagePath = `/uploads/${fileName}`;
        
        // Project gallery tablosuna kaydet
        const { data: galleryData, error: galleryError } = await api.projectGallery.create({
          project_id: id,
          image_path: imagePath,
          sort: gallery.length + uploadedImages.length
        });
        
        if (galleryError) throw galleryError;
        uploadedImages.push(galleryData);
      }

      // Mevcut gallery'ye yeni resimleri ekle ve sırala
      const updatedGallery = [...gallery, ...uploadedImages].sort((a, b) => (a.sort || 0) - (b.sort || 0));
      
      // Yeni görsellerin order değerlerini state'e ekle - id'yi string'e çevir
      const newOrderValues: Record<string, number> = {};
      uploadedImages.forEach((item: any) => {
        if (item.id) {
          const itemId = String(item.id);
          newOrderValues[itemId] = item.sort ?? 0;
        }
      });
      setGalleryOrderValues(prev => ({ ...prev, ...newOrderValues }));
      
      Swal.fire({
        icon: "success",
        title: "Başarılı!",
        text: "Galeri başarıyla yüklendi.",
        timer: 2000,
        showConfirmButton: false,
      });
      
      setNewImages([]);
      setGallery(updatedGallery);
    } catch (err) {
      console.error("Gallery upload hatası:", err);
      Swal.fire({
        icon: "error",
        title: "Hata!",
        text: "Galeri yüklenirken hata oluştu.",
      });
    }
  };

  const handleAddTeamMember = async () => {
    if (!newRoleTitle.trim() || !newPersonName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Uyarı!",
        text: "Lütfen görev tanımı ve kişi adını girin.",
      });
      return;
    }

    try {
      const { data, error } = await api.projectTeamMembers.create({
        project_id: id!,
        role_title: newRoleTitle.trim(),
        person_name: newPersonName.trim(),
        order_index: teamMembers.length
      });

      if (error) throw error;

      Swal.fire({
        icon: "success",
        title: "Başarılı!",
        text: "Takım üyesi eklendi.",
        timer: 2000,
        showConfirmButton: false,
      });

      setNewRoleTitle("");
      setNewPersonName("");
      
      // Team members'ı yeniden çek
      if (id) {
        const { data: teamData, error: teamError } = await api.projectTeamMembers.getAll(id);
        if (!teamError && teamData) {
          setTeamMembers(teamData);
        }
      }
    } catch (err) {
      console.error("Team member ekleme hatası:", err);
      Swal.fire({
        icon: "error",
        title: "Hata!",
        text: "Takım üyesi eklenirken hata oluştu.",
      });
    }
  };

  const handleDeleteTeamMember = async (memberId: string) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu takım üyesini silmek istediğinize emin misiniz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Evet, sil",
      cancelButtonText: "İptal",
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await api.projectTeamMembers.delete(memberId);
      if (error) throw error;

      Swal.fire({
        icon: "success",
        title: "Başarılı!",
        text: "Takım üyesi silindi.",
        timer: 2000,
        showConfirmButton: false,
      });

      // Team members'ı yeniden çek
      if (id) {
        const { data: teamData, error: teamError } = await api.projectTeamMembers.getAll(id);
        if (!teamError && teamData) {
          setTeamMembers(teamData);
        }
      }
    } catch (err) {
      console.error("Team member silme hatası:", err);
      Swal.fire({
        icon: "error",
        title: "Hata!",
        text: "Takım üyesi silinirken hata oluştu.",
      });
    }
  };

  const handleOrderChange = async (galleryItem: any, newOrder: number) => {
    // ID kontrolü - eğer id null ise image_path ve project_id kullan
    if (!galleryItem.id && !galleryItem.image_path) {
      Swal.fire({
        icon: "error",
        title: "Hata!",
        text: "Görsel bilgisi bulunamadı.",
      });
      return;
    }

    try {
      let error;
      if (galleryItem.id) {
        // ID varsa normal update
        const result = await api.projectGallery.update(String(galleryItem.id), { sort: newOrder });
        error = result.error;
      } else {
        // ID yoksa image_path ve project_id ile update
        const result = await api.projectGallery.updateByImagePath(
          galleryItem.project_id,
          galleryItem.image_path,
          { sort: newOrder }
        );
        error = result.error;
      }
      
      if (error) throw error;

      // Update local state
      const updatedGallery = gallery.map(img => {
        const matches = galleryItem.id 
          ? img.id === galleryItem.id
          : img.image_path === galleryItem.image_path && img.project_id === galleryItem.project_id;
        return matches ? { ...img, sort: newOrder } : img;
      }).sort((a, b) => (parseInt(a.sort) || 0) - (parseInt(b.sort) || 0));
      
      setGallery(updatedGallery);

      Swal.fire({
        icon: "success",
        title: "Başarılı!",
        text: "Sıralama güncellendi.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error("Order güncelleme hatası:", err);
      Swal.fire({
        icon: "error",
        title: "Hata!",
        text: err?.message || "Sıralama güncellenirken hata oluştu.",
      });
    }
  };

  const handleDeleteImage = async (galleryItem: any) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu görseli silmek istediğinize emin misiniz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Evet, sil",
      cancelButtonText: "İptal",
    });

    if (!result.isConfirmed) return;

    // image_path kontrolü
    if (!galleryItem.image_path) {
      Swal.fire({
        icon: "error",
        title: "Hata!",
        text: "Görsel bilgisi bulunamadı.",
      });
      return;
    }

    try {
      // Supabase Storage'dan dosyayı sil
      if (galleryItem.image_path) {
        const urlParts = galleryItem.image_path.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await storageUtils.deleteFile(fileName);
      }

      // Project gallery tablosundan kaydı sil
      let deleteError;
      if (galleryItem.id) {
        // ID varsa normal delete
        const result = await api.projectGallery.delete(String(galleryItem.id));
        deleteError = result.error;
      } else {
        // ID yoksa image_path ve project_id ile delete
        const result = await api.projectGallery.deleteByImagePath(
          galleryItem.project_id,
          galleryItem.image_path
        );
        deleteError = result.error;
      }
      
      if (deleteError) throw deleteError;

      // Galeriyi güncelle (silinen dosyayı çıkar) ve sırala
      const updatedGallery = gallery
        .filter(img => {
          if (galleryItem.id) {
            return String(img.id) !== String(galleryItem.id);
          } else {
            return !(img.image_path === galleryItem.image_path && img.project_id === galleryItem.project_id);
          }
        })
        .sort((a, b) => (parseInt(a.sort) || 0) - (parseInt(b.sort) || 0));
      
      // Order values state'inden de sil
      setGalleryOrderValues(prev => {
        const newValues = { ...prev };
        const key = galleryItem.id 
          ? String(galleryItem.id) 
          : `${galleryItem.project_id}_${galleryItem.image_path}`;
        delete newValues[key];
        return newValues;
      });
      
      setGallery(updatedGallery);

      Swal.fire({
        icon: "success",
        title: "Başarılı!",
        text: "Görsel silindi.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error("Gallery silme hatası:", err);
      Swal.fire({
        icon: "error",
        title: "Hata!",
        text: err?.message || "Görsel silinirken hata oluştu.",
      });
    }
  };

  if (!project) return <div className="p-6">Proje bulunamadı.</div>;

  return (
    <FormLayout title="Projeyi Düzenle" backUrl="/admin/projects">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner Preview */}
        {project.banner_media && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Mevcut Banner:</label>
            {/\.(mp4|webm|ogg|mov)$/i.test(project.banner_media) ? (
              <div className="w-full max-w-md h-48 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600">
                🎥 Video Banner
              </div>
            ) : (
              <img
                src={getImageUrl(project.banner_media)}
                alt="Banner"
                className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                onError={(e) => {
                  e.currentTarget.src = getFallbackImageUrl();
                }}
              />
            )}
          </div>
        )}

        <FormFileInput
          label="Desktop Banner (Görsel veya Video)"
          accept="image/*,video/*"
          onChange={handleBannerChange}
          helperText={newBanner ? `Yeni seçilen: ${newBanner.name}` : "Proje için desktop banner görseli veya video yükleyin"}
        />

        {/* Mobile Banner Preview */}
        {project.mobile_image_url && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Mevcut Mobile Banner:</label>
            {/\.(mp4|webm|ogg|mov)$/i.test(project.mobile_image_url) ? (
              <div className="w-full max-w-md h-48 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600">
                🎥 Video Mobile Banner
              </div>
            ) : (
              <img
                src={getImageUrl(project.mobile_image_url)}
                alt="Mobile Banner"
                className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                onError={(e) => {
                  e.currentTarget.src = getFallbackImageUrl();
                }}
              />
            )}
          </div>
        )}

        <FormFileInput
          label="Mobile Banner (Görsel veya Video)"
          accept="image/*,video/*"
          onChange={handleMobileBannerChange}
          helperText={newMobileBanner ? `Yeni seçilen: ${newMobileBanner.name}` : "Proje için mobile banner görseli veya video yükleyin (opsiyonel)"}
        />

        <FormInput
          label="Başlık"
          value={title}
          onChange={(value) => setTitle(value)}
          required
        />

        <FormInput
          label="Alt Başlık"
          value={subtitle}
          onChange={(value) => setSubtitle(value)}
          required
        />

        <FormInput
          label="Slug"
          value={slug}
          onChange={(value) => setSlug(value.toLowerCase())}
          required
          helperText="URL'de kullanılacak benzersiz tanımlayıcı (küçük harf, boşluksuz)"
        />

        <FormTextarea
          label="Açıklama"
          value={description}
          onChange={(value) => setDescription(value)}
          rows={5}
        />

        <FormInput
          label="Dış Bağlantı (External Link)"
          type="url"
          value={externalLink}
          onChange={(value) => setExternalLink(value)}
          placeholder="https://..."
        />

        <FormInput
          label="Müşteri (Client)"
          value={clientName}
          onChange={(value) => setClientName(value)}
        />

        <FormInput
          label="Tab 1"
          value={tab1}
          onChange={(value) => setTab1(value)}
        />

        <FormInput
          label="Tab 2"
          value={tab2}
          onChange={(value) => setTab2(value)}
        />

        <FormMultiSelect
          label="Project Tabs (Kategoriler)"
          values={projectTabIds}
          onChange={(values) => setProjectTabIds(values)}
          options={availableTabs.map(tab => ({ value: tab.id, label: tab.name }))}
          helperText="Projenin hangi kategorilere ait olduğunu seçin (birden fazla seçim yapabilirsiniz)"
        />

        <FormSelect
          label="Featured (Anasayfada Göster)"
          value={project?.is_featured ? "true" : "false"}
          onChange={(value) => setProject(prev => prev ? {...prev, is_featured: value === "true"} : null)}
          options={[
            { value: "false", label: "Hayır" },
            { value: "true", label: "Evet" }
          ]}
        />

        <FormInput
          label="Featured Sırası"
          type="number"
          value={String(project?.featured_order || 0)}
          onChange={(value) => setProject(prev => prev ? {...prev, featured_order: parseInt(value) || 0} : null)}
          helperText="Anasayfada gösterim sırası (sayı ne kadar küçükse o kadar üstte görünür)"
        />

        <FormActions>
          <FormButton type="submit" variant="primary">
            Güncelle
          </FormButton>
        </FormActions>
      </form>

      <hr className="my-8 border-gray-300" />

      <h2 className="text-xl text-black font-semibold mb-4">Galeri Görselleri</h2>

      <div className="mb-4">
        <input 
          type="file" 
          multiple 
          onChange={handleFileChange} 
          className="mb-3 w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <FormButton type="button" onClick={handleGalleryUpload} variant="primary">
          Galeri Yükle
        </FormButton>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">

        {gallery.length > 0 ? (
          gallery.map((img, idx) => {
            const filename = img.image_path?.replace(/\\/g, "/") || "";
            const imageUrl = getImageUrl(img.image_path || "");
            const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(img.image_path || "");

            return (
              <div key={img.id || idx} className="relative group flex flex-col">
                {isVideo ? (
                  <div className="w-full h-40 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 text-sm relative overflow-hidden">
                    <span>🎥 Video</span>
                    <video
                      src={imageUrl}
                      className="absolute inset-0 w-full h-full rounded-lg object-cover opacity-0 transition-opacity duration-300"
                      onLoadedData={(e) => {
                        e.currentTarget.style.opacity = "1";
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      controls
                      muted
                    />
                  </div>
                ) : (
                  <img
                    src={imageUrl}
                    alt={`galeri-${idx}`}
                    className="w-full h-40 object-cover rounded-lg border border-gray-300"
                    onError={(e) => {
                      e.currentTarget.src = getFallbackImageUrl();
                    }}
                  />
                )}
                <button
                  onClick={() => handleDeleteImage(img)}
                  className="absolute top-2 right-2 bg-black bg-opacity-60 text-white border-none px-2 py-1 text-xs rounded cursor-pointer hover:bg-opacity-80 transition-opacity"
                >
                  Sil
                </button>
                <div className="mt-2">
                  <label className="block text-xs text-gray-600 mb-1">Sıra:</label>
                  <input
                    type="number"
                    min="0"
                    value={(() => {
                      const key = img.id ? String(img.id) : `${img.project_id}_${img.image_path}`;
                      return galleryOrderValues[key] ?? parseInt(img.sort) ?? idx;
                    })()}
                    onChange={(e) => {
                      const newOrder = parseInt(e.target.value) || 0;
                      const key = img.id ? String(img.id) : `${img.project_id}_${img.image_path}`;
                      setGalleryOrderValues(prev => ({
                        ...prev,
                        [key]: newOrder
                      }));
                    }}
                    onBlur={(e) => {
                      const newOrder = parseInt(e.target.value) || 0;
                      const currentOrder = parseInt(img.sort) ?? idx;
                      if (newOrder !== currentOrder) {
                        handleOrderChange(img, newOrder);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            Henüz galeri görseli yüklenmemiş.
          </div>
        )}
      </div>

      <hr className="my-8 border-gray-300" />

      <h2 className="text-xl text-black font-semibold mb-4">Projede İsmi Geçen Kişiler</h2>

      <div className="mb-4 flex gap-4 items-end">
        <div className="flex-1">
          <FormInput
            label="Görev Tanımı"
            value={newRoleTitle}
            onChange={(value) => setNewRoleTitle(value)}
            placeholder="Örn: Art Director"
          />
        </div>
        <div className="flex-1">
          <FormInput
            label="Kişi İsmi"
            value={newPersonName}
            onChange={(value) => setNewPersonName(value)}
            placeholder="Örn: John Doe"
          />
        </div>
        <FormButton
          type="button"
          onClick={handleAddTeamMember}
          variant="primary"
        >
          Ekle
        </FormButton>
      </div>

      <div className="mt-4">
        {teamMembers.length > 0 ? (
          <div className="flex flex-col gap-2">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex justify-between text-black items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <span className="text-sm">
                  <strong>{member.role_title}</strong>: {member.person_name}
                </span>
                <button
                  onClick={() => handleDeleteTeamMember(member.id)}
                  className="bg-red-600 text-white border-none px-3 py-1 rounded text-xs cursor-pointer hover:bg-red-700 transition-colors"
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Henüz takım üyesi eklenmemiş.
          </div>
        )}
      </div>
    </FormLayout>
  );
};

export default ProjectsEditPage;

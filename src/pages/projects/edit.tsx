import React, { useEffect, useMemo, useState, ChangeEvent } from "react";
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
  const [uploadMode, setUploadMode] = useState<"horizontal" | "vertical" | null>(null);
  const [slotFiles, setSlotFiles] = useState<Record<number, File | null>>({});
  const [slotInputResetKey, setSlotInputResetKey] = useState(0);
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

  const handleBannerChange = (file: File | null) => {
    setNewBanner(file);
  };

  const handleMobileBannerChange = (file: File | null) => {
    setNewMobileBanner(file);
  };

  const getCurrentMaxGalleryOrder = () => {
    if (!gallery.length) return -1;
    return Math.max(
      ...gallery.map((item) => (typeof item.sort === "number" ? item.sort : parseInt(item.sort) || 0))
    );
  };

  const handleSelectUploadMode = (mode: "horizontal" | "vertical") => {
    setUploadMode(mode);
    setSlotInputResetKey((prev) => prev + 1);
    if (mode === "horizontal") {
      const nextOrder = Math.max(getCurrentMaxGalleryOrder() + 1, 0);
      setSlotFiles({ [nextOrder]: null });
    } else {
      const maxOrder = getCurrentMaxGalleryOrder();
      const hasInitialVerticalOrders = gallery.some((item) => {
        const order = typeof item.sort === "number" ? item.sort : parseInt(item.sort) || 0;
        return order === 2 || order === 3;
      });

      // İlk dikey çifti 2-3, sonrakiler max+1 ve max+2 olacak şekilde ilerler
      if (!hasInitialVerticalOrders && maxOrder <= 2) {
        setSlotFiles({ 2: null, 3: null });
      } else {
        const startOrder = Math.max(maxOrder + 1, 4);
        setSlotFiles({ [startOrder]: null, [startOrder + 1]: null });
      }
    }
  };

  const handleSlotFileChange = (order: number, file: File | null) => {
    setSlotFiles((prev) => ({
      ...prev,
      [order]: file,
    }));
  };

  const handleOpenUploadForOrder = (order: number) => {
    setSlotInputResetKey((prev) => prev + 1);
    if (order === 0) {
      setUploadMode("horizontal");
      setSlotFiles({ 0: null });
      return;
    }

    const startOrder = order % 2 === 0 ? order : order - 1;
    setUploadMode("vertical");
    setSlotFiles({ [startOrder]: null, [startOrder + 1]: null });
  };

  const handleGalleryUpload = async () => {
    const selectedEntries = Object.entries(slotFiles).filter(([, file]) => !!file);
    if (!selectedEntries.length) {
      Swal.fire({
        icon: "warning",
        title: "Uyarı!",
        text: "Yüklenecek görsel seçilmedi. Lütfen en az bir slot seçin.",
      });
      return;
    }

    try {
      const uploadedImages: any[] = [];

      // Slot order çakışmalarında mevcut görselleri koru (sıfır risk yaklaşımı)
      for (const [orderKey] of selectedEntries) {
        const order = Number(orderKey);
        const hasExistingImageForOrder = gallery.some((item) => (parseInt(item.sort) || 0) === order);
        if (hasExistingImageForOrder) {
          Swal.fire({
            icon: "warning",
            title: "Order Dolu",
            text: `${order}. order'da zaten bir görsel var. Önce mevcut görseli silin veya order değiştirin.`,
          });
          return;
        }
      }

      // Sadece seçilen slotlara görsel yükle ve project_gallery tablosuna kaydet
      for (const [orderKey, file] of selectedEntries) {
        if (!file) continue;
        const order = Number(orderKey);
        const timestamp = Date.now();
        const modeTag = uploadMode === "horizontal" ? "horizontal" : "vertical";
        const fileName = `project-gallery-${modeTag}-${timestamp}-${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`;
        
        const { data: uploadData, error: uploadError } = await storageUtils.uploadFile(file, fileName);
        if (uploadError) throw uploadError;
        
        const imagePath = `/uploads/${fileName}`;
        
        // Project gallery tablosuna kaydet
        const { data: galleryData, error: galleryError } = await api.projectGallery.create({
          project_id: id,
          image_path: imagePath,
          sort: order
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
      
      if (uploadMode === "horizontal") {
        const nextOrder = Math.max(getCurrentMaxGalleryOrder() + 1, 0);
        setSlotFiles({ [nextOrder]: null });
      } else if (uploadMode === "vertical") {
        setSlotFiles({});
      }
      setSlotInputResetKey((prev) => prev + 1);
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

  const sortedGallery = useMemo(() => {
    return [...gallery].sort((a, b) => (parseInt(a.sort) || 0) - (parseInt(b.sort) || 0));
  }, [gallery]);

  const isHorizontalLayoutImage = (imagePath: string) => imagePath.includes("project-gallery-horizontal-");
  const isVerticalLayoutImage = (imagePath: string) => imagePath.includes("project-gallery-vertical-");
  const hasTaggedLayout = useMemo(
    () => sortedGallery.some((item) => isHorizontalLayoutImage(item.image_path || "") || isVerticalLayoutImage(item.image_path || "")),
    [sortedGallery]
  );

  const previewBlocks = useMemo(() => {
    if (hasTaggedLayout) {
      const blocks: Array<
        | { type: "horizontal"; order: number; item: any }
        | { type: "vertical"; order: number; leftOrder: number; rightOrder: number; leftItem: any | null; rightItem: any | null }
      > = [];

      for (let i = 0; i < sortedGallery.length; i++) {
        const item = sortedGallery[i];
        const order = parseInt(item.sort) || 0;
        const path = item.image_path || "";

        if (isHorizontalLayoutImage(path)) {
          blocks.push({ type: "horizontal", order, item });
          continue;
        }

        if (isVerticalLayoutImage(path)) {
          const next = sortedGallery[i + 1];
          const nextOrder = next ? parseInt(next.sort) || 0 : null;
          const nextIsVertical = next ? isVerticalLayoutImage(next.image_path || "") : false;

          if (next && nextIsVertical && nextOrder === order + 1) {
            blocks.push({
              type: "vertical",
              order,
              leftOrder: order,
              rightOrder: order + 1,
              leftItem: item,
              rightItem: next,
            });
            i++;
          } else {
            const isEven = order % 2 === 0;
            blocks.push({
              type: "vertical",
              order: isEven ? order : order - 1,
              leftOrder: isEven ? order : order - 1,
              rightOrder: isEven ? order + 1 : order,
              leftItem: isEven ? item : null,
              rightItem: isEven ? null : item,
            });
          }
          continue;
        }

        // Eski etiketsiz kayıtlarda satır akışını bozmamak için yatay fallback
        blocks.push({ type: "horizontal", order, item });
      }

      return blocks.sort((a, b) => a.order - b.order);
    }

    // Legacy fallback: order 0 yatay, sonrası dikey çiftler
    const blocks: Array<
      | { type: "horizontal"; order: number; item: any }
      | { type: "vertical"; order: number; leftOrder: number; rightOrder: number; leftItem: any | null; rightItem: any | null }
    > = [];
    const horizontal = sortedGallery.find((item) => (parseInt(item.sort) || 0) === 0);
    if (horizontal) {
      blocks.push({ type: "horizontal", order: 0, item: horizontal });
    }

    const rowStarts = new Set<number>();
    sortedGallery
      .filter((item) => (parseInt(item.sort) || 0) >= 2)
      .forEach((item) => {
        const order = parseInt(item.sort) || 0;
        rowStarts.add(order % 2 === 0 ? order : order - 1);
      });

    Array.from(rowStarts)
      .sort((a, b) => a - b)
      .forEach((startOrder) => {
        blocks.push({
          type: "vertical",
          order: startOrder,
          leftOrder: startOrder,
          rightOrder: startOrder + 1,
          leftItem: sortedGallery.find((item) => (parseInt(item.sort) || 0) === startOrder) || null,
          rightItem: sortedGallery.find((item) => (parseInt(item.sort) || 0) === startOrder + 1) || null,
        });
      });

    return blocks;
  }, [sortedGallery, hasTaggedLayout]);

  const renderGalleryCard = (img: any, idx: number) => {
    const imageUrl = getImageUrl(img.image_path || "");
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(img.image_path || "");
    const isVerticalCard = (img.image_path || "").includes("project-gallery-vertical-");
    const previewHeightClass = isVerticalCard ? "h-80" : "h-40";

    return (
      <div key={img.id || idx} className="relative group flex flex-col">
        {isVideo ? (
          <div className={`w-full ${previewHeightClass} bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 text-sm relative overflow-hidden`}>
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
            className={`w-full ${previewHeightClass} object-cover rounded-lg border border-gray-300`}
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
  };

  if (!project) return <div className="p-6">Proje bulunamadı.</div>;

  return (
    <FormLayout title="Projeyi Düzenle" backUrl="/admin/projects">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {project.banner_media && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mevcut Banner:</label>
                {/\.(mp4|webm|ogg|mov)$/i.test(project.banner_media) ? (
                  <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600">
                    🎥 Video Banner
                  </div>
                ) : (
                  <img
                    src={getImageUrl(project.banner_media)}
                    alt="Banner"
                    className="w-full h-48 object-cover rounded-lg border border-gray-300"
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
          </div>

          <div className="space-y-4">
            {project.mobile_image_url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mevcut Mobile Banner:</label>
                {/\.(mp4|webm|ogg|mov)$/i.test(project.mobile_image_url) ? (
                  <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600">
                    🎥 Video Mobile Banner
                  </div>
                ) : (
                  <img
                    src={getImageUrl(project.mobile_image_url)}
                    alt="Mobile Banner"
                    className="w-full h-48 object-cover rounded-lg border border-gray-300"
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <FormMultiSelect
          label="Project Tabs (Kategoriler)"
          values={projectTabIds}
          onChange={(values) => setProjectTabIds(values)}
          options={availableTabs.map(tab => ({ value: tab.id, label: tab.name }))}
          helperText="Projenin hangi kategorilere ait olduğunu seçin (birden fazla seçim yapabilirsiniz)"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <FormActions>
          <FormButton type="submit" variant="primary">
            Güncelle
          </FormButton>
        </FormActions>
      </form>

      <hr className="my-8 border-gray-300" />

      <h2 className="text-xl text-black font-semibold mb-4">Galeri Görselleri</h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4">
        <div>
          <div className="flex flex-wrap gap-3 mb-4">
            <FormButton
              type="button"
              onClick={() => handleSelectUploadMode("horizontal")}
              variant={uploadMode === "horizontal" ? "primary" : "secondary"}
            >
              Yatay Gorsel
            </FormButton>
            <FormButton
              type="button"
              onClick={() => handleSelectUploadMode("vertical")}
              variant={uploadMode === "vertical" ? "primary" : "secondary"}
            >
              Dikey Gorsel
            </FormButton>
          </div>

          {uploadMode === "horizontal" && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order {Object.keys(slotFiles).map(Number).sort((a, b) => a - b)[0] ?? "-"} (Yatay)
              </label>
              <input
                key={`horizontal-${slotInputResetKey}`}
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const horizontalOrder = Object.keys(slotFiles).map(Number).sort((a, b) => a - b)[0];
                  if (typeof horizontalOrder === "number") {
                    handleSlotFileChange(horizontalOrder, e.target.files?.[0] || null);
                  }
                }}
                className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-600 mt-2">
                {(() => {
                  const horizontalOrder = Object.keys(slotFiles).map(Number).sort((a, b) => a - b)[0];
                  if (typeof horizontalOrder !== "number" || !slotFiles[horizontalOrder]) return "Dosya seçilmedi";
                  return `Seçilen: ${slotFiles[horizontalOrder]?.name}`;
                })()}
              </p>
            </div>
          )}

          {uploadMode === "vertical" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order {Object.keys(slotFiles).map(Number).sort((a, b) => a - b)[0] ?? "-"} (Sol)
                </label>
                <input
                  key={`vertical-left-${slotInputResetKey}`}
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const firstOrder = Object.keys(slotFiles).map(Number).sort((a, b) => a - b)[0];
                    if (typeof firstOrder === "number") {
                      handleSlotFileChange(firstOrder, e.target.files?.[0] || null);
                    }
                  }}
                  className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-600 mt-2">
                  {(() => {
                  const firstOrder = Object.keys(slotFiles).map(Number).sort((a, b) => a - b)[0];
                  if (typeof firstOrder !== "number" || !slotFiles[firstOrder]) return "Dosya seçilmedi";
                  return `Seçilen: ${slotFiles[firstOrder]?.name}`;
                  })()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order {Object.keys(slotFiles).map(Number).sort((a, b) => a - b)[1] ?? "-"} (Sağ)
                </label>
                <input
                  key={`vertical-right-${slotInputResetKey}`}
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const secondOrder = Object.keys(slotFiles).map(Number).sort((a, b) => a - b)[1];
                    if (typeof secondOrder === "number") {
                      handleSlotFileChange(secondOrder, e.target.files?.[0] || null);
                    }
                  }}
                  className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-600 mt-2">
                  {(() => {
                  const secondOrder = Object.keys(slotFiles).map(Number).sort((a, b) => a - b)[1];
                  if (typeof secondOrder !== "number" || !slotFiles[secondOrder]) return "Dosya seçilmedi";
                  return `Seçilen: ${slotFiles[secondOrder]?.name}`;
                  })()}
                </p>
              </div>
            </div>
          )}

          <FormButton type="button" onClick={handleGalleryUpload} variant="primary">
            Galeri Yükle
          </FormButton>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          {gallery.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">On Yuz Onizleme Sirasi (Order'a Gore)</h3>
              {previewBlocks.map((block, index) => (
              <div key={`${block.type}-${block.order}-${index}`} className="p-3 border border-gray-200 rounded-lg">
                {block.type === "horizontal" ? (
                  <>
                    <p className="text-xs text-gray-500 mb-3">Yatay - Order {block.order}</p>
                    {renderGalleryCard(block.item, block.order)}
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 mb-3">
                      Dikey Satir - {block.leftOrder} (sol) / {block.rightOrder} (sag)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        {block.leftItem ? (
                          renderGalleryCard(block.leftItem, block.leftOrder)
                        ) : (
                          <div className="h-full min-h-40 border border-dashed border-gray-300 gap-4 rounded-lg flex flex-col items-center justify-center text-sm text-gray-400 p-3">
                            <span>Order {block.leftOrder} bos</span>
                            <FormButton type="button" variant="secondary" onClick={() => handleOpenUploadForOrder(block.leftOrder)}>
                              Bu Slota Yukle
                            </FormButton>
                          </div>
                        )}
                      </div>
                      <div>
                        {block.rightItem ? (
                          renderGalleryCard(block.rightItem, block.rightOrder)
                        ) : (
                          <div className="h-full min-h-40 border border-dashed border-gray-300 gap-4 rounded-lg flex flex-col items-center justify-center text-sm text-gray-400 p-3">
                            <span>Order {block.rightOrder} bos</span>
                            <FormButton type="button" variant="secondary" onClick={() => handleOpenUploadForOrder(block.rightOrder)}>
                              Bu Slota Yukle
                            </FormButton>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Henüz galeri görseli yüklenmemiş.
            </div>
          )}
          </div>
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
                  className="bg-red-600 text-white border-none px-3 py-1 rounded  text-xs cursor-pointer hover:bg-red-700 transition-colors"
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

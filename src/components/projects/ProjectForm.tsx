import React, { useEffect, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { storageUtils } from "../../utils/supabaseStorage";
import Swal from "sweetalert2";
import { FormLayout } from "../common/PageLayout";
import { FormInput, FormTextarea, FormFileInput, FormCheckbox, FormButton, FormActions, FormSelect } from "../common/FormComponents";

interface ProjectResponse {
  id: number;
  title: string;
  subtitle: string;
  slug: string;
  description: string;
  external_link: string;
  client_name: string;
  tab1: string;
  tab2: string;
  featured_order: number;
}

const ProjectForm: React.FC<{ mode: "new" | "edit" }> = ({ mode }) => {
  const navigate = useNavigate();
  // Form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [clientName, setClientName] = useState("");
  const [tab1, setTab1] = useState("");
  const [tab2, setTab2] = useState("");
  const [projectTabId, setProjectTabId] = useState<string>("");
  const [availableTabs, setAvailableTabs] = useState<any[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [featuredOrder, setFeaturedOrder] = useState<string>("");
  const [bannerMedia, setBannerMedia] = useState<File | null>(null);
  const [mobileBannerMedia, setMobileBannerMedia] = useState<File | null>(null);

  // Fetch available tabs on mount
  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const { data, error } = await api.projectTabs.getAll();
        if (!error && data) {
          setAvailableTabs(data);
        }
      } catch (err) {
        console.error("Error fetching tabs:", err);
      }
    };
    fetchTabs();
  }, []);

  // Dosya inputları için handlerlar
  const handleBannerChange = (file: File | null) => {
    setBannerMedia(file);
  };

  const handleMobileBannerChange = (file: File | null) => {
    setMobileBannerMedia(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !slug.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Uyarı!",
        text: "Başlık ve slug zorunludur.",
      });
      return;
    }

    // Featured proje sayısını kontrol et
    if (isFeatured) {
      try {
        const { data: existingProjects, error: getError } = await api.projects.getAll();
        if (getError) throw getError;
        
        if (existingProjects) {
          const featuredCount = existingProjects.filter(p => p.is_featured).length;
          
          // Eğer bu proje zaten featured ise sayıyı azalt
          const currentProject = existingProjects.find(p => p.slug === slug);
          const adjustedCount = currentProject && currentProject.is_featured ? featuredCount - 1 : featuredCount;
          
          if (adjustedCount >= 4) {
            const result = await Swal.fire({
              icon: "warning",
              title: "Uyarı!",
              text: `Şu anda ${adjustedCount} featured proje var. Anasayfada sadece 4 featured proje gösterilir. Bu projeyi featured yapmak istediğinize emin misiniz?`,
              showCancelButton: true,
              confirmButtonText: "Evet, Featured Yap",
              cancelButtonText: "İptal"
            });
            
            if (!result.isConfirmed) {
              return;
            }
          }
        }
      } catch (err) {
        console.error("Featured proje sayısı kontrol edilemedi:", err);
      }
    }

    try {
      // Resimleri yükle
      let bannerPath = "";
      let mobileBannerPath = "";

      if (bannerMedia) {
        const timestamp = Date.now();
        const fileName = `project-banner-${timestamp}-${Math.random().toString(36).substring(2)}.${bannerMedia.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await storageUtils.uploadFile(bannerMedia, fileName);
        if (uploadError) throw uploadError;
        bannerPath = `/uploads/${fileName}`;
      }

      if (mobileBannerMedia) {
        const timestamp = Date.now();
        const fileName = `project-banner-mobile-${timestamp}-${Math.random().toString(36).substring(2)}.${mobileBannerMedia.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await storageUtils.uploadFile(mobileBannerMedia, fileName);
        if (uploadError) throw uploadError;
        mobileBannerPath = `/uploads/${fileName}`;
      }

      const projectData = {
        title,
        subtitle,
        slug,
        description,
        external_link: externalLink,
        client_name: clientName,
        tab1,
        tab2,
        project_tab_id: projectTabId || null,
        is_featured: isFeatured,
        featured_order: parseInt(featuredOrder) || 0,
        banner_media: bannerPath || null,
        mobile_image_url: mobileBannerPath || null
      };

      if (mode === "new") {
        const { data, error } = await api.projects.create(projectData);
        if (error) throw error;
      } else {
        // Edit mode için slug'ı kullanarak projeyi bul ve güncelle
        const { data: existingProjects, error: getError } = await api.projects.getAll();
        if (getError) throw getError;
        
        if (!existingProjects) throw new Error("Projeler yüklenemedi");
        
        const existingProject = existingProjects.find(p => p.slug === slug);
        if (!existingProject) throw new Error("Proje bulunamadı");
        
        const { error } = await api.projects.update(existingProject.id.toString(), projectData);
        if (error) throw error;
      }

      Swal.fire({
        icon: "success",
        title: "Başarılı!",
        text: `Proje ${mode === "new" ? "eklendi" : "güncellendi"}!`,
        timer: 2000,
        showConfirmButton: false,
      });

      if (mode === "new") {
        // Yeni proje eklendiğinde projects sayfasına yönlendir
        navigate("/admin/projects");
        return;
      }
    } catch (err) {
      console.error("Proje kaydetme hatası:", err);
      Swal.fire({
        icon: "error",
        title: "Hata!",
        text: "İşlem sırasında hata oluştu.",
      });
    }
  };

  return (
    <FormLayout title={mode === "new" ? "New Project" : "Edit Project"} backUrl="/admin/projects">
      <form onSubmit={handleSubmit} className="space-y-6">
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
        />

        <FormInput
          label="Slug"
          value={slug}
          onChange={(value) => setSlug(value.toLowerCase())}
          required
          helperText="URL için kullanılacak benzersiz tanımlayıcı (otomatik küçük harfe çevrilir)"
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

        <FormSelect
          label="Project Tab (Kategori)"
          value={projectTabId}
          onChange={(value) => setProjectTabId(value)}
          options={[
            { value: "", label: "Kategori Seçiniz" },
            ...availableTabs.map(tab => ({ value: tab.id, label: tab.name }))
          ]}
          helperText="Projenin hangi kategoriye ait olduğunu seçin (filtreleme için)"
        />

        <FormFileInput
          label="Desktop Banner (Görsel veya Video)"
          accept="image/*,video/*"
          onChange={handleBannerChange}
          helperText={bannerMedia ? `Seçilen dosya: ${bannerMedia.name}` : "Proje için desktop banner görseli veya video yükleyin"}
        />

        <FormFileInput
          label="Mobile Banner (Görsel veya Video)"
          accept="image/*,video/*"
          onChange={handleMobileBannerChange}
          helperText={mobileBannerMedia ? `Seçilen dosya: ${mobileBannerMedia.name}` : "Proje için mobile banner görseli veya video yükleyin (opsiyonel)"}
        />

        <FormCheckbox
          label="Featured (Anasayfada Göster)"
          checked={isFeatured}
          onChange={async (checked) => {
            if (checked) {
              try {
                const { data: existingProjects, error: getError } = await api.projects.getAll();
                if (getError) throw getError;
                
                if (existingProjects) {
                  const featuredCount = existingProjects.filter(p => p.is_featured).length;
                  
                  // Eğer bu proje zaten featured ise sayıyı azalt
                  const currentProject = existingProjects.find(p => p.slug === slug);
                  const adjustedCount = currentProject && currentProject.is_featured ? featuredCount - 1 : featuredCount;
                  
                  if (adjustedCount >= 4) {
                    const result = await Swal.fire({
                      icon: "warning",
                      title: "Uyarı!",
                      text: `Şu anda ${adjustedCount} featured proje var. Anasayfada sadece 4 featured proje gösterilir. Bu projeyi featured yapmak istediğinize emin misiniz?`,
                      showCancelButton: true,
                      confirmButtonText: "Evet, Featured Yap",
                      cancelButtonText: "İptal"
                    });
                    
                    if (!result.isConfirmed) {
                      return; // Checkbox'ı işaretleme
                    }
                  }
                }
              } catch (err) {
                console.error("Featured proje sayısı kontrol edilemedi:", err);
                return; // Hata durumunda checkbox'ı işaretleme
              }
            }
            
            setIsFeatured(checked);
          }}
        />

        <FormInput
          label="Featured Sırası"
          type="number"
          value={featuredOrder}
          onChange={(value) => setFeaturedOrder(value)}
          min={0}
          helperText="Anasayfada gösterim sırası (sayı ne kadar küçükse o kadar üstte görünür)"
        />

        <FormActions>
          <FormButton type="submit" variant="primary">
            {mode === "new" ? "Proje Ekle" : "Projeyi Güncelle"}
          </FormButton>
        </FormActions>
      </form>
    </FormLayout>
  );
};

export default ProjectForm;

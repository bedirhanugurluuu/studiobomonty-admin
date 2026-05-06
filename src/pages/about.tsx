import React, { useEffect, useState } from "react";
import { useBreadcrumb } from "../contexts/BreadcrumbContext";
import { api } from "../utils/api";
import { storageUtils } from "../utils/supabaseStorage";
import Swal from "sweetalert2";


interface AboutContent {
  id?: number;
  title: string;
  subtitle: string;
  main_text: string;
  about_us_text?: string;
  refined_values_title?: string;
  refined_value_1?: string;
  refined_value_2?: string;
  refined_value_3?: string;
  refined_value_4?: string;
  refined_value_5?: string;
  refined_value_6?: string;
  refined_value_image_1?: string;
  refined_value_image_2?: string;
  refined_value_image_3?: string;
  refined_value_image_4?: string;
  refined_value_image_5?: string;
  refined_value_image_6?: string;
  show_recognition?: boolean;
  show_clients?: boolean;
  image_path?: string;
}

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent>({
    title: "",
    subtitle: "",
    main_text: "",
    about_us_text: "",
    refined_values_title: "",
    refined_value_1: "",
    refined_value_2: "",
    refined_value_3: "",
    refined_value_4: "",
    refined_value_5: "",
    refined_value_6: "",
    refined_value_image_1: "",
    refined_value_image_2: "",
    refined_value_image_3: "",
    refined_value_image_4: "",
    refined_value_image_5: "",
    refined_value_image_6: "",
    show_recognition: true,
    show_clients: true,
    image_path: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [refinedImageFiles, setRefinedImageFiles] = useState<Record<number, File | null>>({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { setBreadcrumbs, setIsLoading: setGlobalLoading } = useBreadcrumb();

  useEffect(() => {
    setBreadcrumbs([
      { name: "Dashboard", to: "/admin/dashboard" },
      { name: "About" }
    ]);

    // Mevcut içeriği yükle
    setGlobalLoading(true);
    api.about.get()
      .then((aboutRes) => {
        // API'den gelen verileri güvenli bir şekilde set et
        const data = aboutRes.data;
        setContent({
          title: data.title || "",
          subtitle: data.subtitle || "",
          main_text: data.main_text || "",
          about_us_text: data.about_us_text || "",
          refined_values_title: data.refined_values_title || "",
          refined_value_1: data.refined_value_1 || "",
          refined_value_2: data.refined_value_2 || "",
          refined_value_3: data.refined_value_3 || "",
          refined_value_4: data.refined_value_4 || "",
          refined_value_5: data.refined_value_5 || "",
          refined_value_6: data.refined_value_6 || "",
          refined_value_image_1: data.refined_value_image_1 || "",
          refined_value_image_2: data.refined_value_image_2 || "",
          refined_value_image_3: data.refined_value_image_3 || "",
          refined_value_image_4: data.refined_value_image_4 || "",
          refined_value_image_5: data.refined_value_image_5 || "",
          refined_value_image_6: data.refined_value_image_6 || "",
          show_recognition: data.show_recognition !== false,
          show_clients: data.show_clients !== false,
          image_path: data.image_path || "",
        });
        setGlobalLoading(false);
      })
      .catch(err => {
        console.error("About içeriği yüklenemedi:", err);
        setGlobalLoading(false);
      });
  }, [setBreadcrumbs, setGlobalLoading]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let newImagePath = content.image_path;
      const refinedImagePaths: Record<number, string> = {
        1: content.refined_value_image_1 || "",
        2: content.refined_value_image_2 || "",
        3: content.refined_value_image_3 || "",
        4: content.refined_value_image_4 || "",
        5: content.refined_value_image_5 || "",
        6: content.refined_value_image_6 || "",
      };

      // Yeni resim yüklendiyse
      if (imageFile) {
        console.log('=== ABOUT RESİM İŞLEMİ BAŞLADI ===');
        console.log('Eski resim path:', content.image_path);
        console.log('Yeni resim file:', imageFile.name);
        
        // Eski resmi sil (eğer varsa)
        if (content.image_path) {
          console.log('Eski resim siliniyor:', content.image_path);
          await storageUtils.deleteFile(content.image_path);
        }
        
        // Yeni resmi yükle
        const timestamp = Date.now();
        const fileName = `about-${timestamp}-${Math.random().toString(36).substring(2)}.${imageFile.name.split('.').pop()}`;
        console.log('Yeni resim yükleniyor:', fileName);
        
        const { data: uploadData, error: uploadError } = await storageUtils.uploadFile(imageFile, fileName);
        if (uploadError) throw uploadError;
        
        newImagePath = fileName;
        console.log('Resim yüklendi:', newImagePath);
        console.log('=== ABOUT RESİM İŞLEMİ BİTTİ ===');
      }

      for (let i = 1; i <= 6; i++) {
        const selectedFile = refinedImageFiles[i];
        if (!selectedFile) continue;

        const currentPath = refinedImagePaths[i];
        if (currentPath) {
          await storageUtils.deleteFile(currentPath);
        }

        const timestamp = Date.now();
        const extension = selectedFile.name.split(".").pop() || "jpg";
        const fileName = `about-refined-${i}-${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;
        const { error: uploadError } = await storageUtils.uploadFile(selectedFile, fileName);
        if (uploadError) throw uploadError;

        refinedImagePaths[i] = fileName;
      }

      const updateData = {
        title: content.title || "",
        subtitle: content.subtitle || "",
        main_text: content.main_text || "",
        about_us_text: content.about_us_text || "",
        refined_values_title: content.refined_values_title || "",
        refined_value_1: content.refined_value_1 || "",
        refined_value_2: content.refined_value_2 || "",
        refined_value_3: content.refined_value_3 || "",
        refined_value_4: content.refined_value_4 || "",
        refined_value_5: content.refined_value_5 || "",
        refined_value_6: content.refined_value_6 || "",
        refined_value_image_1: refinedImagePaths[1],
        refined_value_image_2: refinedImagePaths[2],
        refined_value_image_3: refinedImagePaths[3],
        refined_value_image_4: refinedImagePaths[4],
        refined_value_image_5: refinedImagePaths[5],
        refined_value_image_6: refinedImagePaths[6],
        show_recognition: content.show_recognition !== false,
        show_clients: content.show_clients !== false,
        image_path: newImagePath,
      };

      const { error } = await api.about.update(updateData);
      if (error) throw error;

      Swal.fire({
        icon: "success",
        title: "Başarılı!",
        text: "About sayfası güncellendi.",
        timer: 2000,
        showConfirmButton: false,
      });
      setRefinedImageFiles({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
    } catch (err) {
      console.error("Güncelleme hatası:", err);
      Swal.fire({
        icon: "error",
        title: "Hata!",
        text: "Güncelleme sırasında hata oluştu.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleRefinedImageChange = (index: number, file: File | null) => {
    setRefinedImageFiles((prev) => ({ ...prev, [index]: file }));
  };

  const handleDeleteRefinedImage = async (index: number) => {
    const key = `refined_value_image_${index}` as keyof AboutContent;
    const currentPath = (content[key] as string) || "";
    if (!currentPath) return;

    const confirm = await Swal.fire({
      icon: "warning",
      title: "Görsel silinsin mi?",
      text: `${index.toString().padStart(2, "0")} başlığına ait görsel silinecek.`,
      showCancelButton: true,
      confirmButtonText: "Evet, sil",
      cancelButtonText: "Vazgeç",
    });

    if (!confirm.isConfirmed) return;

    const { error } = await storageUtils.deleteFile(currentPath);
    if (error) {
      Swal.fire({
        icon: "error",
        title: "Hata!",
        text: "Görsel storage'dan silinemedi.",
      });
      return;
    }

    setContent((prev) => ({ ...prev, [key]: "" }));
    setRefinedImageFiles((prev) => ({ ...prev, [index]: null }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">About Sayfası Düzenle</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Ana Bölüm */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Ana Bölüm</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Ana Başlık</label>
              <input
                type="text"
                value={content.title || ""}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                className="input input-bordered w-full"
                placeholder="About Us"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Alt Başlık</label>
              <input
                type="text"
                value={content.subtitle || ""}
                onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                className="input input-bordered w-full"
                placeholder="A collective of visionaries shaping tomorrow"
                required
              />
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Ana Metin</label>
            <textarea
              value={content.main_text || ""}
              onChange={(e) => setContent({ ...content, main_text: e.target.value })}
              className="textarea textarea-bordered w-full h-32 p-2"
              placeholder="Ana metin içeriği..."
              required
            />
          </div>
        </div>

        {/* Görsel */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Görsel</h2>
          {content.image_path && (
            <div className="mb-4">
              <img
                src={`https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${content.image_path}`}
                alt="Mevcut görsel"
                className="w-64 h-48 object-cover rounded border"
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input file-input-bordered w-full"
          />
          {imageFile && (
            <p className="text-sm text-gray-600 mt-2">
              Yeni seçilen: {imageFile.name}
            </p>
          )}
        </div>

        {/* About Us Yazısı */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">About Us Yazısı</h2>
          <textarea
            value={content.about_us_text || ""}
            onChange={(e) => setContent({ ...content, about_us_text: e.target.value })}
            className="textarea textarea-bordered w-full h-40 p-2"
            placeholder="About us bölümünde görünecek uzun metni buraya yazın..."
            required
          />
        </div>

        {/* Refined Studio Bomonty Values */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Refined Values</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Sol Başlık</label>
            <input
              type="text"
              value={content.refined_values_title || ""}
              onChange={(e) => setContent({ ...content, refined_values_title: e.target.value })}
              className="input input-bordered w-full"
              placeholder="REFINED STUDIO BOMONTY VALUES"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-base-200 rounded-lg">
              <label className="block text-sm font-medium mb-2">01 Başlık Metni</label>
              <textarea
                value={content.refined_value_1 || ""}
                onChange={(e) => setContent({ ...content, refined_value_1: e.target.value })}
                className="textarea textarea-bordered w-full h-24 p-2 resize-none"
                required
              />
              <label className="block text-sm font-medium mt-3 mb-2">01 Görsel</label>
              {content.refined_value_image_1 && (
                <div className="mb-2">
                  <img
                    src={`https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${content.refined_value_image_1}`}
                    alt="Refined value 01"
                    className="w-full max-w-xs h-32 object-cover rounded border"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => handleRefinedImageChange(1, e.target.files?.[0] || null)}
                className="file-input file-input-bordered w-full"
              />
              {refinedImageFiles[1] && <p className="text-xs mt-1">Seçilen: {refinedImageFiles[1]?.name}</p>}
              {content.refined_value_image_1 && (
                <button type="button" className="btn btn-sm btn-outline btn-error mt-2" onClick={() => handleDeleteRefinedImage(1)}>
                  Görseli Sil
                </button>
              )}
            </div>
            <div className="p-4 bg-base-200 rounded-lg">
              <label className="block text-sm font-medium mb-2">02 Başlık Metni</label>
              <textarea
                value={content.refined_value_2 || ""}
                onChange={(e) => setContent({ ...content, refined_value_2: e.target.value })}
                className="textarea textarea-bordered w-full h-24 p-2 resize-none"
                required
              />
              <label className="block text-sm font-medium mt-3 mb-2">02 Görsel</label>
              {content.refined_value_image_2 && (
                <div className="mb-2">
                  <img
                    src={`https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${content.refined_value_image_2}`}
                    alt="Refined value 02"
                    className="w-full max-w-xs h-32 object-cover rounded border"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => handleRefinedImageChange(2, e.target.files?.[0] || null)}
                className="file-input file-input-bordered w-full"
              />
              {refinedImageFiles[2] && <p className="text-xs mt-1">Seçilen: {refinedImageFiles[2]?.name}</p>}
              {content.refined_value_image_2 && (
                <button type="button" className="btn btn-sm btn-outline btn-error mt-2" onClick={() => handleDeleteRefinedImage(2)}>
                  Görseli Sil
                </button>
              )}
            </div>
            <div className="p-4 bg-base-200 rounded-lg">
              <label className="block text-sm font-medium mb-2">03 Başlık Metni</label>
              <textarea
                value={content.refined_value_3 || ""}
                onChange={(e) => setContent({ ...content, refined_value_3: e.target.value })}
                className="textarea textarea-bordered w-full h-24 p-2"
                required
              />
              <label className="block text-sm font-medium mt-3 mb-2">03 Görsel</label>
              {content.refined_value_image_3 && (
                <div className="mb-2">
                  <img
                    src={`https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${content.refined_value_image_3}`}
                    alt="Refined value 03"
                    className="w-full max-w-xs h-32 object-cover rounded border"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => handleRefinedImageChange(3, e.target.files?.[0] || null)}
                className="file-input file-input-bordered w-full"
              />
              {refinedImageFiles[3] && <p className="text-xs mt-1">Seçilen: {refinedImageFiles[3]?.name}</p>}
              {content.refined_value_image_3 && (
                <button type="button" className="btn btn-sm btn-outline btn-error mt-2" onClick={() => handleDeleteRefinedImage(3)}>
                  Görseli Sil
                </button>
              )}
            </div>
            <div className="p-4 bg-base-200 rounded-lg">
              <label className="block text-sm font-medium mb-2">04 Başlık Metni</label>
              <textarea
                value={content.refined_value_4 || ""}
                onChange={(e) => setContent({ ...content, refined_value_4: e.target.value })}
                className="textarea textarea-bordered w-full h-24 p-2 resize-none"
                required
              />
              <label className="block text-sm font-medium mt-3 mb-2">04 Görsel</label>
              {content.refined_value_image_4 && (
                <div className="mb-2">
                  <img
                    src={`https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${content.refined_value_image_4}`}
                    alt="Refined value 04"
                    className="w-full max-w-xs h-32 object-cover rounded border"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => handleRefinedImageChange(4, e.target.files?.[0] || null)}
                className="file-input file-input-bordered w-full"
              />
              {refinedImageFiles[4] && <p className="text-xs mt-1">Seçilen: {refinedImageFiles[4]?.name}</p>}
              {content.refined_value_image_4 && (
                <button type="button" className="btn btn-sm btn-outline btn-error mt-2" onClick={() => handleDeleteRefinedImage(4)}>
                  Görseli Sil
                </button>
              )}
            </div>
            <div className="p-4 bg-base-200 rounded-lg">
              <label className="block text-sm font-medium mb-2">05 Başlık Metni</label>
              <textarea
                value={content.refined_value_5 || ""}
                onChange={(e) => setContent({ ...content, refined_value_5: e.target.value })}
                className="textarea textarea-bordered w-full h-24 p-2 resize-none"
                required
              />
              <label className="block text-sm font-medium mt-3 mb-2">05 Görsel</label>
              {content.refined_value_image_5 && (
                <div className="mb-2">
                  <img
                    src={`https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${content.refined_value_image_5}`}
                    alt="Refined value 05"
                    className="w-full max-w-xs h-32 object-cover rounded border"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => handleRefinedImageChange(5, e.target.files?.[0] || null)}
                className="file-input file-input-bordered w-full"
              />
              {refinedImageFiles[5] && <p className="text-xs mt-1">Seçilen: {refinedImageFiles[5]?.name}</p>}
              {content.refined_value_image_5 && (
                <button type="button" className="btn btn-sm btn-outline btn-error mt-2" onClick={() => handleDeleteRefinedImage(5)}>
                  Görseli Sil
                </button>
              )}
            </div>
            <div className="p-4 bg-base-200 rounded-lg">
              <label className="block text-sm font-medium mb-2">06 Başlık Metni</label>
              <textarea
                value={content.refined_value_6 || ""}
                onChange={(e) => setContent({ ...content, refined_value_6: e.target.value })}
                className="textarea textarea-bordered w-full h-24 p-2 resize-none"
                required
              />
              <label className="block text-sm font-medium mt-3 mb-2">06 Görsel</label>
              {content.refined_value_image_6 && (
                <div className="mb-2">
                  <img
                    src={`https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/${content.refined_value_image_6}`}
                    alt="Refined value 06"
                    className="w-full max-w-xs h-32 object-cover rounded border"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => handleRefinedImageChange(6, e.target.files?.[0] || null)}
                className="file-input file-input-bordered w-full"
              />
              {refinedImageFiles[6] && <p className="text-xs mt-1">Seçilen: {refinedImageFiles[6]?.name}</p>}
              {content.refined_value_image_6 && (
                <button type="button" className="btn btn-sm btn-outline btn-error mt-2" onClick={() => handleDeleteRefinedImage(6)}>
                  Görseli Sil
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Kaydet Butonu */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full"
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            "Kaydet"
          )}
        </button>
      </form>
    </div>
  );
}

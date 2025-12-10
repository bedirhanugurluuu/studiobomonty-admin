// pages/intro-banners/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { api } from "../../utils/api";
import { storageUtils } from "../../utils/supabaseStorage";
import { useBreadcrumb } from "../../contexts/BreadcrumbContext";
import { getImageUrl, getFallbackImageUrl } from "../../utils/imageUtils";

interface BannerFormState {
  id?: string;
  title_line1: string;
  image?: string;
  mobile_image_url?: string;
}

export default function IntroBannerSettingsPage() {
  const [form, setForm] = useState<BannerFormState>({
    title_line1: "",
    image: undefined,
    mobile_image_url: undefined,
  });
  const [file, setFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mobilePreviewUrl, setMobilePreviewUrl] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | undefined>(undefined);
  const [originalMobileImage, setOriginalMobileImage] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const { setBreadcrumbs, setIsLoading } = useBreadcrumb();

  useEffect(() => {
    setBreadcrumbs([
      { name: "Dashboard", to: "/admin/dashboard" },
      { name: "Intro Banner" },
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    setIsLoading(true);
    api.introBanner
      .get()
      .then(({ data, error }) => {
        if (error) throw error;
        if (data) {
          setForm({
            id: data.id,
            title_line1: data.title_line1 ?? "",
            image: data.image ?? undefined,
            mobile_image_url: data.mobile_image_url ?? undefined,
          });
          setOriginalImage(data.image ?? undefined);
          setOriginalMobileImage(data.mobile_image_url ?? undefined);
        }
      })
      .catch((err) => {
        console.error("Intro banner yüklenemedi:", err);
        Swal.fire({
          icon: "error",
          title: "Hata",
          text: "Intro banner verisi alınamadı.",
        });
      })
      .finally(() => setTimeout(() => setIsLoading(false), 100));
  }, [setIsLoading]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (mobilePreviewUrl) {
        URL.revokeObjectURL(mobilePreviewUrl);
      }
    };
  }, [previewUrl, mobilePreviewUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files && e.target.files[0];
    if (selected) {
      setFile(selected);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files && e.target.files[0];
    if (selected) {
      setMobileFile(selected);
      if (mobilePreviewUrl) {
        URL.revokeObjectURL(mobilePreviewUrl);
      }
      setMobilePreviewUrl(URL.createObjectURL(selected));
    }
  };

  const removeCurrentMedia = async () => {
    if (!form.image) return;
    const result = await Swal.fire({
      title: "Mevcut medyayı kaldır?",
      text: "Bu işlem medyayı kalıcı olarak silecektir.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Evet, kaldır",
      cancelButtonText: "İptal",
    });

    if (!result.isConfirmed) return;

    setIsSaving(true);
    try {
      await storageUtils.deleteFile(form.image);
      setForm((prev) => ({ ...prev, image: undefined }));
      setOriginalImage(undefined);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setFile(null);
      Swal.fire({
        icon: "success",
        title: "Silindi",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Medya silme hatası:", err);
      Swal.fire({
        icon: "error",
        title: "Hata",
        text: "Medya silinemedi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const removeCurrentMobileMedia = async () => {
    if (!form.mobile_image_url) return;
    const result = await Swal.fire({
      title: "Mevcut mobile medyayı kaldır?",
      text: "Bu işlem mobile medyayı kalıcı olarak silecektir.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Evet, kaldır",
      cancelButtonText: "İptal",
    });

    if (!result.isConfirmed) return;

    setIsSaving(true);
    try {
      await storageUtils.deleteFile(form.mobile_image_url);
      setForm((prev) => ({ ...prev, mobile_image_url: undefined }));
      setOriginalMobileImage(undefined);
      if (mobilePreviewUrl) {
        URL.revokeObjectURL(mobilePreviewUrl);
        setMobilePreviewUrl(null);
      }
      setMobileFile(null);
      Swal.fire({
        icon: "success",
        title: "Silindi",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Mobile medya silme hatası:", err);
      Swal.fire({
        icon: "error",
        title: "Hata",
        text: "Mobile medya silinemedi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title_line1.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Başlık gerekli",
        text: "Lütfen ana başlık alanını doldurun.",
      });
      return;
    }

    setIsSaving(true);

    try {
      let mediaPath = form.image;
      let mobileMediaPath = form.mobile_image_url;

      // Desktop image upload
      if (file) {
        if (originalImage) {
          await storageUtils.deleteFile(originalImage);
        }

        const timestamp = Date.now();
        const extension = file.name.split(".").pop();
        const filename = `intro-banner-${timestamp}-${Math.random().toString(36).slice(2)}.${extension}`;
        const { error: uploadError } = await storageUtils.uploadFile(file, filename);
        if (uploadError) throw uploadError;
        mediaPath = `/uploads/${filename}`;
        setOriginalImage(mediaPath);
      }

      // Mobile image upload
      if (mobileFile) {
        if (originalMobileImage) {
          await storageUtils.deleteFile(originalMobileImage);
        }

        const timestamp = Date.now();
        const extension = mobileFile.name.split(".").pop();
        const filename = `intro-banner-mobile-${timestamp}-${Math.random().toString(36).slice(2)}.${extension}`;
        const { error: uploadError } = await storageUtils.uploadFile(mobileFile, filename);
        if (uploadError) throw uploadError;
        mobileMediaPath = `/uploads/${filename}`;
        setOriginalMobileImage(mobileMediaPath);
      }

      const payload = {
        id: form.id,
        title_line1: form.title_line1,
        image: mediaPath ?? null,
        mobile_image_url: mobileMediaPath ?? null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await api.introBanner.upsert(payload);
      if (error) throw error;

      setForm((prev) => ({
        ...prev,
        id: data.id,
        image: data.image ?? mediaPath ?? undefined,
        mobile_image_url: data.mobile_image_url ?? mobileMediaPath ?? undefined,
      }));
      setFile(null);
      setMobileFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      if (mobilePreviewUrl) {
        URL.revokeObjectURL(mobilePreviewUrl);
        setMobilePreviewUrl(null);
      }

      Swal.fire({
        icon: "success",
        title: "Kaydedildi",
        text: "Intro banner güncellendi.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error("Banner kaydetme hatası:", err);
      Swal.fire({
        icon: "error",
        title: "Hata",
        text: err?.message ?? "Banner kaydedilemedi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const mediaPreview = useMemo(() => {
    const url = previewUrl || (form.image ? getImageUrl(form.image) : null);
    if (!url) return null;
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url);

    return isVideo ? (
      <video
        src={url}
        controls
        className="w-full max-h-80 rounded-lg object-cover"
      />
    ) : (
      <img
        src={url}
        alt="Intro banner media"
        className="w-full max-h-80 rounded-lg object-cover"
        onError={(e) => {
          e.currentTarget.src = getFallbackImageUrl();
        }}
      />
    );
  }, [previewUrl, form.image]);

  const mobileMediaPreview = useMemo(() => {
    const url = mobilePreviewUrl || (form.mobile_image_url ? getImageUrl(form.mobile_image_url) : null);
    if (!url) return null;
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url);

    return isVideo ? (
      <video
        src={url}
        controls
        className="w-full max-h-80 rounded-lg object-cover"
      />
    ) : (
      <img
        src={url}
        alt="Intro banner mobile media"
        className="w-full max-h-80 rounded-lg object-cover"
        onError={(e) => {
          e.currentTarget.src = getFallbackImageUrl();
        }}
      />
    );
  }, [mobilePreviewUrl, form.mobile_image_url]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Intro Banner Ayarları</h1>
          <p className="text-sm text-base-content/60">
            Ana sayfada görünen intro banner'ı buradan yönetebilirsiniz.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        <div className="space-y-2">
          <label className="font-semibold">Banner Başlığı</label>
          <input
            name="title_line1"
            value={form.title_line1}
            onChange={handleInputChange}
            className="input input-bordered w-full"
            placeholder="Örn: Creative studio"
          />
        </div>

        <div className="space-y-3">
          <label className="font-semibold">Desktop Görsel / Video</label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="file-input file-input-bordered w-full"
          />
          {mediaPreview}
          {(form.image || previewUrl) && (
            <button
              type="button"
              onClick={removeCurrentMedia}
              className="btn btn-outline btn-error btn-sm"
              disabled={isSaving}
            >
              Mevcut Desktop Medyayı Kaldır
            </button>
          )}
          <p className="text-xs text-base-content/60">
            Video yükleyecekseniz MP4 veya WebM formatlarını tercih edin. Dosya boyutunu optimize etmeyi unutmayın.
          </p>
        </div>

        <div className="space-y-3">
          <label className="font-semibold">Mobile Görsel / Video</label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleMobileFileChange}
            className="file-input file-input-bordered w-full"
          />
          {mobileMediaPreview}
          {(form.mobile_image_url || mobilePreviewUrl) && (
            <button
              type="button"
              onClick={removeCurrentMobileMedia}
              className="btn btn-outline btn-error btn-sm"
              disabled={isSaving}
            >
              Mevcut Mobile Medyayı Kaldır
            </button>
          )}
          <p className="text-xs text-base-content/60">
            Mobile cihazlar için ayrı görsel/video yükleyebilirsiniz. Video yükleyecekseniz MP4 veya WebM formatlarını tercih edin.
          </p>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSaving}
        >
          {isSaving ? <span className="loading loading-spinner loading-sm" /> : "Kaydet"}
        </button>
      </form>
    </div>
  );
}

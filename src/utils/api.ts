import { supabase } from '../config/supabase'
import { storageUtils } from './supabaseStorage'
import { Project } from '../types/Project'

// Generic CRUD operations
export const api = {
  // Projects
  projects: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      return { data, error }
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    },

    create: async (project: any) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single()
      return { data, error }
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    },

    delete: async (project: Project) => {
      try {
        let projectId = project.id
        let bannerMedia = project.banner_media

        if (!projectId) {
          // Fall back to slug lookup
          const { data: projectRow, error: fetchError } = await supabase
            .from('projects')
            .select('id, banner_media')
            .eq('slug', project.slug)
            .single()

          if (fetchError) throw fetchError
          projectId = projectRow?.id as string
          bannerMedia = bannerMedia ?? (projectRow?.banner_media as string | null) ?? undefined
        }

        if (!projectId) {
          throw new Error('Project ID bulunamadı')
        }

        // Fetch gallery images
        const { data: gallery, error: galleryError } = await supabase
          .from('project_gallery')
          .select('image_path')
          .eq('project_id', projectId)

        if (galleryError && galleryError.code !== 'PGRST116') {
          throw galleryError
        }

        // Collect all files to delete
        const filesToDelete = [
          bannerMedia ?? null,
          ...(gallery?.map((item) => item.image_path) ?? []),
        ].filter((item): item is string => !!item)

        // Delete files from storage
        for (const filePath of filesToDelete) {
          await storageUtils.deleteFile(filePath)
        }

        // Delete gallery records
        await supabase
          .from('project_gallery')
          .delete()
          .eq('project_id', projectId)

        // Finally delete the project
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId)

        return { error }
      } catch (error) {
        console.error('Project delete error:', error)
        return { error }
      }
    }
  },

  // News
  news: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
      return { data, error }
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    },

    create: async (news: any) => {
      const { data, error } = await supabase
        .from('news')
        .insert(news)
        .select()
        .single()
      return { data, error }
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('news')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id)
      return { error }
    }
  },

  // Intro Banners
  introBanner: {
    get: async () => {
      const { data, error } = await supabase
        .from('intro_banners')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return { data, error }
    },

    upsert: async (banner: any) => {
      const payload = {
        id: banner.id,
        title_line1: banner.title_line1 ?? "",
        image: banner.image ?? null,
        updated_at: banner.updated_at ?? new Date().toISOString(),
      }

      if (!payload.id) {
        payload.id =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      }

      const { data, error } = await supabase
        .from('intro_banners')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single()
      return { data, error }
    },
  },

  // Journal Banners
  journalBanner: {
    get: async () => {
      const { data, error } = await supabase
        .from('journal_banners')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return { data, error }
    },

    upsert: async (banner: any) => {
      const payload = {
        id: banner.id,
        title_line1: banner.title_line1 ?? "",
        image: banner.image ?? null,
        updated_at: banner.updated_at ?? new Date().toISOString(),
      }

      if (!payload.id) {
        payload.id =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      }

      const { data, error } = await supabase
        .from('journal_banners')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single()
      return { data, error }
    },
  },

  // Awards
  awards: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('awards')
        .select('*')
        .order('created_at', { ascending: false })
      return { data, error }
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('awards')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    },

    create: async (award: any) => {
      const { data, error } = await supabase
        .from('awards')
        .insert(award)
        .select()
        .single()
      return { data, error }
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('awards')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('awards')
        .delete()
        .eq('id', id)
      return { error }
    }
  },

  // Slider
  slider: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('about_slider')
        .select('*')
        .order('order_index', { ascending: true })
      return { data, error }
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('about_slider')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    },

    create: async (slider: any) => {
      const { data, error } = await supabase
        .from('about_slider')
        .insert(slider)
        .select()
        .single()
      return { data, error }
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('about_slider')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('about_slider')
        .delete()
        .eq('id', id)
      return { error }
    }
  },

  // About
  about: {
    get: async () => {
      const { data, error } = await supabase
        .from('about_content')
        .select('*')
        .single() // Tablo dolu olduğu için single() kullan
      return { data, error }
    },

    update: async (updates: any) => {
      // Önce mevcut about_content kaydını al
      const { data: existingData, error: getError } = await supabase
        .from('about_content')
        .select('id')
        .single() // Tablo dolu olduğu için single() kullan
      
      if (getError) {
        // Eğer kayıt yoksa yeni kayıt oluştur
        const { data, error } = await supabase
          .from('about_content')
          .insert(updates)
          .select()
          .single()
        return { data, error }
      }

      // Mevcut kaydı güncelle
      const { data, error } = await supabase
        .from('about_content')
        .update(updates)
        .eq('id', existingData.id) // UUID kullan
        .select()
        .maybeSingle() // single() yerine maybeSingle() kullan
      return { data, error }
    }
  },

  // About Gallery
  aboutGallery: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('about_gallery')
        .select('*')
        .order('created_at', { ascending: false })
      return { data, error }
    },

    getById: async (id: number) => {
      const { data, error } = await supabase
        .from('about_gallery')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    },

    create: async (image: any) => {
      const { data, error } = await supabase
        .from('about_gallery')
        .insert(image)
        .select()
        .single()
      return { data, error }
    },

    delete: async (id: number) => {
      const { error } = await supabase
        .from('about_gallery')
        .delete()
        .eq('id', id)
      return { error }
    }
  },

  // Contact
  contact: {
    get: async () => {
      const { data, error } = await supabase
        .from('contact')
        .select('*')
        .single() // Tablo dolu olduğu için single() kullan
      return { data, error }
    },

    update: async (updates: any) => {
      // Önce mevcut contact kaydını al
      const { data: existingData, error: getError } = await supabase
        .from('contact')
        .select('id')
        .single() // Tablo dolu olduğu için single() kullan
      
      if (getError) {
        // Eğer kayıt yoksa yeni kayıt oluştur
        const { data, error } = await supabase
          .from('contact')
          .insert(updates)
          .select()
          .single()
        return { data, error }
      }

      // Mevcut kaydı güncelle
      const { data, error } = await supabase
        .from('contact')
        .update(updates)
        .eq('id', existingData.id)
        .select()
        .single()
      return { data, error }
    }
  },

  // What We Do
  whatWeDo: {
    get: async () => {
      const { data, error } = await supabase
        .from('what_we_do')
        .select('*')
        .single() // Tablo dolu olduğu için single() kullan
      return { data, error }
    },

    update: async (updates: any) => {
      // Önce mevcut what_we_do kaydını al
      const { data: existingData, error: getError } = await supabase
        .from('what_we_do')
        .select('id')
        .single() // Tablo dolu olduğu için single() kullan
      
      if (getError) {
        // Eğer kayıt yoksa yeni kayıt oluştur
        const { data, error } = await supabase
          .from('what_we_do')
          .insert(updates)
          .select()
          .single()
        return { data, error }
      }

      // Mevcut kaydı güncelle
      const { data, error } = await supabase
        .from('what_we_do')
        .update(updates)
        .eq('id', existingData.id)
        .select()
        .single()
      return { data, error }
    }
  },

  // Project Gallery
  projectGallery: {
    getByProjectId: async (projectId: string) => {
      const { data, error } = await supabase
        .from('project_gallery')
        .select('*')
        .eq('project_id', projectId)
      
      if (error) return { data: null, error }
      
      // Numeric sıralama yap (string sıralama problemi için)
      const sorted = (data || []).sort((a: any, b: any) => {
        const sortA = typeof a.sort === 'number' ? a.sort : parseInt(a.sort) || 0;
        const sortB = typeof b.sort === 'number' ? b.sort : parseInt(b.sort) || 0;
        return sortA - sortB;
      })
      
      return { data: sorted, error: null }
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('project_gallery')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    },

    create: async (image: any) => {
      const { data, error } = await supabase
        .from('project_gallery')
        .insert(image)
        .select()
        .single()
      return { data, error }
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('project_gallery')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    },

    updateByImagePath: async (projectId: string, imagePath: string, updates: any) => {
      const { data, error } = await supabase
        .from('project_gallery')
        .update(updates)
        .eq('project_id', projectId)
        .eq('image_path', imagePath)
        .select()
      return { data, error }
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('project_gallery')
        .delete()
        .eq('id', id)
      return { error }
    },

    deleteByImagePath: async (projectId: string, imagePath: string) => {
      const { error } = await supabase
        .from('project_gallery')
        .delete()
        .eq('project_id', projectId)
        .eq('image_path', imagePath)
      return { error }
    }
  },

  // Services
  services: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('order_index', { ascending: true })
      return { data, error }
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    },

    create: async (service: any) => {
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select()
        .single()
      return { data, error }
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    },

    delete: async (id: string) => {
      const { data: service, error: fetchError } = await supabase
        .from('services')
        .select('image_path')
        .eq('id', id)
        .single()

      if (fetchError) {
        return { error: fetchError }
      }

      // Delete image from storage if exists
      if (service?.image_path) {
        await storageUtils.deleteFile(service.image_path)
      }

      // Delete service record
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
      return { error }
    }
  },

  // Gallery Items
  galleryItems: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
      return { data, error }
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    },

    create: async (item: any) => {
      const { data, error } = await supabase
        .from('gallery_items')
        .insert(item)
        .select()
        .single()
      return { data, error }
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('gallery_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    },

    delete: async (id: string) => {
      try {
        // First, get the item to find the image path
        const { data: item, error: fetchError } = await supabase
          .from('gallery_items')
          .select('image')
          .eq('id', id)
          .single()

        if (fetchError) {
          return { error: fetchError }
        }

        // Delete image from storage if exists (don't fail if storage delete fails)
        if (item?.image) {
          try {
            // Check if it's a storage path (not external URL)
            const isStoragePath = item.image.startsWith('/uploads/') || 
                                  item.image.includes('supabase.co/storage');
            
            if (isStoragePath) {
              const { error: storageError } = await storageUtils.deleteFile(item.image);
              if (storageError) {
                console.warn('Storage silme hatası (devam ediliyor):', storageError);
                // Continue with database deletion even if storage deletion fails
              }
            }
          } catch (storageErr) {
            console.warn('Storage silme hatası (devam ediliyor):', storageErr);
            // Continue with database deletion even if storage deletion fails
          }
        }

        // Delete gallery item record from database
        const { error } = await supabase
          .from('gallery_items')
          .delete()
          .eq('id', id)
        
        return { error }
      } catch (err) {
        console.error('Gallery item silme hatası:', err);
        return { error: err }
      }
    }
  },

  // Recognition
  recognition: {
    get: async () => {
      const { data, error } = await supabase
        .from('recognitions')
        .select('*')
        .limit(1)
        .single()
      return { data, error }
    },

    update: async (updates: any) => {
      // Önce mevcut recognition kaydını al
      const { data: existingData, error: getError } = await supabase
        .from('recognitions')
        .select('id')
        .limit(1)
        .single()
      
      if (getError) {
        // Eğer kayıt yoksa yeni kayıt oluştur
        const { data, error } = await supabase
          .from('recognitions')
          .insert(updates)
          .select()
          .single()
        return { data, error }
      }

      // Mevcut kaydı güncelle
      const { data, error } = await supabase
        .from('recognitions')
        .update(updates)
        .eq('id', existingData.id)
        .select()
        .single()
      return { data, error }
    }
  },

  // Recognition Items
  recognitionItems: {
    getAll: async (recognitionId: string) => {
      const { data, error } = await supabase
        .from('recognition_items')
        .select('*')
        .eq('recognition_id', recognitionId)
        .order('order_index', { ascending: true })
      return { data, error }
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('recognition_items')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    },

    create: async (item: any) => {
      const { data, error } = await supabase
        .from('recognition_items')
        .insert(item)
        .select()
        .single()
      return { data, error }
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('recognition_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('recognition_items')
        .delete()
        .eq('id', id)
      return { error }
    }
  },

  clients: {
    get: async () => {
      const { data, error } = await supabase
        .from('clients_settings')
        .select('*')
        .limit(1)
        .single()
      return { data, error }
    },

    update: async (updates: any) => {
      // Önce mevcut clients_settings kaydını al
      const { data: existingData, error: getError } = await supabase
        .from('clients_settings')
        .select('id')
        .limit(1)
        .single()
      
      if (getError) {
        // Eğer kayıt yoksa yeni kayıt oluştur
        const { data, error } = await supabase
          .from('clients_settings')
          .insert(updates)
          .select()
          .single()
        return { data, error }
      }

      // Mevcut kaydı güncelle
      const { data, error } = await supabase
        .from('clients_settings')
        .update(updates)
        .eq('id', existingData.id)
        .select()
        .single()
      return { data, error }
    }
  },

  clientsItems: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('order_index', { ascending: true })
      return { data, error }
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    },

    create: async (item: any) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(item)
        .select()
        .single()
      return { data, error }
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
      return { error }
    }
  },

  latestProjectsBanner: {
    get: async () => {
      const { data, error } = await supabase
        .from('latest_projects_banner')
        .select('*')
        .limit(1)
        .single()
      return { data, error }
    },

    update: async (updates: any) => {
      // Önce mevcut latest_projects_banner kaydını al
      const { data: existingData, error: getError } = await supabase
        .from('latest_projects_banner')
        .select('id')
        .limit(1)
        .single()
      
      if (getError) {
        // Eğer kayıt yoksa yeni kayıt oluştur
        const { data, error } = await supabase
          .from('latest_projects_banner')
          .insert(updates)
          .select()
          .single()
        return { data, error }
      }

      // Mevcut kaydı güncelle
      const { data, error } = await supabase
        .from('latest_projects_banner')
        .update(updates)
        .eq('id', existingData.id)
        .select()
        .single()
      return { data, error }
    }
  },

  projectTeamMembers: {
    getAll: async (projectId: string) => {
      const { data, error } = await supabase
        .from('project_team_members')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })
      return { data, error }
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('project_team_members')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    },

    create: async (member: any) => {
      const { data, error } = await supabase
        .from('project_team_members')
        .insert(member)
        .select()
        .single()
      return { data, error }
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('project_team_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('project_team_members')
        .delete()
        .eq('id', id)
      return { error }
    }
  },

  // Project Tabs
  projectTabs: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('project_tabs')
        .select('*')
        .order('order_index', { ascending: true })
      return { data, error }
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('project_tabs')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    },

    create: async (tab: any) => {
      const { data, error } = await supabase
        .from('project_tabs')
        .insert(tab)
        .select()
        .single()
      return { data, error }
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('project_tabs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('project_tabs')
        .delete()
        .eq('id', id)
      return { error }
    }
  }
}

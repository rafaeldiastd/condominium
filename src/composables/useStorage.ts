import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export interface UploadProgress {
  file: File
  progress: number
  url?: string
  storagePath?: string
  error?: string
}

export function useStorage() {
  const authStore = useAuthStore()
  const uploading = ref(false)
  const uploadProgress = ref<UploadProgress[]>([])

  function getPublicUrl(bucket: string, path: string, transform?: { width?: number; height?: number; quality?: number }): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
      transform: transform ? {
        width: transform.width,
        height: transform.height,
        quality: transform.quality,
      } : undefined
    })
    return data.publicUrl
  }

  async function uploadFile(
    bucket: string,
    path: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ url: string; storagePath: string } | null> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: false, contentType: file.type })

      if (error) throw error

      onProgress?.(100)
      const url = getPublicUrl(bucket, path)
      return { url, storagePath: path }
    } catch {
      return null
    }
  }

  async function uploadAnnouncementImages(
    announcementId: string,
    files: File[]
  ): Promise<Array<{ url: string; storagePath: string }>> {
    if (!authStore.user) return []
    uploading.value = true

    uploadProgress.value = files.map(f => ({ file: f, progress: 0 }))

    try {
      const results = await Promise.all(
        files.map(async (file, index) => {
          const ext = file.name.split('.').pop() ?? 'jpg'
          const filename = `${Date.now()}_${index}.${ext}`
          const path = `${authStore.user!.id}/${announcementId}/${filename}`

          uploadProgress.value[index]!.progress = 50

          const result = await uploadFile('announcement-images', path, file)

          if (result) {
            uploadProgress.value[index]!.progress = 100
            uploadProgress.value[index]!.url = result.url
            uploadProgress.value[index]!.storagePath = result.storagePath
            return result
          }

          uploadProgress.value[index]!.error = 'Erro no upload'
          return null
        })
      )

      return results.filter((r): r is { url: string; storagePath: string } => r !== null)
    } finally {
      uploading.value = false
    }
  }

  async function deleteFile(bucket: string, path: string): Promise<void> {
    await supabase.storage.from(bucket).remove([path])
  }

  async function deleteAnnouncementImages(storagePaths: string[]): Promise<void> {
    if (!storagePaths.length) return
    await supabase.storage.from('announcement-images').remove(storagePaths)
  }

  return {
    uploading,
    uploadProgress,
    getPublicUrl,
    uploadFile,
    uploadAnnouncementImages,
    deleteFile,
    deleteAnnouncementImages,
  }
}

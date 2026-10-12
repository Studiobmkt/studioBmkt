import { requireSupabase } from '../supabase';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../firebase';

export const MAX_PROJECT_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateProjectImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Use uma imagem JPG, PNG ou WebP.';
  }
  if (file.size > MAX_PROJECT_IMAGE_BYTES) {
    return 'Cada imagem pode ter no máximo 10 MB.';
  }
  return null;
}

const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const safeFileName = (fileName: string) =>
  fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-');

const useSupabaseStorage = import.meta.env.VITE_DATA_BACKEND === 'supabase';

export async function uploadProjectImage(
  file: File,
  projectKey: string,
  kind: 'cover' | 'gallery',
  onProgress: (progress: number) => void,
): Promise<{ url: string; path: string }> {
  const validationError = validateProjectImage(file);
  if (validationError) throw new Error(validationError);

  const path = `projects/${projectKey}/${kind}/${makeId()}-${safeFileName(file.name)}`;

  if (!useSupabaseStorage) {
    const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type });
    await new Promise<void>((resolve, reject) => {
      task.on('state_changed', snapshot => {
        onProgress(snapshot.totalBytes ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0);
      }, reject, resolve);
    });
    return { path, url: await getDownloadURL(task.snapshot.ref) };
  }

  const client = requireSupabase();
  onProgress(5);

  const { error } = await client.storage
    .from('case-images')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    throw new Error(`Não foi possível enviar a imagem: ${error.message}`);
  }

  onProgress(100);
  const { data } = client.storage.from('case-images').getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function deleteProjectImage(path?: string) {
  if (!path) return;
  if (!useSupabaseStorage) {
    await deleteObject(ref(storage, path));
    return;
  }
  const { error } = await requireSupabase().storage.from('case-images').remove([path]);
  if (error) throw new Error(`Não foi possível remover a imagem: ${error.message}`);
}

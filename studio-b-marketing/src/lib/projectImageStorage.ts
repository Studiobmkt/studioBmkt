import { requireSupabase } from '../supabase';
import { auth } from '../firebase';

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
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nldpvfllhtgpodxuyabo.supabase.co';

type ImageKind = 'cover' | 'gallery' | 'blog';

const storagePath = (key: string, kind: ImageKind, fileName: string) =>
  kind === 'blog'
    ? `blog/${key}/cover/${makeId()}-${safeFileName(fileName)}`
    : `projects/${key}/${kind}/${makeId()}-${safeFileName(fileName)}`;

async function uploadThroughSupabase(file: File, projectKey: string, kind: ImageKind, onProgress: (progress: number) => void) {
  const user = auth.currentUser;
  if (!user) throw new Error('Sua sessão do admin expirou. Entre novamente para enviar imagens.');

  const token = await user.getIdToken();
  const form = new FormData();
  form.append('file', file);
  form.append('projectKey', projectKey);
  form.append('kind', kind);

  onProgress(5);
  const response = await fetch(`${supabaseUrl}/functions/v1/case-image-upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.url || !payload.path) {
    throw new Error(payload.error || 'Não foi possível enviar a imagem. Tente novamente.');
  }
  onProgress(100);
  return { path: payload.path as string, url: payload.url as string };
}

export async function uploadProjectImage(
  file: File,
  projectKey: string,
  kind: 'cover' | 'gallery',
  onProgress: (progress: number) => void,
): Promise<{ url: string; path: string }> {
  const validationError = validateProjectImage(file);
  if (validationError) throw new Error(validationError);

  const path = storagePath(projectKey, kind, file.name);

  if (!useSupabaseStorage) {
    // The legacy Firebase bucket is retained for existing images. New uploads
    // use the Supabase function, authenticated with the current Firebase admin.
    return uploadThroughSupabase(file, projectKey, kind, onProgress);
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

export async function uploadBlogImage(
  file: File,
  postKey: string,
  onProgress: (progress: number) => void,
): Promise<{ url: string; path: string }> {
  const validationError = validateProjectImage(file);
  if (validationError) throw new Error(validationError);

  if (!useSupabaseStorage) return uploadThroughSupabase(file, postKey, 'blog', onProgress);

  const path = storagePath(postKey, 'blog', file.name);
  const client = requireSupabase();
  onProgress(5);
  const { error } = await client.storage.from('case-images').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Não foi possível enviar a imagem: ${error.message}`);
  onProgress(100);
  const { data } = client.storage.from('case-images').getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function deleteProjectImage(path?: string) {
  if (!path) return;
  if (!useSupabaseStorage) {
    const user = auth.currentUser;
    if (!user) throw new Error('Sua sessão do admin expirou. Entre novamente para remover imagens.');
    const response = await fetch(`${supabaseUrl}/functions/v1/case-image-upload`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Não foi possível remover a imagem.');
    }
    return;
  }
  const { error } = await requireSupabase().storage.from('case-images').remove([path]);
  if (error) throw new Error(`Não foi possível remover a imagem: ${error.message}`);
}

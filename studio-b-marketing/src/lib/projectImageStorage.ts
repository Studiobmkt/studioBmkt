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

export async function uploadProjectImage(
  file: File,
  projectKey: string,
  kind: 'cover' | 'gallery',
  onProgress: (progress: number) => void,
): Promise<{ url: string; path: string }> {
  const validationError = validateProjectImage(file);
  if (validationError) throw new Error(validationError);

  const path = `projects/${projectKey}/${kind}/${makeId()}-${safeFileName(file.name)}`;
  const fileRef = ref(storage, path);
  const task = uploadBytesResumable(fileRef, file, { contentType: file.type });

  await new Promise<void>((resolve, reject) => {
    task.on('state_changed', snapshot => {
      onProgress(snapshot.totalBytes ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0);
    }, reject, resolve);
  });

  return { path, url: await getDownloadURL(task.snapshot.ref) };
}

export async function deleteProjectImage(path?: string) {
  if (path) await deleteObject(ref(storage, path));
}

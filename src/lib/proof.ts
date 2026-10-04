/**
 * Proof of work: photos and short videos a creative uploads to show their skills.
 *
 * Storage layout: users/{uid}/proof/{id}.{ext}  (public read, owner write; see storage.rules)
 * The list itself lives on the profile document as `proofItems` (max 8).
 */
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from './firebase';
import type { ProofItem } from '../types';

const storage = getStorage(app);

export const MAX_PROOF_ITEMS = 8;
export const MAX_VIDEO_SECONDS = 60;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_PHOTO_INPUT_BYTES = 25 * 1024 * 1024;
const PHOTO_LONG_EDGE = 1600;
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

export class ProofError extends Error {}

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new ProofError("That photo couldn't be opened. Try a JPG or PNG.")); };
    img.src = url;
  });
}

/** Scales a photo down to a sensible web size and re-encodes it as JPEG. */
async function compressPhoto(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const scale = Math.min(1, PHOTO_LONG_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ProofError('Your browser could not process this photo.');
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
  if (!blob) throw new ProofError('Your browser could not process this photo.');
  return blob;
}

/** Reads a video's length in seconds without uploading it. */
export function videoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(v.duration); };
    v.onerror = () => { URL.revokeObjectURL(url); reject(new ProofError("That video couldn't be read. Try an MP4 or MOV file.")); };
    v.src = url;
  });
}

/** Checks a file and uploads it. Resolves with the new item (caption/skill empty). */
export async function uploadProof(uid: string, file: File, onProgress: (fraction: number) => void): Promise<ProofItem> {
  const id = newId();
  let body: Blob = file;
  let type: ProofItem['type'];
  let ext: string;
  let contentType: string;
  let durationSec: number | undefined;

  if (file.type.startsWith('image/')) {
    if (file.size > MAX_PHOTO_INPUT_BYTES) throw new ProofError('That photo is too large. Please choose one under 25 MB.');
    body = await compressPhoto(file);
    type = 'image';
    ext = 'jpg';
    contentType = 'image/jpeg';
  } else if (VIDEO_TYPES.includes(file.type)) {
    if (file.size > MAX_VIDEO_BYTES) throw new ProofError('Videos can be up to 100 MB. Try trimming or exporting at a lower size.');
    const secs = await videoDuration(file);
    if (!Number.isFinite(secs) || secs <= 0) throw new ProofError("That video couldn't be read. Try an MP4 or MOV file.");
    if (secs > MAX_VIDEO_SECONDS + 0.5) throw new ProofError(`Videos can be up to ${MAX_VIDEO_SECONDS} seconds. This one is ${Math.round(secs)} seconds.`);
    durationSec = Math.round(secs);
    type = 'video';
    ext = file.type === 'video/quicktime' ? 'mov' : file.type === 'video/webm' ? 'webm' : 'mp4';
    contentType = file.type;
  } else {
    throw new ProofError('Please choose a photo (JPG, PNG, WebP) or a video (MP4, MOV, WebM).');
  }

  const path = `users/${uid}/proof/${id}.${ext}`;
  const task = uploadBytesResumable(ref(storage, path), body, { contentType, cacheControl: 'public,max-age=31536000' });
  await new Promise<void>((resolve, reject) => {
    task.on('state_changed', (s) => onProgress(s.totalBytes ? s.bytesTransferred / s.totalBytes : 0), reject, () => resolve());
  });
  const url = await getDownloadURL(ref(storage, path));
  return { id, type, url, path, caption: '', skill: '', ...(durationSec ? { durationSec } : {}), isCover: false, createdAt: new Date().toISOString() };
}

/** Removes uploaded files that are no longer on the profile. Failures are ignored. */
export async function deleteProofFiles(paths: string[]) {
  await Promise.all(paths.map((p) => deleteObject(ref(storage, p)).catch(() => undefined)));
}

/**
 * Only render media that lives in our own bucket under this user's proof folder,
 * so a profile can't be made to load arbitrary URLs.
 */
export function isTrustedProofUrl(uid: string, item: Pick<ProofItem, 'url' | 'path'>): boolean {
  const bucket = app.options.storageBucket;
  if (!bucket || typeof item.url !== 'string' || typeof item.path !== 'string') return false;
  if (!item.path.startsWith(`users/${uid}/proof/`)) return false;
  const prefix = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(`users/${uid}/proof/`)}`;
  return item.url.startsWith(prefix);
}

/** Proof items safe to show, cover first. */
export function visibleProof(uid: string, items?: ProofItem[]): ProofItem[] {
  const list = (items || []).filter((i) => (i.type === 'image' || i.type === 'video') && isTrustedProofUrl(uid, i)).slice(0, MAX_PROOF_ITEMS);
  return [...list.filter((i) => i.isCover), ...list.filter((i) => !i.isCover)];
}

export const formatDuration = (s?: number) => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : '');

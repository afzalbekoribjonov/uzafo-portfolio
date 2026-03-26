'use client';

import {authFetch} from '@/lib/auth';

type UploadAuthPayload = {
  sessionId: string;
  publicKey: string;
  urlEndpoint: string;
  token: string;
  signature: string;
  expire: number;
  fileName: string;
  folder: string;
  tags: string[];
  isPrivateFile: boolean;
};

type CompleteResponse = {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  fileId: string;
  filePath: string;
  fileName: string;
};

type UploadOptions = {
  ownerType: 'project' | 'post' | 'discussion' | 'profile' | 'resume' | 'site';
  ownerSlug?: string;
  role: 'cover' | 'gallery' | 'content' | 'avatar' | 'document';
  isPrivateFile?: boolean;
};

function extensionFromMime(mime: string) {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('svg')) return 'svg';
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('quicktime')) return 'mov';
  return 'jpg';
}

function dataUrlToFile(dataUrl: string, fileName = `upload-${Date.now()}.png`): File {
  const [meta, data] = dataUrl.split(',');
  const mime = /data:(.*?);base64/.exec(meta)?.[1] || 'application/octet-stream';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], fileName, {type: mime});
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function uploadMediaSource(source: File | string, options: UploadOptions): Promise<CompleteResponse> {
  const file = typeof source === 'string'
    ? dataUrlToFile(source, `upload-${Date.now()}.${extensionFromMime(source.slice(5, source.indexOf(';')) || 'image/png')}`)
    : source;

  const authRes = await authFetch('/api/media/upload-auth', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      ownerType: options.ownerType,
      ownerSlug: options.ownerSlug,
      role: options.role,
      isPrivateFile: options.isPrivateFile ?? false
    })
  });
  const auth = await parseJson<UploadAuthPayload>(authRes);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', auth.fileName || file.name);
  formData.append('publicKey', auth.publicKey);
  formData.append('signature', auth.signature);
  formData.append('expire', String(auth.expire));
  formData.append('token', auth.token);
  formData.append('folder', auth.folder);
  formData.append('useUniqueFileName', 'true');
  formData.append('isPrivateFile', String(auth.isPrivateFile));
  if (auth.tags?.length) formData.append('tags', auth.tags.join(','));

  const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: formData
  });
  const uploadJson = await parseJson<any>(uploadRes);

  const completeRes = await authFetch('/api/media/complete', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      sessionId: auth.sessionId,
      fileId: uploadJson.fileId,
      filePath: uploadJson.filePath,
      name: uploadJson.name,
      url: uploadJson.url,
      thumbnailUrl: uploadJson.thumbnailUrl,
      size: uploadJson.size,
      fileType: uploadJson.fileType,
      height: uploadJson.height,
      width: uploadJson.width,
      duration: uploadJson.duration
    })
  });

  return parseJson<CompleteResponse>(completeRes);
}

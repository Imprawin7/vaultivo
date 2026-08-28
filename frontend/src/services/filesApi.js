import apiClient from './apiClient';

export const initUpload = (payload) => apiClient.post('/files/init-upload', payload).then((r) => r.data);
export const completeUpload = (payload) => apiClient.post('/files/complete-upload', payload).then((r) => r.data);
export const getFile = (id) => apiClient.get(`/files/${id}`).then((r) => r.data);
export const getDownloadUrl = (id) => apiClient.get(`/files/${id}/download-url`).then((r) => r.data);
export const updateFile = (id, payload) => apiClient.patch(`/files/${id}`, payload).then((r) => r.data);
export const trashFile = (id) => apiClient.delete(`/files/${id}`).then((r) => r.data);
export const restoreFile = (id) => apiClient.post(`/files/${id}/restore`).then((r) => r.data);
export const permanentlyDeleteFile = (id) => apiClient.delete(`/files/${id}/permanent`).then((r) => r.data);
export const listStarred = () => apiClient.get('/files/starred').then((r) => r.data);

/**
 * Full upload flow: reserve a presigned URL, PUT the raw bytes directly to
 * S3 (bypassing our API server), then confirm so the metadata row + quota
 * get created. onProgress receives 0-100.
 */
export async function uploadFile({ file, folderId, onProgress }) {
  const init = await initUpload({
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    folderId: folderId ?? null,
  });

  await axiosPut(init.uploadUrl, file, onProgress);

  return completeUpload({
    storageKey: init.storageKey,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    folderId: folderId ?? null,
  });
}

function axiosPut(url, file, onProgress) {
  // A plain fetch/XHR PUT, not apiClient — this URL is pre-signed for S3
  // directly and must NOT carry our Authorization header or baseURL.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(file);
  });
}

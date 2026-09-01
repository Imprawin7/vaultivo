import apiClient from './apiClient';

export const initVersionUpload = (fileId, payload) =>
  apiClient.post(`/files/${fileId}/versions/init-upload`, payload).then((r) => r.data);

export const completeVersionUpload = (fileId, payload) =>
  apiClient.post(`/files/${fileId}/versions/complete-upload`, payload).then((r) => r.data);

export const listVersions = (fileId) => apiClient.get(`/files/${fileId}/versions`).then((r) => r.data);

export const getVersionDownloadUrl = (fileId, versionId) =>
  apiClient.get(`/files/${fileId}/versions/${versionId}/download-url`).then((r) => r.data);

export const restoreVersion = (fileId, versionId) =>
  apiClient.post(`/files/${fileId}/versions/${versionId}/restore`).then((r) => r.data);

/**
 * Full "replace content" flow — same shape as filesApi.uploadFile: reserve a
 * presigned URL, PUT the raw bytes directly to S3, then confirm so the old
 * content gets archived as a version and the new content becomes current.
 */
export async function uploadNewVersion({ fileId, file, onProgress }) {
  const init = await initVersionUpload(fileId, {
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  });

  await axiosPut(init.uploadUrl, file, onProgress);

  return completeVersionUpload(fileId, {
    storageKey: init.storageKey,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  });
}

function axiosPut(url, file, onProgress) {
  // A plain XHR PUT, not apiClient — this URL is pre-signed for S3 directly
  // and must NOT carry our Authorization header or baseURL.
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

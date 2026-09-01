import apiClient from './apiClient';

// These hit /api/public-links/** — permitAll on the backend, no auth needed.
// apiClient may still attach a stale Authorization header if the caller
// happens to be logged in elsewhere in the app; harmless, since the
// backend endpoint doesn't require or check it either way.
export const getInfo = (token, password) =>
  apiClient.get(`/public-links/${token}`, { params: password ? { password } : {} }).then((r) => r.data);

export const getDownloadUrl = (token, password) =>
  apiClient.post(`/public-links/${token}/download-url`, { password: password || null }).then((r) => r.data);

export const getPreviewUrl = (token, password) =>
  apiClient.post(`/public-links/${token}/preview-url`, { password: password || null }).then((r) => r.data);

// For a file listed inside a publicly-shared FOLDER link (not a link that
// points directly at a single file) — see PublicLinkController.
export const getFolderFileDownloadUrl = (token, fileId, password) =>
  apiClient
    .post(`/public-links/${token}/files/${fileId}/download-url`, { password: password || null })
    .then((r) => r.data);

export const getFolderFilePreviewUrl = (token, fileId, password) =>
  apiClient
    .post(`/public-links/${token}/files/${fileId}/preview-url`, { password: password || null })
    .then((r) => r.data);

import apiClient from './apiClient';

export const shareFile = (fileId, payload) => apiClient.post(`/files/${fileId}/shares`, payload).then((r) => r.data);
export const listFileShares = (fileId) => apiClient.get(`/files/${fileId}/shares`).then((r) => r.data);
export const revokeFileShare = (fileId, shareId) => apiClient.delete(`/files/${fileId}/shares/${shareId}`).then((r) => r.data);

export const shareFolder = (folderId, payload) => apiClient.post(`/folders/${folderId}/shares`, payload).then((r) => r.data);
export const listFolderShares = (folderId) => apiClient.get(`/folders/${folderId}/shares`).then((r) => r.data);
export const revokeFolderShare = (folderId, shareId) => apiClient.delete(`/folders/${folderId}/shares/${shareId}`).then((r) => r.data);

export const listSharedWithMe = () => apiClient.get('/shares/with-me').then((r) => r.data);

export const createFileLink = (fileId, payload) => apiClient.post(`/files/${fileId}/link-shares`, payload).then((r) => r.data);
export const listFileLinks = (fileId) => apiClient.get(`/files/${fileId}/link-shares`).then((r) => r.data);
export const createFolderLink = (folderId, payload) => apiClient.post(`/folders/${folderId}/link-shares`, payload).then((r) => r.data);
export const listFolderLinks = (folderId) => apiClient.get(`/folders/${folderId}/link-shares`).then((r) => r.data);
export const revokeLink = (linkShareId) => apiClient.delete(`/link-shares/${linkShareId}`).then((r) => r.data);

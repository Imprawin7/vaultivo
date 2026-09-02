import apiClient from './apiClient';

export const listTags = () => apiClient.get('/tags').then((r) => r.data);
export const createTag = (payload) => apiClient.post('/tags', payload).then((r) => r.data);
export const deleteTag = (id) => apiClient.delete(`/tags/${id}`).then((r) => r.data);
export const itemsByTag = (id) => apiClient.get(`/tags/${id}/items`).then((r) => r.data);

export const tagsForFile = (fileId) => apiClient.get(`/files/${fileId}/tags`).then((r) => r.data);
export const tagsForFolder = (folderId) => apiClient.get(`/folders/${folderId}/tags`).then((r) => r.data);

export const assignToFile = (tagId, fileId) => apiClient.post(`/tags/${tagId}/files/${fileId}`).then((r) => r.data);
export const removeFromFile = (tagId, fileId) => apiClient.delete(`/tags/${tagId}/files/${fileId}`).then((r) => r.data);
export const assignToFolder = (tagId, folderId) =>
  apiClient.post(`/tags/${tagId}/folders/${folderId}`).then((r) => r.data);
export const removeFromFolder = (tagId, folderId) =>
  apiClient.delete(`/tags/${tagId}/folders/${folderId}`).then((r) => r.data);

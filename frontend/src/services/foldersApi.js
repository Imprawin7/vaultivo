import apiClient from './apiClient';

export const getRoot = () => apiClient.get('/folders/root').then((r) => r.data);
export const getFolder = (id) => apiClient.get(`/folders/${id}`).then((r) => r.data);
export const createFolder = (payload) => apiClient.post('/folders', payload).then((r) => r.data);
export const updateFolder = (id, payload) => apiClient.patch(`/folders/${id}`, payload).then((r) => r.data);
export const trashFolder = (id) => apiClient.delete(`/folders/${id}`).then((r) => r.data);
export const restoreFolder = (id) => apiClient.post(`/folders/${id}/restore`).then((r) => r.data);
export const permanentlyDeleteFolder = (id) => apiClient.delete(`/folders/${id}/permanent`).then((r) => r.data);

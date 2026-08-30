import apiClient from './apiClient';

export const getStats = () => apiClient.get('/admin/stats').then((r) => r.data);

export const listUsers = (query) =>
  apiClient.get('/admin/users', { params: query ? { q: query } : {} }).then((r) => r.data);

export const topStorageUsers = (limit = 10) =>
  apiClient.get('/admin/users/top-storage', { params: { limit } }).then((r) => r.data);

export const updateUser = (id, payload) => apiClient.patch(`/admin/users/${id}`, payload).then((r) => r.data);

export const deleteUser = (id) => apiClient.delete(`/admin/users/${id}`).then((r) => r.data);

export const recentActivity = (limit = 100) =>
  apiClient.get('/admin/activity', { params: { limit } }).then((r) => r.data);

export const failedUploads = () => apiClient.get('/admin/uploads/failed').then((r) => r.data);

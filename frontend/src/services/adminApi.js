import apiClient from './apiClient';

export const listUsers = () => apiClient.get('/admin/users').then((r) => r.data);
export const getStats = () => apiClient.get('/admin/stats').then((r) => r.data);
export const updateUser = (id, payload) => apiClient.patch(`/admin/users/${id}`, payload).then((r) => r.data);
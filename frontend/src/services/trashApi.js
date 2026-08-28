import apiClient from './apiClient';

export const listTrash = () => apiClient.get('/trash').then((r) => r.data);
export const emptyTrash = () => apiClient.delete('/trash').then((r) => r.data);

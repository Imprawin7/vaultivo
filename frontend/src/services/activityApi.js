import apiClient from './apiClient';

export const myActivity = (limit = 50) => apiClient.get('/activity', { params: { limit } }).then((r) => r.data);

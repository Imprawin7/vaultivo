import apiClient from './apiClient';

export const search = (query) => apiClient.get('/search', { params: { q: query } }).then((r) => r.data);

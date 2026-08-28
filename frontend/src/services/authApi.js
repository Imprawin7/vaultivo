import apiClient from './apiClient';

export const register = (payload) => apiClient.post('/auth/register', payload).then((r) => r.data);
export const login = (payload) => apiClient.post('/auth/login', payload).then((r) => r.data);
export const me = () => apiClient.get('/auth/me').then((r) => r.data);

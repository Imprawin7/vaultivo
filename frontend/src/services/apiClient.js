import axios from 'axios';

// Central Axios instance. The JWT is attached per-request from AuthContext
// (see AuthContext.jsx) rather than baked in here, so logging out/in
// doesn't require recreating this instance.
const apiClient = axios.create({
  baseURL: '/api',
});

export default apiClient;


import axios from 'axios';

// Central Axios instance.
// The JWT is attached per-request from AuthContext.jsx.

const apiClient = axios.create({
  baseURL: 'https://vaultivo-1.onrender.com/api',
});

export default apiClient;


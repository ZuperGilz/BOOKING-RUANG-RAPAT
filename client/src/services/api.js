import axios from 'axios';

const api = axios.create({
  // Gunakan VITE_API_URL jika di Vercel, fallback ke '/api' untuk proxy lokal
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Interceptor: Otomatis menyisipkan token JWT ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
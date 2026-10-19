import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (formData) => api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const clinicAPI = {
  getServices: () => api.get('/clinic/services'),
  updateService: (id, data) => api.put(`/clinic/services/${id}`, data),
};

export const appointmentsAPI = {
  getAll: () => api.get('/appointments/'),
  create: (data) => api.post('/appointments/', data),
  updateStatus: (id, data) => api.put(`/appointments/${id}/status`, data),
  getAvailableSlots: (date, doctor, service_type) => api.get('/appointments/available-slots', {
    params: { date, doctor, service_type }
  }),
  getBookedSlots: (date, doctor) => api.get('/appointments/available-slots', {
    params: { date, doctor }
  }),
  getDoctors: () => api.get('/appointments/doctors'),
};

export const chatAPI = {
  sendMessage: (message) => api.post('/chat', { message }),
};

export default api;
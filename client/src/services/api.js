/**
 * API Service Layer
 * 
 * Centralized Axios instance with interceptors for:
 * - Auto-attaching JWT tokens
 * - Auto-refreshing expired tokens
 * - Standardized error handling
 */

import axios from 'axios';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (error.response?.data?.errorCode === 'TOKEN_EXPIRED') {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token');
          }

          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken
          });

          const newToken = data.data.accessToken;
          localStorage.setItem('accessToken', newToken);

          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          // Clear auth data and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// Auth API
// ============================================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (token) => api.post('/auth/google', { token }),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me')
};

// ============================================
// Users API
// ============================================
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadProfileImage: (formData) => api.put('/users/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  changePassword: (data) => api.put('/users/change-password', data)
};

// ============================================
// Patient API
// ============================================
export const patientAPI = {
  getProfile: () => api.get('/patients/profile'),
  updateProfile: (data) => api.put('/patients/profile', data),
  getMedicalHistory: () => api.get('/patients/medical-history'),
  getDashboard: () => api.get('/patients/dashboard')
};

// ============================================
// Doctor API
// ============================================
export const doctorAPI = {
  list: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  updateProfile: (data) => api.put('/doctors/profile', data),
  uploadProfileImage: (formData) => api.put('/doctors/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  setAvailability: (data) => api.post('/doctors/availability', data),
  updateAvailability: (id, data) => api.put(`/doctors/availability/${id}`, data),
  deleteAvailability: (id) => api.delete(`/doctors/availability/${id}`),
  updateUpi: (formData) => api.put('/doctors/upi', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getPatients: (params) => api.get('/doctors/patients', { params }),
  getPatientHistory: (id) => api.get(`/doctors/patients/${id}/history`),
  getDashboard: () => api.get('/doctors/dashboard')
};

// ============================================
// Appointment API
// ============================================
export const appointmentAPI = {
  create: (data) => api.post('/appointments', data),
  list: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  accept: (id, data) => api.put(`/appointments/${id}/accept`, data),
  reject: (id, data) => api.put(`/appointments/${id}/reject`, data),
  reschedule: (id, data) => api.put(`/appointments/${id}/reschedule`, data),
  complete: (id) => api.put(`/appointments/${id}/complete`),
  cancel: (id) => api.put(`/appointments/${id}/cancel`)
};

// ============================================
// Prescription API
// ============================================
export const prescriptionAPI = {
  create: (formData) => api.post('/prescriptions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  list: (params) => api.get('/prescriptions', { params }),
  getById: (id) => api.get(`/prescriptions/${id}`),
  download: (id) => api.get(`/prescriptions/${id}/download`, { responseType: 'blob' })
};

// ============================================
// Medical Records API
// ============================================
export const medicalRecordAPI = {
  upload: (formData) => api.post('/medical-records/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  list: (params) => api.get('/medical-records', { params }),
  getById: (id) => api.get(`/medical-records/${id}`),
  download: (id) => api.get(`/medical-records/${id}/download`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/medical-records/${id}`)
};

// ============================================
// Symptoms API
// ============================================
export const symptomAPI = {
  create: (data) => api.post('/symptoms', data),
  list: (params) => api.get('/symptoms', { params }),
  getById: (id) => api.get(`/symptoms/${id}`),
  assess: (id) => api.post(`/symptoms/${id}/assess`)
};

// ============================================
// Payment API
// ============================================
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
  list: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`)
};

// ============================================
// Verification API
// ============================================
export const verificationAPI = {
  submit: (formData) => api.post('/verification/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getStatus: () => api.get('/verification/status'),
  listRequests: (params) => api.get('/verification/requests', { params }),
  getRequest: (id) => api.get(`/verification/${id}`),
  approve: (id, data) => api.put(`/verification/${id}/approve`, data),
  reject: (id, data) => api.put(`/verification/${id}/reject`, data)
};

// ============================================
// Admin API
// ============================================
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  blockUser: (id, block) => api.put(`/admin/users/${id}/block`, { block }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  getDoctors: (params) => api.get('/admin/doctors', { params }),
  suspendDoctor: (id, suspend) => api.put(`/admin/doctors/${id}/suspend`, { suspend }),
  getAppointments: (params) => api.get('/admin/appointments', { params }),
  getPayments: (params) => api.get('/admin/payments', { params }),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params })
};

// ============================================
// Notification API
// ============================================
export const notificationAPI = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all')
};

export default api;

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('placyra_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('placyra_token');
      localStorage.removeItem('placyra_user');
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  getMe: () => apiClient.get('/auth/me'),
};

export const tnpApi = {
  getCompanies: () => apiClient.get('/tnp/companies'),
  createCompany: (data) => apiClient.post('/tnp/companies', data),
  deleteCompany: (id) => apiClient.delete(`/tnp/companies/${id}`),
  getQuestions: (params) => apiClient.get('/tnp/questions', { params }),
  createQuestion: (data) => apiClient.post('/tnp/questions', data),
  bulkUploadQuestions: (formData) =>
    apiClient.post('/tnp/questions/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getPendingQuestions: () => apiClient.get('/tnp/questions/pending'),
  approveQuestion: (id) => apiClient.patch(`/tnp/questions/${id}/approve`),
  rejectQuestion: (id) => apiClient.patch(`/tnp/questions/${id}/reject`),
};

export const studentApi = {
  uploadResume: (formData) =>
    apiClient.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getMyResume: () => apiClient.get('/resume/my-resume'),
  analyzeGap: (companyId) => apiClient.post(`/resume/analyze-gap/${companyId}`),
};

export const interviewApi = {
  startInterview: (data) => apiClient.post('/mock-interview/start', data),
  submitAnswer: (sessionId, answerText) =>
    apiClient.post(`/mock-interview/${sessionId}/answer`, { answer_text: answerText }),
  endInterview: (sessionId) => apiClient.post(`/mock-interview/${sessionId}/end`),
  getHistory: () => apiClient.get('/mock-interview/history'),
  getSession: (sessionId) => apiClient.get(`/mock-interview/${sessionId}`),
};

export const analyticsApi = {
  getStudentReadiness: () => apiClient.get('/analytics/student-readiness'),
  getTnpBatchOverview: () => apiClient.get('/analytics/tnp-batch-overview'),
};

export default apiClient;

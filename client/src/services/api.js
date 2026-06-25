import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pharma_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pharma_token');
      localStorage.removeItem('pharma_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// Medicines
export const getMedicines = (params) => api.get('/medicines', { params });
export const getMedicine = (id) => api.get(`/medicines/${id}`);
export const createMedicine = (data) => api.post('/medicines', data);
export const updateMedicine = (id, data) => api.put(`/medicines/${id}`, data);
export const deleteMedicine = (id) => api.delete(`/medicines/${id}`);
export const getCategories = () => api.get('/medicines/categories');

// Suppliers
export const getSuppliers = () => api.get('/suppliers');
export const getSupplier = (id) => api.get(`/suppliers/${id}`);
export const createSupplier = (data) => api.post('/suppliers', data);
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`);

// Purchases
export const getPurchases = () => api.get('/purchases');
export const createPurchase = (data) => api.post('/purchases', data);
export const deletePurchase = (id) => api.delete(`/purchases/${id}`);

// Invoices (Replacing Sales)
export const getInvoices = () => api.get('/invoices');
export const createInvoice = (data) => api.post('/invoices', data);

// Customers
export const getCustomers = () => api.get('/customers');
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);

// Audit Logs
export const getAuditLogs = () => api.get('/audit');

// Reports
export const getDashboardStats = () => api.get('/reports/dashboard');
export const getSalesChart = () => api.get('/reports/sales-chart');
export const getLowStockReport = () => api.get('/reports/low-stock');
export const getExpiryReport = (days) => api.get('/reports/expiry', { params: { days } });
export const getTopMedicines = () => api.get('/reports/top-medicines');
export const getForecasting = () => api.get('/reports/forecasting');

export default api;

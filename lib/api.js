import { supabase } from './supabase';

const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Suppliers
  getSuppliers: () => request('/suppliers'),
  createSupplier: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Materials
  getMaterials: () => request('/materials'),
  createMaterial: (data) => request('/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id, data) => request(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterial: (id) => request(`/materials/${id}`, { method: 'DELETE' }),

  // Labor
  getLabor: () => request('/labor'),
  createLabor: (data) => request('/labor', { method: 'POST', body: JSON.stringify(data) }),
  updateLabor: (id, data) => request(`/labor/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLabor: (id) => request(`/labor/${id}`, { method: 'DELETE' }),

  // Prices
  getPrices: (materialId) => request(`/prices${materialId ? `?material_id=${materialId}` : ''}`),
  createPrice: (data) => request('/prices', { method: 'POST', body: JSON.stringify(data) }),

  // Works
  getWorks: () => request('/works'),
  getWork: (id) => request(`/works/${id}`),
  createWork: (data) => request('/works', { method: 'POST', body: JSON.stringify(data) }),
  updateWork: (id, data) => request(`/works/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWork: (id) => request(`/works/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/transactions${qs ? `?${qs}` : ''}`);
  },
  createTransaction: (data) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id, data) => request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),

  // Reports
  getReports: (filter) => request(`/reports${filter ? `?filter=${filter}` : ''}`),
  getReportCSV: (filter) => `${BASE}/reports/csv${filter ? `?filter=${filter}` : ''}`,
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
};

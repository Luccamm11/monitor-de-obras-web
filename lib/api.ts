import { supabase } from './supabase';

const BASE = '/api';

async function request<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers,
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
  createSupplier: (data: Record<string, any>) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: number | string, data: Record<string, any>) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id: number | string) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Materials
  getMaterials: () => request('/materials'),
  createMaterial: (data: Record<string, any>) => request('/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id: number | string, data: Record<string, any>) => request(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterial: (id: number | string) => request(`/materials/${id}`, { method: 'DELETE' }),

  // Labor
  getLabor: () => request('/labor'),
  createLabor: (data: Record<string, any>) => request('/labor', { method: 'POST', body: JSON.stringify(data) }),
  updateLabor: (id: number | string, data: Record<string, any>) => request(`/labor/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLabor: (id: number | string) => request(`/labor/${id}`, { method: 'DELETE' }),

  // Prices
  getPrices: (materialId?: number | string) => request(`/prices${materialId ? `?material_id=${materialId}` : ''}`),
  createPrice: (data: Record<string, any>) => request('/prices', { method: 'POST', body: JSON.stringify(data) }),

  // Works
  getWorks: () => request('/works'),
  getWork: (id: number | string) => request(`/works/${id}`),
  createWork: (data: Record<string, any>) => request('/works', { method: 'POST', body: JSON.stringify(data) }),
  updateWork: (id: number | string, data: Record<string, any>) => request(`/works/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWork: (id: number | string) => request(`/works/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/transactions${qs ? `?${qs}` : ''}`);
  },
  createTransaction: (data: Record<string, any>) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id: number | string, data: Record<string, any>) => request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id: number | string) => request(`/transactions/${id}`, { method: 'DELETE' }),

  // Reports
  getReports: (filter?: string) => request(`/reports${filter ? `?filter=${filter}` : ''}`),
  getReportCSV: (filter?: string) => `${BASE}/reports/csv${filter ? `?filter=${filter}` : ''}`,
};

export const formatCurrency = (value: number | null | undefined): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
};

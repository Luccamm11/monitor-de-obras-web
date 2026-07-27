'use client';

import React, { useState, useEffect, useCallback, FormEvent, MouseEvent, KeyboardEvent, ChangeEvent, ReactNode } from 'react';
import { api, formatCurrency } from '@/lib/api';

/* ==================== MODAL ==================== */
function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(clickEvent: MouseEvent<HTMLDivElement>) => clickEvent.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ==================== CONFIRM DIALOG ==================== */
function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}) {
  if (!isOpen) return null;
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-card" onClick={(clickEvent: MouseEvent<HTMLDivElement>) => clickEvent.stopPropagation()}>
        <div className="confirm-icon">⚠️</div>
        <h3 className="confirm-title">{title || 'Confirmar Exclusão'}</h3>
        <p className="confirm-text">{message || 'Esta ação não pode ser desfeita. Deseja continuar?'}</p>
        <div className="confirm-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm}>Excluir</button>
        </div>
      </div>
    </div>
  );
}

/* ==================== SUPPLIER MODAL ==================== */
function SupplierModal({
  isOpen,
  onClose,
  onSave,
  materials,
  editData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  materials: any[];
  editData: any;
}) {
  const [form, setForm] = useState<{
    name: string;
    contact: string;
    phone: string;
    category: string;
    tax_rate: string;
    payment_methods: string[];
    materials: { id: number; price: string }[];
  }>({ name: '', contact: '', phone: '', category: '', tax_rate: '0', payment_methods: [], materials: [] });
  const [newMethod, setNewMethod] = useState('');

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name || '',
        contact: editData.contact || '',
        phone: editData.phone || '',
        category: editData.category || '',
        tax_rate: String(editData.tax_rate || 0),
        payment_methods: editData.payment_methods || [],
        materials: [],
      });
    } else {
      setForm({ name: '', contact: '', phone: '', category: '', tax_rate: '0', payment_methods: [], materials: [] });
    }
  }, [editData, isOpen]);

  const addPaymentMethod = () => {
    if (newMethod.trim()) {
      setForm({ ...form, payment_methods: [...form.payment_methods, newMethod.trim()] });
      setNewMethod('');
    }
  };

  const handleSubmit = async (formSubmitEvent: FormEvent) => {
    formSubmitEvent.preventDefault();
    try {
      const payload = { ...form, tax_rate: parseFloat(form.tax_rate) || 0 };
      if (editData?.id) {
        await api.updateSupplier(editData.id, payload);
      } else {
        const result = await api.createSupplier(payload);
        for (const mat of form.materials) {
          const matPrice = parseFloat(mat.price) || 0;
          if (matPrice > 0) {
            await api.createPrice({ supplier_id: result.id, material_id: mat.id, price: matPrice });
          }
        }
      }
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? 'Editar Fornecedor' : 'Adicionar Fornecedor'}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome *</label>
          <input className="input" value={form.name} onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: inputChangeEvent.target.value })} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Contato</label>
            <input className="input" value={form.contact} onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => setForm({ ...form, contact: inputChangeEvent.target.value })} />
          </div>
          <div className="form-group">
            <label>Telefone</label>
            <input className="input" value={form.phone} onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: inputChangeEvent.target.value })} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Categoria</label>
            <input className="input" value={form.category} onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => setForm({ ...form, category: inputChangeEvent.target.value })} placeholder="Ex: Materiais" />
          </div>
          <div className="form-group">
            <label>Impostos (%)</label>
            <input className="input" type="number" step="0.01" value={form.tax_rate} onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => setForm({ ...form, tax_rate: inputChangeEvent.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Formas de Pagamento</label>
          <div className="flex gap-2">
            <input className="input" value={newMethod} onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => setNewMethod(inputChangeEvent.target.value)} placeholder="PIX, Cartão, Boleto..."
              onKeyDown={(keyboardEvent: KeyboardEvent<HTMLInputElement>) => { if (keyboardEvent.key === 'Enter') { keyboardEvent.preventDefault(); addPaymentMethod(); } }} />
            <button type="button" className="btn btn-secondary" onClick={addPaymentMethod}>+</button>
          </div>
          <div className="tags mt-2">
            {form.payment_methods.map((paymentMethodName, itemIndex) => (
              <span key={itemIndex} className="tag">{paymentMethodName}
                <span className="tag-remove" onClick={() => setForm({ ...form, payment_methods: form.payment_methods.filter((_, filterIndex) => filterIndex !== itemIndex) })}>×</span>
              </span>
            ))}
          </div>
        </div>
        {!editData && materials.length > 0 && (
          <div className="form-group">
            <label>Preços por Material</label>
            {materials.map((materialItem) => (
              <div key={materialItem.id} className="flex gap-2 items-center mt-2">
                <span className="flex-1 text-sm">{materialItem.name} ({materialItem.unit})</span>
                <input className="input" style={{ width: '120px' }} type="number" step="0.01" placeholder="Preço"
                  value={form.materials.find((x) => x.id === materialItem.id)?.price || ''}
                  onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => {
                    const updatedMaterials = [...form.materials];
                    const existingIndex = updatedMaterials.findIndex((x) => x.id === materialItem.id);
                    if (existingIndex >= 0) { updatedMaterials[existingIndex].price = inputChangeEvent.target.value; }
                    else { updatedMaterials.push({ id: materialItem.id, price: inputChangeEvent.target.value }); }
                    setForm({ ...form, materials: updatedMaterials });
                  }} />
              </div>
            ))}
          </div>
        )}
        <button type="submit" className="btn btn-block mt-4">
          {editData ? 'Salvar Alterações' : 'Salvar Fornecedor'}
        </button>
      </form>
    </Modal>
  );
}

/* ==================== LABOR MODAL ==================== */
function LaborModal({
  isOpen,
  onClose,
  onSave,
  editData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editData: any;
}) {
  const [form, setForm] = useState({ name: '', role: '', daily_rate: '0', phone: '', tax_rate: '0', payment_methods: [] as string[] });
  const [newMethod, setNewMethod] = useState('');

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name || '',
        role: editData.role || '',
        daily_rate: String(editData.daily_rate || 0),
        phone: editData.phone || '',
        tax_rate: String(editData.tax_rate || 0),
        payment_methods: editData.payment_methods || [],
      });
    } else {
      setForm({ name: '', role: '', daily_rate: '0', phone: '', tax_rate: '0', payment_methods: [] });
    }
  }, [editData, isOpen]);

  const addPaymentMethod = () => {
    if (newMethod.trim()) {
      setForm({ ...form, payment_methods: [...form.payment_methods, newMethod.trim()] });
      setNewMethod('');
    }
  };

  const handleSubmit = async (formSubmitEvent: FormEvent) => {
    formSubmitEvent.preventDefault();
    try {
      const payload = {
        ...form,
        daily_rate: parseFloat(form.daily_rate) || 0,
        tax_rate: parseFloat(form.tax_rate) || 0
      };
      if (editData?.id) {
        await api.updateLabor(editData.id, payload);
      } else {
        await api.createLabor(payload);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? 'Editar Mão de Obra' : 'Adicionar Mão de Obra'}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome *</label>
          <input className="input" value={form.name} onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: inputChangeEvent.target.value })} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Função</label>
            <input className="input" value={form.role} onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => setForm({ ...form, role: inputChangeEvent.target.value })} placeholder="Ex: Pedreiro" />
          </div>
          <div className="form-group">
            <label>Diária (R$)</label>
            <input className="input" type="number" step="0.01" value={form.daily_rate} onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => setForm({ ...form, daily_rate: inputChangeEvent.target.value })} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Telefone</label>
            <input className="input" value={form.phone} onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: inputChangeEvent.target.value })} />
          </div>
          <div className="form-group">
            <label>Impostos (%)</label>
            <input className="input" type="number" step="0.01" value={form.tax_rate} onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => setForm({ ...form, tax_rate: inputChangeEvent.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Formas de Pagamento</label>
          <div className="flex gap-2">
            <input className="input" value={newMethod} onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => setNewMethod(inputChangeEvent.target.value)} placeholder="PIX, Dinheiro..."
              onKeyDown={(keyboardEvent: KeyboardEvent<HTMLInputElement>) => { if (keyboardEvent.key === 'Enter') { keyboardEvent.preventDefault(); addPaymentMethod(); } }} />
            <button type="button" className="btn btn-secondary" onClick={addPaymentMethod}>+</button>
          </div>
          <div className="tags mt-2">
            {form.payment_methods.map((paymentMethodName, itemIndex) => (
              <span key={itemIndex} className="tag">{paymentMethodName}
                <span className="tag-remove" onClick={() => setForm({ ...form, payment_methods: form.payment_methods.filter((_, filterIndex) => filterIndex !== itemIndex) })}>×</span>
              </span>
            ))}
          </div>
        </div>
        <button type="submit" className="btn btn-block mt-4">
          {editData ? 'Salvar Alterações' : 'Salvar Mão de Obra'}
        </button>
      </form>
    </Modal>
  );
}

/* ==================== MATERIAL MODAL ==================== */
function MaterialModal({
  isOpen,
  onClose,
  onSave,
  editData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editData: any;
}) {
  const [form, setForm] = useState({ name: '', unit: 'un', category: '' });

  useEffect(() => {
    if (editData) {
      setForm({ name: editData.name || '', unit: editData.unit || 'un', category: editData.category || '' });
    } else {
      setForm({ name: '', unit: 'un', category: '' });
    }
  }, [editData, isOpen]);

  const handleSubmit = async (formSubmitEvent: FormEvent) => {
    formSubmitEvent.preventDefault();
    try {
      if (editData?.id) {
        await api.updateMaterial(editData.id, form);
      } else {
        await api.createMaterial(form);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? 'Editar Material' : 'Adicionar Material'}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome *</label>
          <input className="input" value={form.name} onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: inputChangeEvent.target.value })} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Unidade</label>
            <select className="input" value={form.unit} onChange={(selectChangeEvent: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, unit: selectChangeEvent.target.value })}>
              <option value="un">Unidade (un)</option>
              <option value="kg">Quilograma (kg)</option>
              <option value="m">Metro (m)</option>
              <option value="m²">Metro² (m²)</option>
              <option value="m³">Metro³ (m³)</option>
              <option value="L">Litro (L)</option>
              <option value="sc">Saco (sc)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Categoria</label>
            <input className="input" value={form.category} onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => setForm({ ...form, category: inputChangeEvent.target.value })} />
          </div>
        </div>
        <button type="submit" className="btn btn-block mt-4">
          {editData ? 'Salvar Alterações' : 'Salvar Material'}
        </button>
      </form>
    </Modal>
  );
}

/* ==================== MAIN PAGE ==================== */
export default function DashboardPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [labor, setLabor] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [filterMaterial, setFilterMaterial] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [expandedMaterial, setExpandedMaterial] = useState<number | null>(null);

  // Modals
  const [supplierModal, setSupplierModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [laborModal, setLaborModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [materialModal, setMaterialModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: string; id: any; name: string }>({ open: false, type: '', id: null, name: '' });

  const loadData = useCallback(async () => {
    try {
      const [fetchedSuppliers, fetchedLabor, fetchedMaterials, fetchedPrices] = await Promise.all([
        api.getSuppliers(), api.getLabor(), api.getMaterials(), api.getPrices(),
      ]);
      setSuppliers(fetchedSuppliers);
      setLabor(fetchedLabor);
      setMaterials(fetchedMaterials);
      setPrices(fetchedPrices);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async () => {
    const { type, id } = deleteConfirm;
    try {
      if (type === 'supplier') await api.deleteSupplier(id);
      else if (type === 'labor') await api.deleteLabor(id);
      else if (type === 'material') await api.deleteMaterial(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
    setDeleteConfirm({ open: false, type: '', id: null, name: '' });
  };

  const filteredPrices = filterMaterial
    ? prices.filter((priceItem) => String(priceItem.material_id) === filterMaterial)
    : prices;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Principal</h1>
        <p className="page-subtitle">Gerencie fornecedores, materiais e mão de obra</p>
      </div>

      {/* Actions Bar */}
      <div className="card glass">
        <div className="flex gap-2 items-center justify-between" style={{ flexWrap: 'wrap' }}>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => setSupplierModal({ open: true, data: null })}>+ Fornecedor</button>
            <button className="btn" onClick={() => setLaborModal({ open: true, data: null })}>+ Mão de Obra</button>
            <button className="btn btn-secondary" onClick={() => setMaterialModal({ open: true, data: null })}>+ Material</button>
          </div>
          <div className="flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
            <select className="input" style={{ width: '200px' }} value={filterMaterial} onChange={(selectChangeEvent: ChangeEvent<HTMLSelectElement>) => setFilterMaterial(selectChangeEvent.target.value)}>
              <option value="">Todos Materiais</option>
              {materials.map((materialOption) => <option key={materialOption.id} value={materialOption.id}>{materialOption.name}</option>)}
            </select>
            <div className="flex gap-2 items-center">
              <label className="text-sm text-muted">Qtd:</label>
              <input className="input" style={{ width: '70px' }} type="number" min="1" value={quantity} onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => setQuantity(parseInt(inputChangeEvent.target.value, 10) || 1)} />
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Fornecedores Cadastrados</h2>
          <span className="tag">{suppliers.length}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Nome</th><th>Categoria</th><th>Contato</th><th>Telefone</th><th>Pagamento</th><th>Impostos</th><th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-text">Nenhum fornecedor cadastrado</div></div></td></tr>
              ) : (
                suppliers.map((supplierItem) => (
                  <tr key={supplierItem.id}>
                    <td className="font-medium">{supplierItem.name}</td>
                    <td>{supplierItem.category || <span className="text-muted">-</span>}</td>
                    <td>{supplierItem.contact || <span className="text-muted">-</span>}</td>
                    <td>{supplierItem.phone || <span className="text-muted">-</span>}</td>
                    <td>
                      <div className="tags">
                        {(supplierItem.payment_methods || []).map((methodName: string, itemIndex: number) => <span key={itemIndex} className="tag tag-sm">{methodName}</span>)}
                      </div>
                    </td>
                    <td>{supplierItem.tax_rate || 0}%</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => setSupplierModal({ open: true, data: supplierItem })}>✏️</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm({ open: true, type: 'supplier', id: supplierItem.id, name: supplierItem.name })}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prices Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Preços por Material</h2>
          <span className="tag">{filteredPrices.length} preços</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>Fornecedor</th><th>Material</th><th>Preço Unit.</th><th>Impostos</th><th>Total ({quantity}x)</th></tr>
            </thead>
            <tbody>
              {filteredPrices.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-icon">💰</div><div className="empty-state-text">Nenhum preço cadastrado</div></div></td></tr>
              ) : (
                filteredPrices.map((priceItem) => {
                  const calculatedTaxAmount = priceItem.price * (priceItem.tax_rate || 0) / 100;
                  const calculatedTotalPrice = (priceItem.price + calculatedTaxAmount) * quantity;
                  return (
                    <tr key={priceItem.id}>
                      <td className="font-medium">{priceItem.supplier_name}</td>
                      <td>{priceItem.material_name} ({priceItem.unit})</td>
                      <td>{formatCurrency(priceItem.price)}</td>
                      <td>{priceItem.tax_rate || 0}%</td>
                      <td className="font-bold text-success">{formatCurrency(calculatedTotalPrice)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Materials Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Materiais Cadastrados</h2>
          <span className="tag">{materials.length}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>Nome</th><th>Unidade</th><th>Categoria</th><th>Fornecedores</th><th style={{ textAlign: 'right' }}>Ações</th></tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-icon">🧱</div><div className="empty-state-text">Nenhum material cadastrado</div></div></td></tr>
              ) : (
                materials.map((materialItem) => {
                  const associatedMaterialPrices = prices.filter((priceEntry) => priceEntry.material_id === materialItem.id);
                  const isMaterialExpanded = expandedMaterial === materialItem.id;
                  return (
                    <React.Fragment key={materialItem.id}>
                      <tr>
                        <td className="font-medium">{materialItem.name}</td>
                        <td>{materialItem.unit}</td>
                        <td>{materialItem.category || <span className="text-muted">-</span>}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => setExpandedMaterial(isMaterialExpanded ? null : materialItem.id)}>
                            📦 {associatedMaterialPrices.length} fornecedor(es) {isMaterialExpanded ? '▲' : '▼'}
                          </button>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => setMaterialModal({ open: true, data: materialItem })}>✏️</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm({ open: true, type: 'material', id: materialItem.id, name: materialItem.name })}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                      {isMaterialExpanded && associatedMaterialPrices.length > 0 && (
                        <tr key={`exp-${materialItem.id}`}>
                          <td colSpan={5} style={{ padding: '0 1rem 1rem' }}>
                            <div className="material-expand">
                              {associatedMaterialPrices.map((priceDetail) => (
                                <div key={priceDetail.id} className="price-row">
                                  <span className="font-medium">{priceDetail.supplier_name}</span>
                                  <span className="text-success font-bold">{formatCurrency(priceDetail.price)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Labor Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Mão de Obra</h2>
          <span className="tag">{labor.length}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>Nome</th><th>Função</th><th>Telefone</th><th>Pagamento</th><th>Diária</th><th>Impostos</th><th style={{ textAlign: 'right' }}>Ações</th></tr>
            </thead>
            <tbody>
              {labor.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">👷</div><div className="empty-state-text">Nenhuma mão de obra cadastrada</div></div></td></tr>
              ) : (
                labor.map((laborItem) => (
                  <tr key={laborItem.id}>
                    <td className="font-medium">{laborItem.name}</td>
                    <td>{laborItem.role || <span className="text-muted">-</span>}</td>
                    <td>{laborItem.phone || <span className="text-muted">-</span>}</td>
                    <td>
                      <div className="tags">
                        {(laborItem.payment_methods || []).map((methodName: string, itemIndex: number) => <span key={itemIndex} className="tag tag-sm">{methodName}</span>)}
                      </div>
                    </td>
                    <td className="font-bold">{formatCurrency(laborItem.daily_rate)}</td>
                    <td>{laborItem.tax_rate || 0}%</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => setLaborModal({ open: true, data: laborItem })}>✏️</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm({ open: true, type: 'labor', id: laborItem.id, name: laborItem.name })}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <SupplierModal isOpen={supplierModal.open} onClose={() => setSupplierModal({ open: false, data: null })} onSave={loadData} materials={materials} editData={supplierModal.data} />
      <LaborModal isOpen={laborModal.open} onClose={() => setLaborModal({ open: false, data: null })} onSave={loadData} editData={laborModal.data} />
      <MaterialModal isOpen={materialModal.open} onClose={() => setMaterialModal({ open: false, data: null })} onSave={loadData} editData={materialModal.data} />
      <ConfirmDialog isOpen={deleteConfirm.open} title={`Excluir ${deleteConfirm.name}?`} message="Esta ação não pode ser desfeita. Todos os dados relacionados serão removidos." onConfirm={handleDelete} onCancel={() => setDeleteConfirm({ open: false, type: '', id: null, name: '' })} />
    </div>
  );
}

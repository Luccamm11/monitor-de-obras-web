'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, formatCurrency } from '@/lib/api';

/* ==================== MODAL ==================== */
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message }) {
  if (!isOpen) return null;
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
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
function SupplierModal({ isOpen, onClose, onSave, materials, editData }) {
  const [form, setForm] = useState({ name: '', contact: '', phone: '', category: '', tax_rate: 0, payment_methods: [], materials: [] });
  const [newMethod, setNewMethod] = useState('');

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name || '',
        contact: editData.contact || '',
        phone: editData.phone || '',
        category: editData.category || '',
        tax_rate: editData.tax_rate || 0,
        payment_methods: editData.payment_methods || [],
        materials: [],
      });
    } else {
      setForm({ name: '', contact: '', phone: '', category: '', tax_rate: 0, payment_methods: [], materials: [] });
    }
  }, [editData, isOpen]);

  const addPaymentMethod = () => {
    if (newMethod.trim()) {
      setForm({ ...form, payment_methods: [...form.payment_methods, newMethod.trim()] });
      setNewMethod('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editData?.id) {
        await api.updateSupplier(editData.id, form);
      } else {
        const result = await api.createSupplier(form);
        // Add material prices for new supplier
        for (const mat of form.materials) {
          if (mat.price > 0) {
            await api.createPrice({ supplier_id: result.id, material_id: mat.id, price: mat.price });
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
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Contato</label>
            <input className="input" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Telefone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Categoria</label>
            <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Materiais" />
          </div>
          <div className="form-group">
            <label>Impostos (%)</label>
            <input className="input" type="number" step="0.01" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
        <div className="form-group">
          <label>Formas de Pagamento</label>
          <div className="flex gap-2">
            <input className="input" value={newMethod} onChange={(e) => setNewMethod(e.target.value)} placeholder="PIX, Cartão, Boleto..."
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPaymentMethod(); } }} />
            <button type="button" className="btn btn-secondary" onClick={addPaymentMethod}>+</button>
          </div>
          <div className="tags mt-2">
            {form.payment_methods.map((m, i) => (
              <span key={i} className="tag">{m}
                <span className="tag-remove" onClick={() => setForm({ ...form, payment_methods: form.payment_methods.filter((_, j) => j !== i) })}>×</span>
              </span>
            ))}
          </div>
        </div>
        {!editData && materials.length > 0 && (
          <div className="form-group">
            <label>Preços por Material</label>
            {materials.map((m) => (
              <div key={m.id} className="flex gap-2 items-center mt-2">
                <span className="flex-1 text-sm">{m.name} ({m.unit})</span>
                <input className="input" style={{ width: '120px' }} type="number" step="0.01" placeholder="Preço"
                  onChange={(e) => {
                    const newMats = [...form.materials];
                    const idx = newMats.findIndex((x) => x.id === m.id);
                    if (idx >= 0) { newMats[idx].price = parseFloat(e.target.value) || 0; }
                    else { newMats.push({ id: m.id, price: parseFloat(e.target.value) || 0 }); }
                    setForm({ ...form, materials: newMats });
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
function LaborModal({ isOpen, onClose, onSave, editData }) {
  const [form, setForm] = useState({ name: '', role: '', daily_rate: 0, phone: '', tax_rate: 0, payment_methods: [] });
  const [newMethod, setNewMethod] = useState('');

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name || '',
        role: editData.role || '',
        daily_rate: editData.daily_rate || 0,
        phone: editData.phone || '',
        tax_rate: editData.tax_rate || 0,
        payment_methods: editData.payment_methods || [],
      });
    } else {
      setForm({ name: '', role: '', daily_rate: 0, phone: '', tax_rate: 0, payment_methods: [] });
    }
  }, [editData, isOpen]);

  const addPaymentMethod = () => {
    if (newMethod.trim()) {
      setForm({ ...form, payment_methods: [...form.payment_methods, newMethod.trim()] });
      setNewMethod('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editData?.id) {
        await api.updateLabor(editData.id, form);
      } else {
        await api.createLabor(form);
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
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Função</label>
            <input className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Ex: Pedreiro" />
          </div>
          <div className="form-group">
            <label>Diária (R$)</label>
            <input className="input" type="number" step="0.01" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Telefone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Impostos (%)</label>
            <input className="input" type="number" step="0.01" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
        <div className="form-group">
          <label>Formas de Pagamento</label>
          <div className="flex gap-2">
            <input className="input" value={newMethod} onChange={(e) => setNewMethod(e.target.value)} placeholder="PIX, Dinheiro..."
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPaymentMethod(); } }} />
            <button type="button" className="btn btn-secondary" onClick={addPaymentMethod}>+</button>
          </div>
          <div className="tags mt-2">
            {form.payment_methods.map((m, i) => (
              <span key={i} className="tag">{m}
                <span className="tag-remove" onClick={() => setForm({ ...form, payment_methods: form.payment_methods.filter((_, j) => j !== i) })}>×</span>
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
function MaterialModal({ isOpen, onClose, onSave, editData }) {
  const [form, setForm] = useState({ name: '', unit: 'un', category: '' });

  useEffect(() => {
    if (editData) {
      setForm({ name: editData.name || '', unit: editData.unit || 'un', category: editData.category || '' });
    } else {
      setForm({ name: '', unit: 'un', category: '' });
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Unidade</label>
            <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
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
            <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
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
  const [suppliers, setSuppliers] = useState([]);
  const [labor, setLabor] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [prices, setPrices] = useState([]);
  const [filterMaterial, setFilterMaterial] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [expandedMaterial, setExpandedMaterial] = useState(null);

  // Modals
  const [supplierModal, setSupplierModal] = useState({ open: false, data: null });
  const [laborModal, setLaborModal] = useState({ open: false, data: null });
  const [materialModal, setMaterialModal] = useState({ open: false, data: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: '', id: null, name: '' });

  const loadData = useCallback(async () => {
    try {
      const [s, l, m, p] = await Promise.all([
        api.getSuppliers(), api.getLabor(), api.getMaterials(), api.getPrices(),
      ]);
      setSuppliers(s);
      setLabor(l);
      setMaterials(m);
      setPrices(p);
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
    ? prices.filter((p) => p.material_id == filterMaterial)
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
            <select className="input" style={{ width: '200px' }} value={filterMaterial} onChange={(e) => setFilterMaterial(e.target.value)}>
              <option value="">Todos Materiais</option>
              {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <div className="flex gap-2 items-center">
              <label className="text-sm text-muted">Qtd:</label>
              <input className="input" style={{ width: '70px' }} type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} />
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
                <tr><td colSpan="7"><div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-text">Nenhum fornecedor cadastrado</div></div></td></tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.name}</td>
                    <td>{s.category || <span className="text-muted">-</span>}</td>
                    <td>{s.contact || <span className="text-muted">-</span>}</td>
                    <td>{s.phone || <span className="text-muted">-</span>}</td>
                    <td>
                      <div className="tags">
                        {(s.payment_methods || []).map((m, i) => <span key={i} className="tag tag-sm">{m}</span>)}
                      </div>
                    </td>
                    <td>{s.tax_rate || 0}%</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => setSupplierModal({ open: true, data: s })}>✏️</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm({ open: true, type: 'supplier', id: s.id, name: s.name })}>🗑️</button>
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
                <tr><td colSpan="5"><div className="empty-state"><div className="empty-state-icon">💰</div><div className="empty-state-text">Nenhum preço cadastrado</div></div></td></tr>
              ) : (
                filteredPrices.map((p) => {
                  const taxAmount = p.price * (p.tax_rate || 0) / 100;
                  const totalPrice = (p.price + taxAmount) * quantity;
                  return (
                    <tr key={p.id}>
                      <td className="font-medium">{p.supplier_name}</td>
                      <td>{p.material_name} ({p.unit})</td>
                      <td>{formatCurrency(p.price)}</td>
                      <td>{p.tax_rate || 0}%</td>
                      <td className="font-bold text-success">{formatCurrency(totalPrice)}</td>
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
                <tr><td colSpan="5"><div className="empty-state"><div className="empty-state-icon">🧱</div><div className="empty-state-text">Nenhum material cadastrado</div></div></td></tr>
              ) : (
                materials.map((m) => {
                  const matPrices = prices.filter((p) => p.material_id === m.id);
                  const isExpanded = expandedMaterial === m.id;
                  return (
                    <>
                      <tr key={m.id}>
                        <td className="font-medium">{m.name}</td>
                        <td>{m.unit}</td>
                        <td>{m.category || <span className="text-muted">-</span>}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => setExpandedMaterial(isExpanded ? null : m.id)}>
                            📦 {matPrices.length} fornecedor(es) {isExpanded ? '▲' : '▼'}
                          </button>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => setMaterialModal({ open: true, data: m })}>✏️</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm({ open: true, type: 'material', id: m.id, name: m.name })}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && matPrices.length > 0 && (
                        <tr key={`exp-${m.id}`}>
                          <td colSpan="5" style={{ padding: '0 1rem 1rem' }}>
                            <div className="material-expand">
                              {matPrices.map((p) => (
                                <div key={p.id} className="price-row">
                                  <span className="font-medium">{p.supplier_name}</span>
                                  <span className="text-success font-bold">{formatCurrency(p.price)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
                <tr><td colSpan="7"><div className="empty-state"><div className="empty-state-icon">👷</div><div className="empty-state-text">Nenhuma mão de obra cadastrada</div></div></td></tr>
              ) : (
                labor.map((l) => (
                  <tr key={l.id}>
                    <td className="font-medium">{l.name}</td>
                    <td>{l.role || <span className="text-muted">-</span>}</td>
                    <td>{l.phone || <span className="text-muted">-</span>}</td>
                    <td>
                      <div className="tags">
                        {(l.payment_methods || []).map((m, i) => <span key={i} className="tag tag-sm">{m}</span>)}
                      </div>
                    </td>
                    <td className="font-bold">{formatCurrency(l.daily_rate)}</td>
                    <td>{l.tax_rate || 0}%</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => setLaborModal({ open: true, data: l })}>✏️</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm({ open: true, type: 'labor', id: l.id, name: l.name })}>🗑️</button>
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

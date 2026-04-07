'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, formatCurrency, formatDate } from '@/lib/api';

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

/* ==================== CONFIRM ==================== */
function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message }) {
  if (!isOpen) return null;
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">⚠️</div>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-text">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm}>Excluir</button>
        </div>
      </div>
    </div>
  );
}

/* ==================== WORK MODAL ==================== */
function WorkModal({ isOpen, onClose, onSave, editData }) {
  const [form, setForm] = useState({ name: '', address: '', start_date: '', end_date: '', budget: 0, status: 'ACTIVE' });

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name || '',
        address: editData.address || '',
        start_date: editData.start_date ? editData.start_date.split('T')[0] : '',
        end_date: editData.end_date ? editData.end_date.split('T')[0] : '',
        budget: editData.budget || 0,
        status: editData.status || 'ACTIVE',
      });
    } else {
      setForm({ name: '', address: '', start_date: '', end_date: '', budget: 0, status: 'ACTIVE' });
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editData?.id) {
        await api.updateWork(editData.id, form);
      } else {
        await api.createWork(form);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? 'Editar Obra' : 'Nova Obra'}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome da Obra *</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Endereço</label>
          <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Orçamento Previsto (R$)</label>
          <input className="input" type="number" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Data Início</label>
            <input className="input" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Data Fim (Prevista)</label>
            <input className="input" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Em Andamento</option>
            <option value="COMPLETED">Concluída</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
        </div>
        <button type="submit" className="btn btn-block mt-4">{editData ? 'Salvar Alterações' : 'Criar Obra'}</button>
      </form>
    </Modal>
  );
}

/* ==================== TRANSACTION MODAL ==================== */
function TransactionModal({ isOpen, onClose, onSave, workId, suppliers, labor, materials, prices, editData }) {
  const [form, setForm] = useState({
    description: '', amount: 0, category: '', supplier_id: '', labor_id: '',
    date: new Date().toISOString().split('T')[0], selectedMaterial: '',
  });

  useEffect(() => {
    if (editData) {
      setForm({
        description: editData.description || '',
        amount: editData.amount || 0,
        category: editData.category || '',
        supplier_id: editData.supplier_id || '',
        labor_id: editData.labor_id || '',
        date: editData.date ? editData.date.split('T')[0] : new Date().toISOString().split('T')[0],
        selectedMaterial: '',
      });
    } else {
      setForm({
        description: '', amount: 0, category: '', supplier_id: '', labor_id: '',
        date: new Date().toISOString().split('T')[0], selectedMaterial: '',
      });
    }
  }, [editData, isOpen]);

  // When a material is selected, show available supplier prices
  const materialPrices = form.selectedMaterial
    ? prices.filter((p) => p.material_id == form.selectedMaterial)
    : [];

  const handleSelectSupplierPrice = (price) => {
    setForm({
      ...form,
      supplier_id: price.supplier_id,
      amount: price.price,
      description: form.description || price.material_name,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      description: form.description,
      amount: form.amount,
      category: form.category,
      date: form.date,
      work_id: workId,
      supplier_id: form.supplier_id || null,
      labor_id: form.labor_id || null,
    };

    try {
      if (editData?.id) {
        await api.updateTransaction(editData.id, payload);
      } else {
        await api.createTransaction(payload);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? 'Editar Despesa' : 'Adicionar Despesa'}>
      <form onSubmit={handleSubmit}>
        {/* Material → Supplier Price Selector */}
        {!editData && materials.length > 0 && (
          <div className="form-group">
            <label>🔍 Selecionar Material (ver preços por fornecedor)</label>
            <select className="input" value={form.selectedMaterial} onChange={(e) => setForm({ ...form, selectedMaterial: e.target.value })}>
              <option value="">Selecione um material...</option>
              {materials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
            </select>
            {materialPrices.length > 0 && (
              <div className="material-expand mt-2">
                <p className="text-xs text-muted mb-2">Clique em um fornecedor para preencher automaticamente:</p>
                {materialPrices.map((p) => (
                  <div key={p.id} className="price-row" style={{ cursor: 'pointer' }}
                    onClick={() => handleSelectSupplierPrice(p)}>
                    <span className="font-medium">{p.supplier_name}</span>
                    <span className="text-success font-bold">{formatCurrency(p.price)}</span>
                  </div>
                ))}
              </div>
            )}
            {form.selectedMaterial && materialPrices.length === 0 && (
              <p className="text-xs text-muted mt-2">Nenhum fornecedor com preço cadastrado para este material.</p>
            )}
          </div>
        )}

        <div className="form-group">
          <label>Descrição *</label>
          <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Valor (R$) *</label>
            <input className="input" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} required />
          </div>
          <div className="form-group">
            <label>Data</label>
            <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Categoria</label>
          <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} list="categories" placeholder="Ex: Material, Mão de Obra" />
          <datalist id="categories">
            <option value="Material Hidráulico" />
            <option value="Material Elétrico" />
            <option value="Alvenaria" />
            <option value="Mão de Obra" />
            <option value="Acabamento" />
          </datalist>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Fornecedor</label>
            <select className="input" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value, labor_id: '' })}>
              <option value="">Selecione...</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Mão de Obra</label>
            <select className="input" value={form.labor_id} onChange={(e) => setForm({ ...form, labor_id: e.target.value, supplier_id: '' })}>
              <option value="">Selecione...</option>
              {labor.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" className="btn btn-block mt-4">
          {editData ? 'Salvar Alterações' : 'Adicionar Despesa'}
        </button>
      </form>
    </Modal>
  );
}

/* ==================== OBRAS PAGE ==================== */
export default function ObrasPage() {
  const [works, setWorks] = useState([]);
  const [activeWork, setActiveWork] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [labor, setLabor] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [prices, setPrices] = useState([]);

  const [workModal, setWorkModal] = useState({ open: false, data: null });
  const [txModal, setTxModal] = useState({ open: false, data: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: '', id: null, name: '' });

  const loadWorks = useCallback(async () => {
    try {
      setWorks(await api.getWorks());
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadWorkDetails = useCallback(async (workId) => {
    try {
      const [txs, s, l, m, p] = await Promise.all([
        api.getTransactions({ work_id: workId }),
        api.getSuppliers(),
        api.getLabor(),
        api.getMaterials(),
        api.getPrices(),
      ]);
      setTransactions(txs);
      setSuppliers(s);
      setLabor(l);
      setMaterials(m);
      setPrices(p);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadWorks(); }, [loadWorks]);
  useEffect(() => { if (activeWork) loadWorkDetails(activeWork.id); }, [activeWork, loadWorkDetails]);

  const handleDelete = async () => {
    const { type, id } = deleteConfirm;
    try {
      if (type === 'work') {
        await api.deleteWork(id);
        setActiveWork(null);
        loadWorks();
      } else if (type === 'transaction') {
        await api.deleteTransaction(id);
        loadWorkDetails(activeWork.id);
        loadWorks();
      }
    } catch (err) {
      console.error(err);
    }
    setDeleteConfirm({ open: false, type: '', id: null, name: '' });
  };

  const statusLabels = { ACTIVE: 'Em Andamento', COMPLETED: 'Concluída', CANCELLED: 'Cancelada' };

  // Work Detail View
  if (activeWork) {
    return (
      <div>
        <button className="btn btn-secondary mb-4" onClick={() => setActiveWork(null)}>← Voltar para Obras</button>

        <div className="card glass mb-4">
          <div className="flex justify-between items-start" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{activeWork.name}</h1>
              <p className="text-muted">{activeWork.address || 'Sem endereço'}</p>
              <div className="tags mt-2">
                <span className={`tag ${activeWork.status === 'ACTIVE' ? 'tag-success' : activeWork.status === 'COMPLETED' ? '' : 'tag-danger'}`}>
                  {statusLabels[activeWork.status] || activeWork.status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="stat-label">Custo Total</p>
              <p className="stat-value">{formatCurrency(activeWork.total_cost)}</p>
              {activeWork.budget > 0 && (
                <p className="text-sm text-muted mt-1">Orçamento: {formatCurrency(activeWork.budget)}</p>
              )}
            </div>
          </div>
        </div>

        <div className="topbar">
          <h2 style={{ margin: 0 }}>Transações da Obra</h2>
          <button className="btn" onClick={() => setTxModal({ open: true, data: null })}>+ Adicionar Despesa</button>
        </div>

        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Fornecedor/MO</th><th>Valor</th><th style={{ textAlign: 'right' }}>Ações</th></tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan="6"><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">Nenhuma transação nesta obra</div></div></td></tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{formatDate(t.date)}</td>
                      <td className="font-medium">{t.description}</td>
                      <td>{t.category || <span className="text-muted">-</span>}</td>
                      <td>{t.supplier_name || t.labor_name || <span className="text-muted">-</span>}</td>
                      <td className="font-bold text-danger">{formatCurrency(t.amount)}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => setTxModal({ open: true, data: t })}>✏️</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm({ open: true, type: 'transaction', id: t.id, name: t.description })}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <TransactionModal
          isOpen={txModal.open}
          onClose={() => setTxModal({ open: false, data: null })}
          onSave={() => { loadWorkDetails(activeWork.id); loadWorks(); }}
          workId={activeWork.id}
          suppliers={suppliers}
          labor={labor}
          materials={materials}
          prices={prices}
          editData={txModal.data}
        />
        <ConfirmDialog isOpen={deleteConfirm.open} title={`Excluir "${deleteConfirm.name}"?`} message="Esta ação não pode ser desfeita." onConfirm={handleDelete} onCancel={() => setDeleteConfirm({ open: false, type: '', id: null, name: '' })} />
      </div>
    );
  }

  // Works List View
  return (
    <div>
      <div className="page-header">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="page-title">Obras</h1>
            <p className="page-subtitle">Gerencie suas obras e despesas</p>
          </div>
          <button className="btn" onClick={() => setWorkModal({ open: true, data: null })}>+ Nova Obra</button>
        </div>
      </div>

      <div className="grid-3">
        {works.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state">
              <div className="empty-state-icon">🏗️</div>
              <div className="empty-state-text">Nenhuma obra cadastrada</div>
              <div className="empty-state-hint">Clique em "+ Nova Obra" para começar</div>
            </div>
          </div>
        ) : (
          works.map((work) => (
            <div key={work.id} className={`card card-hover work-card status-${work.status}`} onClick={() => setActiveWork(work)}>
              <div className="flex justify-between items-start">
                <div className="work-card-name">{work.name}</div>
                <span className={`tag tag-sm ${work.status === 'ACTIVE' ? 'tag-success' : work.status === 'COMPLETED' ? '' : 'tag-danger'}`}>
                  {statusLabels[work.status] || work.status}
                </span>
              </div>
              <p className="work-card-address">{work.address || 'Sem endereço'}</p>

              <div className="work-card-footer">
                <div>
                  <div className="work-card-cost-label">Custo Atual</div>
                  <div className="work-card-cost">{formatCurrency(work.total_cost)}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setWorkModal({ open: true, data: work }); }}>✏️</button>
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, type: 'work', id: work.id, name: work.name }); }}>🗑️</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <WorkModal isOpen={workModal.open} onClose={() => setWorkModal({ open: false, data: null })} onSave={loadWorks} editData={workModal.data} />
      <ConfirmDialog isOpen={deleteConfirm.open} title={`Excluir "${deleteConfirm.name}"?`} message="Esta ação não pode ser desfeita. Todas as transações desta obra serão desvinculadas." onConfirm={handleDelete} onCancel={() => setDeleteConfirm({ open: false, type: '', id: null, name: '' })} />
    </div>
  );
}

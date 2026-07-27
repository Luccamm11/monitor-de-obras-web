'use client';

import { useState, useEffect, useCallback, FormEvent, MouseEvent, ReactNode } from 'react';
import { api, formatCurrency, formatDate } from '@/lib/api';

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

/* ==================== CONFIRM ==================== */
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
function WorkModal({
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
  const [form, setForm] = useState({ name: '', address: '', start_date: '', end_date: '', budget: '0', status: 'ACTIVE' });

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name || '',
        address: editData.address || '',
        start_date: editData.start_date ? editData.start_date.split('T')[0] : '',
        end_date: editData.end_date ? editData.end_date.split('T')[0] : '',
        budget: String(editData.budget || 0),
        status: editData.status || 'ACTIVE',
      });
    } else {
      setForm({ name: '', address: '', start_date: '', end_date: '', budget: '0', status: 'ACTIVE' });
    }
  }, [editData, isOpen]);

  const handleSubmit = async (formSubmitEvent: FormEvent) => {
    formSubmitEvent.preventDefault();
    try {
      const payload = { ...form, budget: parseFloat(form.budget) || 0 };
      if (editData?.id) {
        await api.updateWork(editData.id, payload);
      } else {
        await api.createWork(payload);
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
          <input className="input" value={form.name} onChange={(inputChangeEvent) => setForm({ ...form, name: inputChangeEvent.target.value })} required />
        </div>
        <div className="form-group">
          <label>Endereço</label>
          <input className="input" value={form.address} onChange={(inputChangeEvent) => setForm({ ...form, address: inputChangeEvent.target.value })} />
        </div>
        <div className="form-group">
          <label>Orçamento Previsto (R$)</label>
          <input className="input" type="number" step="0.01" value={form.budget} onChange={(inputChangeEvent) => setForm({ ...form, budget: inputChangeEvent.target.value })} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Data Início</label>
            <input className="input" type="date" value={form.start_date} onChange={(inputChangeEvent) => setForm({ ...form, start_date: inputChangeEvent.target.value })} />
          </div>
          <div className="form-group">
            <label>Data Fim (Prevista)</label>
            <input className="input" type="date" value={form.end_date} onChange={(inputChangeEvent) => setForm({ ...form, end_date: inputChangeEvent.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select className="input" value={form.status} onChange={(inputChangeEvent) => setForm({ ...form, status: inputChangeEvent.target.value })}>
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
function TransactionModal({
  isOpen,
  onClose,
  onSave,
  workId,
  suppliers,
  labor,
  materials,
  prices,
  editData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  workId: any;
  suppliers: any[];
  labor: any[];
  materials: any[];
  prices: any[];
  editData: any;
}) {
  const [form, setForm] = useState({
    description: '', amount: '0', category: '', supplier_id: '', labor_id: '',
    date: new Date().toISOString().split('T')[0], selectedMaterial: '',
  });

  useEffect(() => {
    if (editData) {
      setForm({
        description: editData.description || '',
        amount: String(editData.amount || 0),
        category: editData.category || '',
        supplier_id: editData.supplier_id || '',
        labor_id: editData.labor_id || '',
        date: editData.date ? editData.date.split('T')[0] : new Date().toISOString().split('T')[0],
        selectedMaterial: '',
      });
    } else {
      setForm({
        description: '', amount: '0', category: '', supplier_id: '', labor_id: '',
        date: new Date().toISOString().split('T')[0], selectedMaterial: '',
      });
    }
  }, [editData, isOpen]);

  const materialPrices = form.selectedMaterial
    ? prices.filter((priceRecord) => String(priceRecord.material_id) === form.selectedMaterial)
    : [];

  const handleSelectSupplierPrice = (priceRecord: any) => {
    setForm({
      ...form,
      supplier_id: priceRecord.supplier_id,
      amount: String(priceRecord.price),
      description: form.description || priceRecord.material_name,
    });
  };

  const handleSubmit = async (formSubmitEvent: FormEvent) => {
    formSubmitEvent.preventDefault();
    const payload = {
      description: form.description,
      amount: parseFloat(form.amount) || 0,
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
        {!editData && materials.length > 0 && (
          <div className="form-group">
            <label>🔍 Selecionar Material (ver preços por fornecedor)</label>
            <select className="input" value={form.selectedMaterial} onChange={(inputChangeEvent) => setForm({ ...form, selectedMaterial: inputChangeEvent.target.value })}>
              <option value="">Selecione um material...</option>
              {materials.map((materialOption) => <option key={materialOption.id} value={materialOption.id}>{materialOption.name} ({materialOption.unit})</option>)}
            </select>
            {materialPrices.length > 0 && (
              <div className="material-expand mt-2">
                <p className="text-xs text-muted mb-2">Clique em um fornecedor para preencher automaticamente:</p>
                {materialPrices.map((priceRecord) => (
                  <div key={priceRecord.id} className="price-row" style={{ cursor: 'pointer' }}
                    onClick={() => handleSelectSupplierPrice(priceRecord)}>
                    <span className="font-medium">{priceRecord.supplier_name}</span>
                    <span className="text-success font-bold">{formatCurrency(priceRecord.price)}</span>
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
          <input className="input" value={form.description} onChange={(inputChangeEvent) => setForm({ ...form, description: inputChangeEvent.target.value })} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Valor (R$) *</label>
            <input className="input" type="number" step="0.01" value={form.amount} onChange={(inputChangeEvent) => setForm({ ...form, amount: inputChangeEvent.target.value })} required />
          </div>
          <div className="form-group">
            <label>Data</label>
            <input className="input" type="date" value={form.date} onChange={(inputChangeEvent) => setForm({ ...form, date: inputChangeEvent.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Categoria</label>
          <input className="input" value={form.category} onChange={(inputChangeEvent) => setForm({ ...form, category: inputChangeEvent.target.value })} list="categories" placeholder="Ex: Material, Mão de Obra" />
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
            <select className="input" value={form.supplier_id} onChange={(inputChangeEvent) => setForm({ ...form, supplier_id: inputChangeEvent.target.value, labor_id: '' })}>
              <option value="">Selecione...</option>
              {suppliers.map((supplierOption) => <option key={supplierOption.id} value={supplierOption.id}>{supplierOption.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Mão de Obra</label>
            <select className="input" value={form.labor_id} onChange={(inputChangeEvent) => setForm({ ...form, labor_id: inputChangeEvent.target.value, supplier_id: '' })}>
              <option value="">Selecione...</option>
              {labor.map((laborOption) => <option key={laborOption.id} value={laborOption.id}>{laborOption.name}</option>)}
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
  const [works, setWorks] = useState<any[]>([]);
  const [activeWork, setActiveWork] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [labor, setLabor] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);

  const [workModal, setWorkModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [txModal, setTxModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: string; id: any; name: string }>({ open: false, type: '', id: null, name: '' });

  const loadWorks = useCallback(async () => {
    try {
      setWorks(await api.getWorks());
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadWorkDetails = useCallback(async (workId: any) => {
    try {
      const [fetchedTxs, fetchedSuppliers, fetchedLabor, fetchedMaterials, fetchedPrices] = await Promise.all([
        api.getTransactions({ work_id: workId }),
        api.getSuppliers(),
        api.getLabor(),
        api.getMaterials(),
        api.getPrices(),
      ]);
      setTransactions(fetchedTxs);
      setSuppliers(fetchedSuppliers);
      setLabor(fetchedLabor);
      setMaterials(fetchedMaterials);
      setPrices(fetchedPrices);
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
        if (activeWork) loadWorkDetails(activeWork.id);
        loadWorks();
      }
    } catch (err) {
      console.error(err);
    }
    setDeleteConfirm({ open: false, type: '', id: null, name: '' });
  };

  const statusLabels: Record<string, string> = { ACTIVE: 'Em Andamento', COMPLETED: 'Concluída', CANCELLED: 'Cancelada' };

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
                  <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">Nenhuma transação nesta obra</div></div></td></tr>
                ) : (
                  transactions.map((transactionRow) => (
                    <tr key={transactionRow.id}>
                      <td>{formatDate(transactionRow.date)}</td>
                      <td className="font-medium">{transactionRow.description}</td>
                      <td>{transactionRow.category || <span className="text-muted">-</span>}</td>
                      <td>{transactionRow.supplier_name || transactionRow.labor_name || <span className="text-muted">-</span>}</td>
                      <td className="font-bold text-danger">{formatCurrency(transactionRow.amount)}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => setTxModal({ open: true, data: transactionRow })}>✏️</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm({ open: true, type: 'transaction', id: transactionRow.id, name: transactionRow.description })}>🗑️</button>
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
          works.map((workCardItem) => (
            <div key={workCardItem.id} className={`card card-hover work-card status-${workCardItem.status}`} onClick={() => setActiveWork(workCardItem)}>
              <div className="flex justify-between items-start">
                <div className="work-card-name">{workCardItem.name}</div>
                <span className={`tag tag-sm ${workCardItem.status === 'ACTIVE' ? 'tag-success' : workCardItem.status === 'COMPLETED' ? '' : 'tag-danger'}`}>
                  {statusLabels[workCardItem.status] || workCardItem.status}
                </span>
              </div>
              <p className="work-card-address">{workCardItem.address || 'Sem endereço'}</p>

              <div className="work-card-footer">
                <div>
                  <div className="work-card-cost-label">Custo Atual</div>
                  <div className="work-card-cost">{formatCurrency(workCardItem.total_cost)}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={(cardClickEvent: MouseEvent<HTMLButtonElement>) => { cardClickEvent.stopPropagation(); setWorkModal({ open: true, data: workCardItem }); }}>✏️</button>
                  <button className="btn btn-ghost btn-sm" onClick={(cardClickEvent: MouseEvent<HTMLButtonElement>) => { cardClickEvent.stopPropagation(); setDeleteConfirm({ open: true, type: 'work', id: workCardItem.id, name: workCardItem.name }); }}>🗑️</button>
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

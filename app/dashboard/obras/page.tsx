'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { api, formatCurrency, formatDate } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogBody, ConfirmDialog } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, ArrowLeft, Building2, TrendingDown, Wallet } from 'lucide-react';

/* ==================== HELPERS ==================== */
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'secondary' | 'destructive' }> = {
  ACTIVE: { label: 'Em Andamento', variant: 'success' },
  COMPLETED: { label: 'Concluída', variant: 'secondary' },
  CANCELLED: { label: 'Cancelada', variant: 'destructive' },
};

/* ==================== WORK MODAL ==================== */
function WorkModal({ isOpen, onClose, onSave, editData }: {
  isOpen: boolean; onClose: () => void; onSave: () => void; editData: any;
}) {
  const [form, setForm] = useState({ name: '', address: '', start_date: '', end_date: '', budget: '0', status: 'ACTIVE' });

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name || '', address: editData.address || '',
        start_date: editData.start_date ? String(editData.start_date).split('T')[0] : '',
        end_date: editData.end_date ? String(editData.end_date).split('T')[0] : '',
        budget: String(editData.budget || 0), status: editData.status || 'ACTIVE',
      });
    } else {
      setForm({ name: '', address: '', start_date: '', end_date: '', budget: '0', status: 'ACTIVE' });
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, budget: parseFloat(form.budget) || 0 };
      if (editData?.id) { await api.updateWork(editData.id, payload); } else { await api.createWork(payload); }
      onSave(); onClose();
    } catch (err) { console.error(err); }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent>
        <DialogHeader title={editData ? 'Editar Obra' : 'Nova Obra'} onClose={onClose} />
        <DialogBody>
          <form onSubmit={handleSubmit}>
            <FormField label="Nome da Obra *">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nome da obra" />
            </FormField>
            <FormField label="Endereço">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Endereço da obra" />
            </FormField>
            <FormField label="Orçamento Previsto (R$)">
              <Input type="number" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Data Início">
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </FormField>
              <FormField label="Data Fim Prevista">
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Status">
              <select className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="ACTIVE">Em Andamento</option>
                <option value="COMPLETED">Concluída</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </FormField>
            <Button type="submit" className="w-full mt-2">{editData ? 'Salvar Alterações' : 'Criar Obra'}</Button>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== TRANSACTION MODAL ==================== */
function TransactionModal({ isOpen, onClose, onSave, workId, suppliers, labor, materials, prices, editData }: {
  isOpen: boolean; onClose: () => void; onSave: () => void;
  workId: any; suppliers: any[]; labor: any[]; materials: any[]; prices: any[]; editData: any;
}) {
  const [form, setForm] = useState({
    description: '', amount: '0', category: '', supplier_id: '', labor_id: '',
    date: new Date().toISOString().split('T')[0], selectedMaterial: '',
  });

  useEffect(() => {
    if (editData) {
      setForm({ description: editData.description || '', amount: String(editData.amount || 0), category: editData.category || '', supplier_id: editData.supplier_id || '', labor_id: editData.labor_id || '', date: editData.date ? String(editData.date).split('T')[0] : new Date().toISOString().split('T')[0], selectedMaterial: '' });
    } else {
      setForm({ description: '', amount: '0', category: '', supplier_id: '', labor_id: '', date: new Date().toISOString().split('T')[0], selectedMaterial: '' });
    }
  }, [editData, isOpen]);

  const materialPrices = form.selectedMaterial ? prices.filter((p) => String(p.material_id) === form.selectedMaterial) : [];

  const handleSelectPrice = (p: any) => {
    setForm({ ...form, supplier_id: p.supplier_id, amount: String(p.price), description: form.description || p.material_name });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = { description: form.description, amount: parseFloat(form.amount) || 0, category: form.category, date: form.date, work_id: workId, supplier_id: form.supplier_id || null, labor_id: form.labor_id || null };
      if (editData?.id) { await api.updateTransaction(editData.id, payload); } else { await api.createTransaction(payload); }
      onSave(); onClose();
    } catch (err) { console.error(err); }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent>
        <DialogHeader title={editData ? 'Editar Despesa' : 'Adicionar Despesa'} onClose={onClose} />
        <DialogBody>
          <form onSubmit={handleSubmit}>
            {!editData && materials.length > 0 && (
              <FormField label="Selecionar por Material">
                <select className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.selectedMaterial} onChange={(e) => setForm({ ...form, selectedMaterial: e.target.value })}>
                  <option value="">Escolha um material...</option>
                  {materials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select>
                {materialPrices.length > 0 && (
                  <div className="mt-2 rounded-lg border border-slate-700 overflow-hidden">
                    <p className="text-xs text-slate-500 px-3 py-2 border-b border-slate-700 bg-slate-800/50">Clique para preencher automaticamente</p>
                    {materialPrices.map((p: any) => (
                      <button key={p.id} type="button" onClick={() => handleSelectPrice(p)}
                        className="w-full flex justify-between items-center px-3 py-2.5 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50 transition-colors text-sm">
                        <span className="text-slate-300">{p.supplier_name}</span>
                        <span className="text-emerald-400 font-bold">{formatCurrency(p.price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </FormField>
            )}
            <FormField label="Descrição *">
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="Descrição da despesa" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Valor (R$) *">
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </FormField>
              <FormField label="Data">
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Categoria">
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} list="cats" placeholder="Ex: Material, Mão de Obra" />
              <datalist id="cats">
                {['Material Hidráulico', 'Material Elétrico', 'Alvenaria', 'Mão de Obra', 'Acabamento'].map(c => <option key={c} value={c} />)}
              </datalist>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Fornecedor">
                <select className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value, labor_id: '' })}>
                  <option value="">Selecione...</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FormField>
              <FormField label="Mão de Obra">
                <select className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.labor_id} onChange={(e) => setForm({ ...form, labor_id: e.target.value, supplier_id: '' })}>
                  <option value="">Selecione...</option>
                  {labor.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </FormField>
            </div>
            <Button type="submit" className="w-full mt-2">{editData ? 'Salvar Alterações' : 'Adicionar Despesa'}</Button>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
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
    try { setWorks(await api.getWorks()); } catch (err) { console.error(err); }
  }, []);

  const loadWorkDetails = useCallback(async (workId: any) => {
    try {
      const [txs, s, l, m, p] = await Promise.all([api.getTransactions({ work_id: workId }), api.getSuppliers(), api.getLabor(), api.getMaterials(), api.getPrices()]);
      setTransactions(txs); setSuppliers(s); setLabor(l); setMaterials(m); setPrices(p);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadWorks(); }, [loadWorks]);
  useEffect(() => { if (activeWork) loadWorkDetails(activeWork.id); }, [activeWork, loadWorkDetails]);

  const handleDelete = async () => {
    const { type, id } = deleteConfirm;
    try {
      if (type === 'work') { await api.deleteWork(id); setActiveWork(null); loadWorks(); }
      else if (type === 'transaction') { await api.deleteTransaction(id); if (activeWork) { loadWorkDetails(activeWork.id); loadWorks(); } }
    } catch (err) { console.error(err); }
    setDeleteConfirm({ open: false, type: '', id: null, name: '' });
  };

  const thClass = 'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/50 border-b border-slate-800';
  const tdClass = 'px-4 py-3 text-sm text-slate-200 border-b border-slate-800/60';

  /* ---- WORK DETAIL VIEW ---- */
  if (activeWork) {
    const { label, variant } = STATUS_MAP[activeWork.status] || { label: activeWork.status, variant: 'secondary' as const };
    const budgetPct = activeWork.budget > 0 ? Math.min(100, (activeWork.total_cost / activeWork.budget) * 100) : 0;
    const overBudget = activeWork.budget > 0 && activeWork.total_cost > activeWork.budget;

    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setActiveWork(null)} className="gap-1">
          <ArrowLeft size={14} /> Voltar para Obras
        </Button>

        <Card>
          <div className="flex flex-wrap gap-4 items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-100">{activeWork.name}</h1>
                <Badge variant={variant}>{label}</Badge>
              </div>
              <p className="text-sm text-slate-500">{activeWork.address || 'Sem endereço'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Custo Total</p>
              <p className={`text-3xl font-extrabold ${overBudget ? 'text-red-400' : 'text-emerald-400'}`}>{formatCurrency(activeWork.total_cost)}</p>
              {activeWork.budget > 0 && (
                <p className="text-xs text-slate-500 mt-1">Orçamento: {formatCurrency(activeWork.budget)}</p>
              )}
            </div>
          </div>

          {activeWork.budget > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Progresso do Orçamento</span>
                <span>{budgetPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
            </div>
          )}
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Transações da Obra</h2>
          <Button size="sm" onClick={() => setTxModal({ open: true, data: null })}><Plus size={14} /> Adicionar Despesa</Button>
        </div>

        <Card>
          <CardContent>
            <div className="overflow-x-auto -mx-6 -mb-6">
              <table className="w-full">
                <thead><tr>
                  {['Data', 'Descrição', 'Categoria', 'Fornecedor / MO', 'Valor', ''].map(h => <th key={h} className={thClass}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                        <div className="text-4xl mb-3 opacity-40">📋</div>
                        <p className="text-sm">Nenhuma transação nesta obra</p>
                      </div>
                    </td></tr>
                  ) : transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className={tdClass}>{formatDate(t.date)}</td>
                      <td className={`${tdClass} font-medium text-slate-100`}>{t.description}</td>
                      <td className={tdClass}>{t.category ? <Badge variant="secondary">{t.category}</Badge> : <span className="text-slate-600">—</span>}</td>
                      <td className={tdClass}>{t.supplier_name || t.labor_name || <span className="text-slate-600">—</span>}</td>
                      <td className={`${tdClass} font-bold text-red-400`}>{formatCurrency(t.amount)}</td>
                      <td className={`${tdClass} text-right`}>
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => setTxModal({ open: true, data: t })}><Pencil size={14} /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ open: true, type: 'transaction', id: t.id, name: t.description })} className="hover:text-red-400"><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <TransactionModal isOpen={txModal.open} onClose={() => setTxModal({ open: false, data: null })} onSave={() => { loadWorkDetails(activeWork.id); loadWorks(); }} workId={activeWork.id} suppliers={suppliers} labor={labor} materials={materials} prices={prices} editData={txModal.data} />
        <ConfirmDialog open={deleteConfirm.open} title={`Excluir "${deleteConfirm.name}"?`} message="Esta ação não pode ser desfeita." onConfirm={handleDelete} onCancel={() => setDeleteConfirm({ open: false, type: '', id: null, name: '' })} />
      </div>
    );
  }

  /* ---- WORKS LIST VIEW ---- */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Obras</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie suas obras e despesas</p>
        </div>
        <Button size="sm" onClick={() => setWorkModal({ open: true, data: null })}><Plus size={14} /> Nova Obra</Button>
      </div>

      {works.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <div className="text-5xl mb-4 opacity-30">🏗️</div>
            <p className="text-base font-medium mb-1">Nenhuma obra cadastrada</p>
            <p className="text-sm">Clique em "Nova Obra" para começar</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {works.map((work) => {
            const { label, variant } = STATUS_MAP[work.status] || { label: work.status, variant: 'secondary' as const };
            const pct = work.budget > 0 ? Math.min(100, (work.total_cost / work.budget) * 100) : 0;
            const over = work.budget > 0 && work.total_cost > work.budget;
            return (
              <Card key={work.id} className="cursor-pointer group hover:border-blue-500/50 transition-all" onClick={() => setActiveWork(work)}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{work.name}</CardTitle>
                    <Badge variant={variant} className="shrink-0">{label}</Badge>
                  </div>
                  {work.address && <p className="text-xs text-slate-500 mt-1 truncate">{work.address}</p>}
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide flex items-center gap-1"><TrendingDown size={10} /> Custo Atual</p>
                      <p className={`text-xl font-bold mt-0.5 ${over ? 'text-red-400' : 'text-emerald-400'}`}>{formatCurrency(work.total_cost)}</p>
                    </div>
                    {work.budget > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-slate-500 flex items-center gap-1 justify-end"><Wallet size={10} /> Orçamento</p>
                        <p className="text-sm font-semibold text-slate-300">{formatCurrency(work.budget)}</p>
                      </div>
                    )}
                  </div>

                  {work.budget > 0 && (
                    <div className="mb-3">
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setWorkModal({ open: true, data: work }); }}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, type: 'work', id: work.id, name: work.name }); }} className="hover:text-red-400"><Trash2 size={14} /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <WorkModal isOpen={workModal.open} onClose={() => setWorkModal({ open: false, data: null })} onSave={loadWorks} editData={workModal.data} />
      <ConfirmDialog open={deleteConfirm.open} title={`Excluir "${deleteConfirm.name}"?`} message="Esta ação não pode ser desfeita." onConfirm={handleDelete} onCancel={() => setDeleteConfirm({ open: false, type: '', id: null, name: '' })} />
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { api, formatCurrency } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogBody, ConfirmDialog } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Package, Users, Layers, ChevronDown, ChevronUp } from 'lucide-react';

/* ==================== FORM FIELD ==================== */
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

/* ==================== SUPPLIER MODAL ==================== */
function SupplierModal({ isOpen, onClose, onSave, materials, editData }: {
  isOpen: boolean; onClose: () => void; onSave: () => void; materials: any[]; editData: any;
}) {
  const [form, setForm] = useState({ name: '', contact: '', phone: '', category: '', tax_rate: '0', payment_methods: [] as string[], materials: [] as { id: number; price: string }[] });
  const [newMethod, setNewMethod] = useState('');

  useEffect(() => {
    if (editData) {
      setForm({ name: editData.name || '', contact: editData.contact || '', phone: editData.phone || '', category: editData.category || '', tax_rate: String(editData.tax_rate || 0), payment_methods: editData.payment_methods || [], materials: [] });
    } else {
      setForm({ name: '', contact: '', phone: '', category: '', tax_rate: '0', payment_methods: [], materials: [] });
    }
  }, [editData, isOpen]);

  const addMethod = () => {
    if (newMethod.trim()) { setForm({ ...form, payment_methods: [...form.payment_methods, newMethod.trim()] }); setNewMethod(''); }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, tax_rate: parseFloat(form.tax_rate) || 0 };
      if (editData?.id) {
        await api.updateSupplier(editData.id, payload);
      } else {
        const result = await api.createSupplier(payload);
        for (const mat of form.materials) {
          const p = parseFloat(mat.price) || 0;
          if (p > 0) await api.createPrice({ supplier_id: result.id, material_id: mat.id, price: p });
        }
      }
      onSave(); onClose();
    } catch (err) { console.error(err); }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent>
        <DialogHeader title={editData ? 'Editar Fornecedor' : 'Novo Fornecedor'} onClose={onClose} />
        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-0">
            <FormField label="Nome *">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nome do fornecedor" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Contato">
                <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Nome do contato" />
              </FormField>
              <FormField label="Telefone">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Categoria">
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Materiais" />
              </FormField>
              <FormField label="Impostos (%)">
                <Input type="number" step="0.01" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Formas de Pagamento">
              <div className="flex gap-2">
                <Input value={newMethod} onChange={(e) => setNewMethod(e.target.value)} placeholder="PIX, Cartão, Boleto..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMethod(); } }} />
                <Button type="button" variant="secondary" size="sm" onClick={addMethod}><Plus size={14} /></Button>
              </div>
              {form.payment_methods.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.payment_methods.map((m, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs">
                      {m}
                      <button type="button" onClick={() => setForm({ ...form, payment_methods: form.payment_methods.filter((_, j) => j !== i) })} className="hover:text-white ml-0.5">×</button>
                    </span>
                  ))}
                </div>
              )}
            </FormField>
            {!editData && materials.length > 0 && (
              <FormField label="Preços por Material">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {materials.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-slate-300">{m.name} <span className="text-slate-500">({m.unit})</span></span>
                      <Input className="w-28" type="number" step="0.01" placeholder="0,00"
                        value={form.materials.find(x => x.id === m.id)?.price || ''}
                        onChange={(e) => {
                          const newMats = [...form.materials];
                          const idx = newMats.findIndex(x => x.id === m.id);
                          if (idx >= 0) { newMats[idx].price = e.target.value; } else { newMats.push({ id: m.id, price: e.target.value }); }
                          setForm({ ...form, materials: newMats });
                        }} />
                    </div>
                  ))}
                </div>
              </FormField>
            )}
            <Button type="submit" className="w-full mt-2">{editData ? 'Salvar Alterações' : 'Salvar Fornecedor'}</Button>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== LABOR MODAL ==================== */
function LaborModal({ isOpen, onClose, onSave, editData }: {
  isOpen: boolean; onClose: () => void; onSave: () => void; editData: any;
}) {
  const [form, setForm] = useState({ name: '', role: '', daily_rate: '0', phone: '', tax_rate: '0', payment_methods: [] as string[] });
  const [newMethod, setNewMethod] = useState('');

  useEffect(() => {
    if (editData) {
      setForm({ name: editData.name || '', role: editData.role || '', daily_rate: String(editData.daily_rate || 0), phone: editData.phone || '', tax_rate: String(editData.tax_rate || 0), payment_methods: editData.payment_methods || [] });
    } else {
      setForm({ name: '', role: '', daily_rate: '0', phone: '', tax_rate: '0', payment_methods: [] });
    }
  }, [editData, isOpen]);

  const addMethod = () => {
    if (newMethod.trim()) { setForm({ ...form, payment_methods: [...form.payment_methods, newMethod.trim()] }); setNewMethod(''); }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, daily_rate: parseFloat(form.daily_rate) || 0, tax_rate: parseFloat(form.tax_rate) || 0 };
      if (editData?.id) { await api.updateLabor(editData.id, payload); } else { await api.createLabor(payload); }
      onSave(); onClose();
    } catch (err) { console.error(err); }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent>
        <DialogHeader title={editData ? 'Editar Mão de Obra' : 'Nova Mão de Obra'} onClose={onClose} />
        <DialogBody>
          <form onSubmit={handleSubmit}>
            <FormField label="Nome *">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nome do funcionário" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Função">
                <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Ex: Pedreiro" />
              </FormField>
              <FormField label="Diária (R$)">
                <Input type="number" step="0.01" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: e.target.value })} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Telefone">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
              </FormField>
              <FormField label="Impostos (%)">
                <Input type="number" step="0.01" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Formas de Pagamento">
              <div className="flex gap-2">
                <Input value={newMethod} onChange={(e) => setNewMethod(e.target.value)} placeholder="PIX, Dinheiro..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMethod(); } }} />
                <Button type="button" variant="secondary" size="sm" onClick={addMethod}><Plus size={14} /></Button>
              </div>
              {form.payment_methods.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.payment_methods.map((m, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs">
                      {m} <button type="button" onClick={() => setForm({ ...form, payment_methods: form.payment_methods.filter((_, j) => j !== i) })} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              )}
            </FormField>
            <Button type="submit" className="w-full mt-2">{editData ? 'Salvar Alterações' : 'Salvar Mão de Obra'}</Button>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== MATERIAL MODAL ==================== */
function MaterialModal({ isOpen, onClose, onSave, editData }: {
  isOpen: boolean; onClose: () => void; onSave: () => void; editData: any;
}) {
  const [form, setForm] = useState({ name: '', unit: 'un', category: '' });

  useEffect(() => {
    if (editData) { setForm({ name: editData.name || '', unit: editData.unit || 'un', category: editData.category || '' }); }
    else { setForm({ name: '', unit: 'un', category: '' }); }
  }, [editData, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editData?.id) { await api.updateMaterial(editData.id, form); } else { await api.createMaterial(form); }
      onSave(); onClose();
    } catch (err) { console.error(err); }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent>
        <DialogHeader title={editData ? 'Editar Material' : 'Novo Material'} onClose={onClose} />
        <DialogBody>
          <form onSubmit={handleSubmit}>
            <FormField label="Nome *">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nome do material" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Unidade">
                <select className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  {['un', 'kg', 'm', 'm²', 'm³', 'L', 'sc'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </FormField>
              <FormField label="Categoria">
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Estrutural" />
              </FormField>
            </div>
            <Button type="submit" className="w-full mt-2">{editData ? 'Salvar Alterações' : 'Salvar Material'}</Button>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== EMPTY STATE ==================== */
function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <tr>
      <td colSpan={99}>
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <div className="text-4xl mb-3 opacity-40">{icon}</div>
          <p className="text-sm">{text}</p>
        </div>
      </td>
    </tr>
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

  const [supplierModal, setSupplierModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [laborModal, setLaborModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [materialModal, setMaterialModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: string; id: any; name: string }>({ open: false, type: '', id: null, name: '' });

  const loadData = useCallback(async () => {
    try {
      const [s, l, m, p] = await Promise.all([api.getSuppliers(), api.getLabor(), api.getMaterials(), api.getPrices()]);
      setSuppliers(s); setLabor(l); setMaterials(m); setPrices(p);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async () => {
    const { type, id } = deleteConfirm;
    try {
      if (type === 'supplier') await api.deleteSupplier(id);
      else if (type === 'labor') await api.deleteLabor(id);
      else if (type === 'material') await api.deleteMaterial(id);
      loadData();
    } catch (err) { console.error(err); }
    setDeleteConfirm({ open: false, type: '', id: null, name: '' });
  };

  const filteredPrices = filterMaterial ? prices.filter((p) => String(p.material_id) === filterMaterial) : prices;

  const thClass = 'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/50 border-b border-slate-800';
  const tdClass = 'px-4 py-3 text-sm text-slate-200 border-b border-slate-800/60';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Principal</h1>
        <p className="text-sm text-slate-500 mt-1">Gerencie fornecedores, materiais e mão de obra</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Fornecedores', value: suppliers.length, icon: <Users size={18} />, color: 'text-blue-400' },
          { label: 'Materiais', value: materials.length, icon: <Layers size={18} />, color: 'text-emerald-400' },
          { label: 'Mão de Obra', value: labor.length, icon: <Package size={18} />, color: 'text-purple-400' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-4 py-4">
            <div className={`${s.color} p-2 rounded-lg bg-slate-800`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <Card className="py-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setSupplierModal({ open: true, data: null })}><Plus size={14} /> Fornecedor</Button>
            <Button size="sm" onClick={() => setLaborModal({ open: true, data: null })}><Plus size={14} /> Mão de Obra</Button>
            <Button size="sm" variant="secondary" onClick={() => setMaterialModal({ open: true, data: null })}><Plus size={14} /> Material</Button>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <select
              className="h-9 rounded-md border border-slate-700 bg-slate-900/60 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
            >
              <option value="">Todos Materiais</option>
              {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Qtd:</span>
              <Input className="w-20" type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} />
            </div>
          </div>
        </div>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fornecedores</CardTitle>
            <Badge variant="secondary">{suppliers.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full">
              <thead><tr>
                {['Nome', 'Categoria', 'Contato', 'Telefone', 'Pagamento', 'Impostos', ''].map(h => <th key={h} className={thClass}>{h}</th>)}
              </tr></thead>
              <tbody>
                {suppliers.length === 0 ? <EmptyState icon="📦" text="Nenhum fornecedor cadastrado" /> : suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className={`${tdClass} font-medium text-slate-100`}>{s.name}</td>
                    <td className={tdClass}>{s.category ? <Badge variant="secondary">{s.category}</Badge> : <span className="text-slate-600">—</span>}</td>
                    <td className={tdClass}>{s.contact || <span className="text-slate-600">—</span>}</td>
                    <td className={tdClass}>{s.phone || <span className="text-slate-600">—</span>}</td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-1">
                        {(s.payment_methods || []).map((m: string, i: number) => (
                          <span key={i} className="inline-flex px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-xs border border-slate-700">{m}</span>
                        ))}
                      </div>
                    </td>
                    <td className={tdClass}>{s.taxRate || s.tax_rate || 0}%</td>
                    <td className={`${tdClass} text-right`}>
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => setSupplierModal({ open: true, data: s })}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ open: true, type: 'supplier', id: s.id, name: s.name })} className="hover:text-red-400"><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Prices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Preços por Material</CardTitle>
            <Badge variant="secondary">{filteredPrices.length} preços</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full">
              <thead><tr>
                {['Fornecedor', 'Material', 'Preço Unit.', 'Impostos', `Total (${quantity}x)`].map(h => <th key={h} className={thClass}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredPrices.length === 0 ? <EmptyState icon="💰" text="Nenhum preço cadastrado" /> : filteredPrices.map((p) => {
                  const taxAmt = p.price * (p.tax_rate || p.taxRate || 0) / 100;
                  const total = (p.price + taxAmt) * quantity;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className={`${tdClass} font-medium text-slate-100`}>{p.supplier_name}</td>
                      <td className={tdClass}>{p.material_name} <span className="text-slate-500">({p.unit})</span></td>
                      <td className={tdClass}>{formatCurrency(p.price)}</td>
                      <td className={tdClass}>{p.tax_rate || p.taxRate || 0}%</td>
                      <td className={`${tdClass} font-bold text-emerald-400`}>{formatCurrency(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Materiais</CardTitle>
            <Badge variant="secondary">{materials.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full">
              <thead><tr>
                {['Nome', 'Unidade', 'Categoria', 'Fornecedores', ''].map(h => <th key={h} className={thClass}>{h}</th>)}
              </tr></thead>
              <tbody>
                {materials.length === 0 ? <EmptyState icon="🧱" text="Nenhum material cadastrado" /> : materials.map((m) => {
                  const matPrices = prices.filter((p) => p.material_id === m.id);
                  const expanded = expandedMaterial === m.id;
                  return (
                    <React.Fragment key={m.id}>
                      <tr className="hover:bg-slate-800/40 transition-colors group">
                        <td className={`${tdClass} font-medium text-slate-100`}>{m.name}</td>
                        <td className={tdClass}><Badge variant="outline">{m.unit}</Badge></td>
                        <td className={tdClass}>{m.category ? <Badge variant="secondary">{m.category}</Badge> : <span className="text-slate-600">—</span>}</td>
                        <td className={tdClass}>
                          <Button variant="ghost" size="sm" onClick={() => setExpandedMaterial(expanded ? null : m.id)} className="text-xs gap-1">
                            {matPrices.length} fornecedor(es) {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </Button>
                        </td>
                        <td className={`${tdClass} text-right`}>
                          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => setMaterialModal({ open: true, data: m })}><Pencil size={14} /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ open: true, type: 'material', id: m.id, name: m.name })} className="hover:text-red-400"><Trash2 size={14} /></Button>
                          </div>
                        </td>
                      </tr>
                      {expanded && matPrices.length > 0 && (
                        <tr key={`exp-${m.id}`}>
                          <td colSpan={5} className="px-6 pb-3 bg-slate-800/20">
                            <div className="rounded-lg border border-slate-700/60 overflow-hidden">
                              {matPrices.map((p) => (
                                <div key={p.id} className="flex justify-between items-center px-4 py-2.5 border-b border-slate-700/40 last:border-0 text-sm">
                                  <span className="text-slate-300">{p.supplier_name}</span>
                                  <span className="font-bold text-emerald-400">{formatCurrency(p.price)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Labor Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mão de Obra</CardTitle>
            <Badge variant="secondary">{labor.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full">
              <thead><tr>
                {['Nome', 'Função', 'Telefone', 'Pagamento', 'Diária', 'Impostos', ''].map(h => <th key={h} className={thClass}>{h}</th>)}
              </tr></thead>
              <tbody>
                {labor.length === 0 ? <EmptyState icon="👷" text="Nenhuma mão de obra cadastrada" /> : labor.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className={`${tdClass} font-medium text-slate-100`}>{l.name}</td>
                    <td className={tdClass}>{l.role ? <Badge variant="secondary">{l.role}</Badge> : <span className="text-slate-600">—</span>}</td>
                    <td className={tdClass}>{l.phone || <span className="text-slate-600">—</span>}</td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-1">
                        {(l.payment_methods || []).map((m: string, i: number) => (
                          <span key={i} className="inline-flex px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-xs border border-slate-700">{m}</span>
                        ))}
                      </div>
                    </td>
                    <td className={`${tdClass} font-bold text-emerald-400`}>{formatCurrency(l.daily_rate || l.dailyRate)}</td>
                    <td className={tdClass}>{l.tax_rate || l.taxRate || 0}%</td>
                    <td className={`${tdClass} text-right`}>
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => setLaborModal({ open: true, data: l })}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ open: true, type: 'labor', id: l.id, name: l.name })} className="hover:text-red-400"><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <SupplierModal isOpen={supplierModal.open} onClose={() => setSupplierModal({ open: false, data: null })} onSave={loadData} materials={materials} editData={supplierModal.data} />
      <LaborModal isOpen={laborModal.open} onClose={() => setLaborModal({ open: false, data: null })} onSave={loadData} editData={laborModal.data} />
      <MaterialModal isOpen={materialModal.open} onClose={() => setMaterialModal({ open: false, data: null })} onSave={loadData} editData={materialModal.data} />
      <ConfirmDialog open={deleteConfirm.open} title={`Excluir ${deleteConfirm.name}?`} message="Esta ação não pode ser desfeita." onConfirm={handleDelete} onCancel={() => setDeleteConfirm({ open: false, type: '', id: null, name: '' })} />
    </div>
  );
}

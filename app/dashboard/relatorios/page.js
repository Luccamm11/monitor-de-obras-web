'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, formatCurrency, formatDate } from '@/lib/api';

export default function RelatoriosPage() {
  const [filter, setFilter] = useState('');
  const [report, setReport] = useState({ total: 0, totalTax: 0, byCategory: [], bySupplier: [], byLabor: [], byWork: [] });
  const [csvData, setCsvData] = useState([]);
  const [showCSV, setShowCSV] = useState(false);

  const loadReport = useCallback(async () => {
    try {
      const data = await api.getReports(filter);
      setReport(data);
    } catch (err) {
      console.error(err);
    }
  }, [filter]);

  const loadCSVPreview = useCallback(async () => {
    try {
      const transactions = await api.getTransactions({ filter });
      setCsvData(transactions);
    } catch (err) {
      console.error(err);
    }
  }, [filter]);

  useEffect(() => { loadReport(); }, [loadReport]);

  useEffect(() => {
    if (showCSV) loadCSVPreview();
  }, [showCSV, loadCSVPreview]);

  const exportCSV = () => {
    window.location.href = api.getReportCSV(filter);
  };

  const FILTERS = [
    { value: '', label: 'Tudo' },
    { value: '24h', label: '24h' },
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
    { value: 'year', label: '1 Ano' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Relatórios</h1>
        <p className="page-subtitle">Visão geral de gastos e análises</p>
      </div>

      {/* Filters */}
      <div className="topbar">
        <div className="filter-bar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-btn ${filter === f.value ? 'active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setShowCSV(!showCSV)}>
            {showCSV ? '📊 Ocultar Tabela' : '📋 Ver Tabela'}
          </button>
          <button className="btn" onClick={exportCSV}>📥 Exportar CSV</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-3">
        <div className="card glass">
          <p className="stat-label">Total Gasto</p>
          <p className="stat-value">{formatCurrency(report.total)}</p>
        </div>
        <div className="card glass">
          <p className="stat-label">Total Impostos</p>
          <p className="stat-value" style={{ background: 'linear-gradient(135deg, var(--warning), #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {formatCurrency(report.totalTax)}
          </p>
        </div>
        <div className="card glass">
          <p className="stat-label">Valor Total c/ Impostos</p>
          <p className="stat-value" style={{ background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {formatCurrency(report.total + report.totalTax)}
          </p>
        </div>
      </div>

      {/* CSV Preview */}
      {showCSV && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📋 Dados do Relatório</h2>
            <span className="tag">{csvData.length} registros</span>
          </div>
          <div className="csv-preview">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Categoria</th>
                  <th>Impostos</th>
                  <th>Fornecedor</th>
                  <th>Mão de Obra</th>
                  <th>Obra</th>
                </tr>
              </thead>
              <tbody>
                {csvData.length === 0 ? (
                  <tr><td colSpan="8"><div className="empty-state"><div className="empty-state-text">Nenhum dado para o período selecionado</div></div></td></tr>
                ) : (
                  csvData.map((t) => (
                    <tr key={t.id}>
                      <td>{formatDate(t.date)}</td>
                      <td>{t.description}</td>
                      <td className="font-bold text-danger">{formatCurrency(t.amount)}</td>
                      <td>{t.category || '-'}</td>
                      <td>{formatCurrency(t.tax_amount)}</td>
                      <td>{t.supplier_name || '-'}</td>
                      <td>{t.labor_name || '-'}</td>
                      <td>{t.work_name || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* By Category */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Gastos por Categoria</h2>
          </div>
          <table>
            <thead><tr><th>Categoria</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
            <tbody>
              {report.byCategory.length === 0 ? (
                <tr><td colSpan="2" className="text-center text-muted" style={{ padding: '1.5rem' }}>Sem dados</td></tr>
              ) : (
                report.byCategory.map((c, i) => (
                  <tr key={i}>
                    <td className="font-medium">{c.category}</td>
                    <td className="text-right font-bold">{formatCurrency(c.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Gastos por Fornecedor</h2>
          </div>
          <table>
            <thead><tr><th>Fornecedor</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
            <tbody>
              {report.bySupplier.length === 0 ? (
                <tr><td colSpan="2" className="text-center text-muted" style={{ padding: '1.5rem' }}>Sem dados</td></tr>
              ) : (
                report.bySupplier.map((s, i) => (
                  <tr key={i}>
                    <td className="font-medium">{s.name}</td>
                    <td className="text-right font-bold">{formatCurrency(s.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Gastos com Mão de Obra</h2>
          </div>
          <table>
            <thead><tr><th>Trabalhador</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
            <tbody>
              {report.byLabor.length === 0 ? (
                <tr><td colSpan="2" className="text-center text-muted" style={{ padding: '1.5rem' }}>Sem dados</td></tr>
              ) : (
                report.byLabor.map((l, i) => (
                  <tr key={i}>
                    <td className="font-medium">{l.name}</td>
                    <td className="text-right font-bold">{formatCurrency(l.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Gastos por Obra</h2>
          </div>
          <table>
            <thead><tr><th>Obra</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
            <tbody>
              {(report.byWork || []).length === 0 ? (
                <tr><td colSpan="2" className="text-center text-muted" style={{ padding: '1.5rem' }}>Sem dados</td></tr>
              ) : (
                report.byWork.map((w, i) => (
                  <tr key={i}>
                    <td className="font-medium">{w.name}</td>
                    <td className="text-right font-bold">{formatCurrency(w.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

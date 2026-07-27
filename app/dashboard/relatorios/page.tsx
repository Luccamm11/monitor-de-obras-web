'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, formatCurrency, formatDate } from '@/lib/api';

type CategoryAggregation = { category: string; total: number };
type NamedAggregation = { name: string; total: number };

type ReportSummary = {
  total: number;
  totalTax: number;
  byCategory: CategoryAggregation[];
  bySupplier: NamedAggregation[];
  byLabor: NamedAggregation[];
  byWork: NamedAggregation[];
};

export default function RelatoriosPage() {
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState('');
  const [reportSummary, setReportSummary] = useState<ReportSummary>({
    total: 0,
    totalTax: 0,
    byCategory: [],
    bySupplier: [],
    byLabor: [],
    byWork: [],
  });
  const [csvPreviewRows, setCsvPreviewRows] = useState<any[]>([]);
  const [showCSVTable, setShowCSVTable] = useState(false);

  const loadReportData = useCallback(async () => {
    try {
      const summaryData = await api.getReports(selectedPeriodFilter);
      setReportSummary(summaryData);
    } catch (reportError) {
      console.error(reportError);
    }
  }, [selectedPeriodFilter]);

  const loadCSVPreviewData = useCallback(async () => {
    try {
      const fetchedTransactions = await api.getTransactions({ filter: selectedPeriodFilter });
      setCsvPreviewRows(fetchedTransactions);
    } catch (previewError) {
      console.error(previewError);
    }
  }, [selectedPeriodFilter]);

  useEffect(() => { loadReportData(); }, [loadReportData]);

  useEffect(() => {
    if (showCSVTable) loadCSVPreviewData();
  }, [showCSVTable, loadCSVPreviewData]);

  const handleExportCSV = () => {
    window.location.href = api.getReportCSV(selectedPeriodFilter);
  };

  const PERIOD_FILTER_OPTIONS = [
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
          {PERIOD_FILTER_OPTIONS.map((filterOption) => (
            <button
              key={filterOption.value}
              className={`filter-btn ${selectedPeriodFilter === filterOption.value ? 'active' : ''}`}
              onClick={() => setSelectedPeriodFilter(filterOption.value)}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setShowCSVTable(!showCSVTable)}>
            {showCSVTable ? '📊 Ocultar Tabela' : '📋 Ver Tabela'}
          </button>
          <button className="btn" onClick={handleExportCSV}>📥 Exportar CSV</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-3">
        <div className="card glass">
          <p className="stat-label">Total Gasto</p>
          <p className="stat-value">{formatCurrency(reportSummary.total)}</p>
        </div>
        <div className="card glass">
          <p className="stat-label">Total Impostos</p>
          <p className="stat-value" style={{ background: 'linear-gradient(135deg, var(--warning), #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {formatCurrency(reportSummary.totalTax)}
          </p>
        </div>
        <div className="card glass">
          <p className="stat-label">Valor Total c/ Impostos</p>
          <p className="stat-value" style={{ background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {formatCurrency(reportSummary.total + reportSummary.totalTax)}
          </p>
        </div>
      </div>

      {/* CSV Preview */}
      {showCSVTable && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📋 Dados do Relatório</h2>
            <span className="tag">{csvPreviewRows.length} registros</span>
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
                {csvPreviewRows.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-text">Nenhum dado para o período selecionado</div></div></td></tr>
                ) : (
                  csvPreviewRows.map((transactionItem) => (
                    <tr key={transactionItem.id}>
                      <td>{formatDate(transactionItem.date)}</td>
                      <td>{transactionItem.description}</td>
                      <td className="font-bold text-danger">{formatCurrency(transactionItem.amount)}</td>
                      <td>{transactionItem.category || '-'}</td>
                      <td>{formatCurrency(transactionItem.tax_amount)}</td>
                      <td>{transactionItem.supplier_name || '-'}</td>
                      <td>{transactionItem.labor_name || '-'}</td>
                      <td>{transactionItem.work_name || '-'}</td>
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
              {reportSummary.byCategory.length === 0 ? (
                <tr><td colSpan={2} className="text-center text-muted" style={{ padding: '1.5rem' }}>Sem dados</td></tr>
              ) : (
                reportSummary.byCategory.map((categorySummaryItem, itemIndex) => (
                  <tr key={itemIndex}>
                    <td className="font-medium">{categorySummaryItem.category}</td>
                    <td className="text-right font-bold">{formatCurrency(categorySummaryItem.total)}</td>
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
              {reportSummary.bySupplier.length === 0 ? (
                <tr><td colSpan={2} className="text-center text-muted" style={{ padding: '1.5rem' }}>Sem dados</td></tr>
              ) : (
                reportSummary.bySupplier.map((supplierSummaryItem, itemIndex) => (
                  <tr key={itemIndex}>
                    <td className="font-medium">{supplierSummaryItem.name}</td>
                    <td className="text-right font-bold">{formatCurrency(supplierSummaryItem.total)}</td>
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
              {reportSummary.byLabor.length === 0 ? (
                <tr><td colSpan={2} className="text-center text-muted" style={{ padding: '1.5rem' }}>Sem dados</td></tr>
              ) : (
                reportSummary.byLabor.map((laborSummaryItem, itemIndex) => (
                  <tr key={itemIndex}>
                    <td className="font-medium">{laborSummaryItem.name}</td>
                    <td className="text-right font-bold">{formatCurrency(laborSummaryItem.total)}</td>
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
              {(reportSummary.byWork || []).length === 0 ? (
                <tr><td colSpan={2} className="text-center text-muted" style={{ padding: '1.5rem' }}>Sem dados</td></tr>
              ) : (
                reportSummary.byWork.map((workSummaryItem, itemIndex) => (
                  <tr key={itemIndex}>
                    <td className="font-medium">{workSummaryItem.name}</td>
                    <td className="text-right font-bold">{formatCurrency(workSummaryItem.total)}</td>
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

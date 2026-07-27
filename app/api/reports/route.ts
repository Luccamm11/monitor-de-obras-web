import { db, createResponse, errorResponse } from '@/lib/server';
import { transactions, suppliers, labor, works } from '@/lib/db/schema';
import { type SQL, eq, gte, and } from 'drizzle-orm';

type ReportTx = {
  id: number;
  amount: number;
  taxAmount: number | null;
  category: string | null;
  supplierName: string | null;
  laborName: string | null;
  workName: string | null;
};

type AggregatedEntry = { category: string; total: number };
type NamedEntry = { name: string; total: number };

function getDateFilter(periodFilter: string | null): string | null {
  if (!periodFilter) return null;
  const now = new Date();
  const periodMap: Record<string, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90, 'year': 365 };
  const days = periodMap[periodFilter];
  if (!days) return null;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function aggregateByKey(rows: ReportTx[], key: keyof ReportTx): NamedEntry[] {
  const acc: Record<string, number> = {};
  rows.forEach((row) => {
    const k = (row[key] as string | null);
    if (k) acc[k] = (acc[k] || 0) + (row.amount || 0);
  });
  return Object.entries(acc).map(([name, total]) => ({ name, total }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodFilter = searchParams.get('filter');
    const dateFrom = getDateFilter(periodFilter);

    const clauses: SQL<unknown>[] = [eq(transactions.type, 'EXPENSE')];
    if (dateFrom) clauses.push(gte(transactions.date, dateFrom));

    const reportTxs: ReportTx[] = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        taxAmount: transactions.taxAmount,
        category: transactions.category,
        supplierName: suppliers.name,
        laborName: labor.name,
        workName: works.name,
      })
      .from(transactions)
      .leftJoin(suppliers, eq(transactions.supplierId, suppliers.id))
      .leftJoin(labor, eq(transactions.laborId, labor.id))
      .leftJoin(works, eq(transactions.workId, works.id))
      .where(and(...clauses));

    const totalExpenses = reportTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const totalTaxes = reportTxs.reduce((sum, tx) => sum + (tx.taxAmount || 0), 0);

    const catMap: Record<string, number> = {};
    reportTxs.forEach((tx) => {
      const catKey = tx.category || 'Sem categoria';
      catMap[catKey] = (catMap[catKey] || 0) + (tx.amount || 0);
    });
    const byCategory: AggregatedEntry[] = Object.entries(catMap).map(([category, total]) => ({ category, total }));

    const bySupplier: NamedEntry[] = aggregateByKey(reportTxs, 'supplierName');
    const byLabor: NamedEntry[] = aggregateByKey(reportTxs, 'laborName');
    const byWork: NamedEntry[] = aggregateByKey(reportTxs, 'workName');

    return createResponse({ total: totalExpenses, totalTax: totalTaxes, byCategory, bySupplier, byLabor, byWork });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

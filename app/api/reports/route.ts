import { db, createResponse, errorResponse } from '@/lib/server';
import { transactions, suppliers, labor, works } from '@/lib/db/schema';
import { eq, gte, and } from 'drizzle-orm';

function getDateFilter(filter: string | null): string | null {
  if (!filter) return null;
  const now = new Date();
  const map: Record<string, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90, 'year': 365 };
  const days = map[filter];
  if (!days) return null;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const dateFrom = getDateFilter(filter);

    const conditions = [eq(transactions.type, 'EXPENSE')];
    if (dateFrom) {
      conditions.push(gte(transactions.date, dateFrom));
    }

    const txList = await db
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
      .where(and(...conditions));

    const total = txList.reduce((s, t) => s + (t.amount || 0), 0);
    const totalTax = txList.reduce((s, t) => s + (t.taxAmount || 0), 0);

    const catMap: Record<string, number> = {};
    txList.forEach((t) => {
      const key = t.category || 'Sem categoria';
      catMap[key] = (catMap[key] || 0) + (t.amount || 0);
    });
    const byCategory = Object.entries(catMap).map(([category, total]) => ({ category, total }));

    const supMap: Record<string, number> = {};
    txList.forEach((t) => {
      if (t.supplierName) {
        supMap[t.supplierName] = (supMap[t.supplierName] || 0) + (t.amount || 0);
      }
    });
    const bySupplier = Object.entries(supMap).map(([name, total]) => ({ name, total }));

    const labMap: Record<string, number> = {};
    txList.forEach((t) => {
      if (t.laborName) {
        labMap[t.laborName] = (labMap[t.laborName] || 0) + (t.amount || 0);
      }
    });
    const byLabor = Object.entries(labMap).map(([name, total]) => ({ name, total }));

    const workMap: Record<string, number> = {};
    txList.forEach((t) => {
      if (t.workName) {
        workMap[t.workName] = (workMap[t.workName] || 0) + (t.amount || 0);
      }
    });
    const byWork = Object.entries(workMap).map(([name, total]) => ({ name, total }));

    return createResponse({ total, totalTax, byCategory, bySupplier, byLabor, byWork });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

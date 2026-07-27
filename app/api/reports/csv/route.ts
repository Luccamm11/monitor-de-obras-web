import { db, errorResponse } from '@/lib/server';
import { transactions, suppliers, labor, works } from '@/lib/db/schema';
import { desc, eq, gte, and } from 'drizzle-orm';

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
        date: transactions.date,
        description: transactions.description,
        amount: transactions.amount,
        category: transactions.category,
        taxAmount: transactions.taxAmount,
        supplierName: suppliers.name,
        laborName: labor.name,
        workName: works.name,
      })
      .from(transactions)
      .leftJoin(suppliers, eq(transactions.supplierId, suppliers.id))
      .leftJoin(labor, eq(transactions.laborId, labor.id))
      .leftJoin(works, eq(transactions.workId, works.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.date));

    let csv = 'Data,Descrição,Valor,Categoria,Impostos,Fornecedor,Mão de Obra,Obra\n';
    txList.forEach((t) => {
      const row = [
        t.date || '',
        (t.description || '').replace(/,/g, ';'),
        t.amount || 0,
        (t.category || '').replace(/,/g, ';'),
        t.taxAmount || 0,
        (t.supplierName || '').replace(/,/g, ';'),
        (t.laborName || '').replace(/,/g, ';'),
        (t.workName || '').replace(/,/g, ';'),
      ];
      csv += row.join(',') + '\n';
    });

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=relatorio.csv',
      },
    });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

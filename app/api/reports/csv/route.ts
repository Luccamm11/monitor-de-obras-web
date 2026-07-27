import { db, errorResponse } from '@/lib/server';
import { transactions, suppliers, labor, works } from '@/lib/db/schema';
import { type SQL, desc, eq, gte, and } from 'drizzle-orm';

type CsvRow = {
  date: string | null;
  description: string;
  amount: number;
  category: string | null;
  taxAmount: number | null;
  supplierName: string | null;
  laborName: string | null;
  workName: string | null;
};

function getDateFilter(periodFilter: string | null): string | null {
  if (!periodFilter) return null;
  const now = new Date();
  const periodMap: Record<string, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90, 'year': 365 };
  const days = periodMap[periodFilter];
  if (!days) return null;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodFilter = searchParams.get('filter');
    const dateFrom = getDateFilter(periodFilter);

    const clauses: SQL<unknown>[] = [eq(transactions.type, 'EXPENSE')];
    if (dateFrom) clauses.push(gte(transactions.date, dateFrom));

    const csvRows: CsvRow[] = await db
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
      .where(and(...clauses))
      .orderBy(desc(transactions.date));

    let csv = 'Data,Descrição,Valor,Categoria,Impostos,Fornecedor,Mão de Obra,Obra\n';
    csvRows.forEach((row) => {
      const line = [
        row.date || '',
        (row.description || '').replace(/,/g, ';'),
        row.amount || 0,
        (row.category || '').replace(/,/g, ';'),
        row.taxAmount || 0,
        (row.supplierName || '').replace(/,/g, ';'),
        (row.laborName || '').replace(/,/g, ';'),
        (row.workName || '').replace(/,/g, ';'),
      ];
      csv += line.join(',') + '\n';
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

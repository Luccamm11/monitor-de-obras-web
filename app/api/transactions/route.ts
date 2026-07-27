import { db, createResponse, errorResponse } from '@/lib/server';
import { transactions, suppliers, labor, works } from '@/lib/db/schema';
import { transactionSchema } from '@/lib/schemas';
import { desc, eq, gte, and } from 'drizzle-orm';

function getDateFilter(filter: string | null): string | null {
  if (!filter) return null;
  const now = new Date();
  const map: Record<string, number> = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    'year': 365,
  };
  const days = map[filter];
  if (!days) return null;
  const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const workId = searchParams.get('work_id');

    const dateFrom = getDateFilter(filter);

    const conditions = [];
    if (dateFrom) {
      conditions.push(gte(transactions.date, dateFrom));
    }
    if (workId) {
      conditions.push(eq(transactions.workId, parseInt(workId, 10)));
    }

    const query = db
      .select({
        id: transactions.id,
        description: transactions.description,
        amount: transactions.amount,
        type: transactions.type,
        category: transactions.category,
        supplier_id: transactions.supplierId,
        labor_id: transactions.laborId,
        work_id: transactions.workId,
        tax_amount: transactions.taxAmount,
        date: transactions.date,
        created_at: transactions.createdAt,
        supplier_name: suppliers.name,
        labor_name: labor.name,
        work_name: works.name,
      })
      .from(transactions)
      .leftJoin(suppliers, eq(transactions.supplierId, suppliers.id))
      .leftJoin(labor, eq(transactions.laborId, labor.id))
      .leftJoin(works, eq(transactions.workId, works.id))
      .orderBy(desc(transactions.date));

    const data = conditions.length ? await query.where(and(...conditions)) : await query;

    return createResponse(data);
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    transactionSchema.parse({
      description: body.description,
      amount: parseFloat(body.amount) || 0,
      type: body.type || 'EXPENSE',
      category: body.category,
      supplierId: body.supplier_id ? parseInt(body.supplier_id) : null,
      laborId: body.labor_id ? parseInt(body.labor_id) : null,
      workId: body.work_id ? parseInt(body.work_id) : null,
    });

    const [inserted] = await db
      .insert(transactions)
      .values({
        description: body.description,
        amount: body.amount,
        type: body.type || 'EXPENSE',
        category: body.category || null,
        supplierId: body.supplier_id ? parseInt(body.supplier_id) : null,
        laborId: body.labor_id ? parseInt(body.labor_id) : null,
        workId: body.work_id ? parseInt(body.work_id) : null,
        taxAmount: body.tax_amount || 0,
        date: body.date || new Date().toISOString(),
      })
      .returning();

    return createResponse({ id: inserted.id });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

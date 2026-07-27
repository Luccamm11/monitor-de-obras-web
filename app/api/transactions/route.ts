import { db, createResponse, errorResponse } from '@/lib/server';
import { transactions, suppliers, labor, works } from '@/lib/db/schema';
import { transactionSchema } from '@/lib/schemas';
import { type SQL, desc, eq, gte, and } from 'drizzle-orm';

function calculateDateCutoff(datePeriodFilter: string | null): string | null {
  if (!datePeriodFilter) return null;
  const nowTimestamp = new Date();
  const periodDaysMap: Record<string, number> = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    'year': 365,
  };
  const daysOffset = periodDaysMap[datePeriodFilter];
  if (!daysOffset) return null;
  const calculatedDate = new Date(nowTimestamp.getTime() - daysOffset * 24 * 60 * 60 * 1000);
  return calculatedDate.toISOString();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const datePeriodFilter = searchParams.get('filter');
    const filterWorkId = searchParams.get('work_id');

    const dateCutoffIso = calculateDateCutoff(datePeriodFilter);

    const filterConditions: SQL<unknown>[] = [];
    if (dateCutoffIso) {
      filterConditions.push(gte(transactions.date, dateCutoffIso));
    }
    if (filterWorkId) {
      filterConditions.push(eq(transactions.workId, parseInt(filterWorkId, 10)));
    }

    const transactionQuery = db
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

    const retrievedTransactions = filterConditions.length
      ? await transactionQuery.where(and(...filterConditions))
      : await transactionQuery;

    return createResponse(retrievedTransactions);
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();

    transactionSchema.parse({
      description: requestBody.description,
      amount: parseFloat(requestBody.amount) || 0,
      type: requestBody.type || 'EXPENSE',
      category: requestBody.category,
      supplierId: requestBody.supplier_id ? parseInt(requestBody.supplier_id, 10) : null,
      laborId: requestBody.labor_id ? parseInt(requestBody.labor_id, 10) : null,
      workId: requestBody.work_id ? parseInt(requestBody.work_id, 10) : null,
    });

    const [createdTransaction] = await db
      .insert(transactions)
      .values({
        description: requestBody.description,
        amount: requestBody.amount,
        type: requestBody.type || 'EXPENSE',
        category: requestBody.category || null,
        supplierId: requestBody.supplier_id ? parseInt(requestBody.supplier_id, 10) : null,
        laborId: requestBody.labor_id ? parseInt(requestBody.labor_id, 10) : null,
        workId: requestBody.work_id ? parseInt(requestBody.work_id, 10) : null,
        taxAmount: requestBody.tax_amount || 0,
        date: requestBody.date || new Date().toISOString(),
      })
      .returning();

    return createResponse({ id: createdTransaction.id });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

import { db, createResponse, errorResponse } from '@/lib/server';
import { works, transactions } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const targetWorkId = parseInt(id, 10);

    const [foundWork] = await db.select().from(works).where(eq(works.id, targetWorkId));
    if (!foundWork) return errorResponse('Work not found', 404);

    const [expenseSummary] = await db
      .select({
        totalCost: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(and(eq(transactions.workId, foundWork.id), eq(transactions.type, 'EXPENSE')));

    return createResponse({
      ...foundWork,
      total_cost: Number(expenseSummary?.totalCost || 0),
    });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const targetWorkId = parseInt(id, 10);
    const requestBody = await request.json();

    await db
      .update(works)
      .set({
        name: requestBody.name,
        address: requestBody.address || null,
        startDate: requestBody.start_date || null,
        endDate: requestBody.end_date || null,
        budget: requestBody.budget || 0,
        status: requestBody.status || 'ACTIVE',
      })
      .where(eq(works.id, targetWorkId));

    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const targetWorkId = parseInt(id, 10);

    await db.update(transactions).set({ workId: null }).where(eq(transactions.workId, targetWorkId));
    await db.delete(works).where(eq(works.id, targetWorkId));

    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

import { db, createResponse, errorResponse } from '@/lib/server';
import { works, transactions } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);

    const [work] = await db.select().from(works).where(eq(works.id, numId));
    if (!work) return errorResponse('Work not found', 404);

    const [sumRes] = await db
      .select({
        totalCost: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(and(eq(transactions.workId, work.id), eq(transactions.type, 'EXPENSE')));

    return createResponse({
      ...work,
      total_cost: Number(sumRes?.totalCost || 0),
    });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    const body = await request.json();

    await db
      .update(works)
      .set({
        name: body.name,
        address: body.address || null,
        startDate: body.start_date || null,
        endDate: body.end_date || null,
        budget: body.budget || 0,
        status: body.status || 'ACTIVE',
      })
      .where(eq(works.id, numId));

    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);

    await db.update(transactions).set({ workId: null }).where(eq(transactions.workId, numId));
    await db.delete(works).where(eq(works.id, numId));

    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

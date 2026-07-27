import { db, createResponse, errorResponse } from '@/lib/server';
import { transactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    const body = await request.json();

    await db
      .update(transactions)
      .set({
        description: body.description,
        amount: body.amount,
        type: body.type || 'EXPENSE',
        category: body.category || null,
        supplierId: body.supplier_id ? parseInt(body.supplier_id) : null,
        laborId: body.labor_id ? parseInt(body.labor_id) : null,
        workId: body.work_id ? parseInt(body.work_id) : null,
        taxAmount: body.tax_amount || 0,
        date: body.date,
      })
      .where(eq(transactions.id, numId));

    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);

    await db.delete(transactions).where(eq(transactions.id, numId));

    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

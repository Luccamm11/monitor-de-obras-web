import { db, createResponse, errorResponse } from '@/lib/server';
import { transactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const targetTransactionId = parseInt(id, 10);
    const requestBody = await request.json();

    await db
      .update(transactions)
      .set({
        description: requestBody.description,
        amount: requestBody.amount,
        type: requestBody.type || 'EXPENSE',
        category: requestBody.category || null,
        supplierId: requestBody.supplier_id ? parseInt(requestBody.supplier_id, 10) : null,
        laborId: requestBody.labor_id ? parseInt(requestBody.labor_id, 10) : null,
        workId: requestBody.work_id ? parseInt(requestBody.work_id, 10) : null,
        taxAmount: requestBody.tax_amount || 0,
        date: requestBody.date,
      })
      .where(eq(transactions.id, targetTransactionId));

    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const targetTransactionId = parseInt(id, 10);

    await db.delete(transactions).where(eq(transactions.id, targetTransactionId));

    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

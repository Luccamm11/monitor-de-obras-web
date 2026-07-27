import { db, createResponse, errorResponse } from '@/lib/server';
import { labor, paymentMethods } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const laborId = parseInt(id, 10);
    const requestBody = await request.json();
    const { name, role, daily_rate, phone, tax_rate, payment_methods } = requestBody;

    await db
      .update(labor)
      .set({ name, role, dailyRate: daily_rate, phone, taxRate: tax_rate || 0 })
      .where(eq(labor.id, laborId));

    await db.delete(paymentMethods).where(eq(paymentMethods.laborId, laborId));

    if (payment_methods?.length) {
      await db.insert(paymentMethods).values(
        payment_methods.map((paymentMethod: string) => ({
          laborId,
          method: paymentMethod,
        }))
      );
    }

    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const laborId = parseInt(id, 10);

    await db.delete(paymentMethods).where(eq(paymentMethods.laborId, laborId));
    await db.delete(labor).where(eq(labor.id, laborId));

    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

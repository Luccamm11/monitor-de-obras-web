import { db, createResponse, errorResponse } from '@/lib/server';
import { suppliers, paymentMethods, supplierMaterialPrices } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const targetSupplierId = parseInt(id, 10);
    const requestBody = await request.json();
    const { name, contact, phone, category, tax_rate, payment_methods } = requestBody;

    await db
      .update(suppliers)
      .set({ name, contact, phone, category, taxRate: tax_rate || 0 })
      .where(eq(suppliers.id, targetSupplierId));

    await db.delete(paymentMethods).where(eq(paymentMethods.supplierId, targetSupplierId));

    if (payment_methods?.length) {
      await db.insert(paymentMethods).values(
        payment_methods.map((methodName: string) => ({ supplierId: targetSupplierId, method: methodName }))
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
    const targetSupplierId = parseInt(id, 10);

    await db.delete(paymentMethods).where(eq(paymentMethods.supplierId, targetSupplierId));
    await db.delete(supplierMaterialPrices).where(eq(supplierMaterialPrices.supplierId, targetSupplierId));
    await db.delete(suppliers).where(eq(suppliers.id, targetSupplierId));

    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

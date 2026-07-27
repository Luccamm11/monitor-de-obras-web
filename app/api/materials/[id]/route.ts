import { db, createResponse, errorResponse } from '@/lib/server';
import { materials, supplierMaterialPrices } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const targetMaterialId = parseInt(id, 10);
    const requestBody = await request.json();

    await db
      .update(materials)
      .set({ name: requestBody.name, unit: requestBody.unit, category: requestBody.category })
      .where(eq(materials.id, targetMaterialId));

    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const targetMaterialId = parseInt(id, 10);

    await db.delete(supplierMaterialPrices).where(eq(supplierMaterialPrices.materialId, targetMaterialId));
    await db.delete(materials).where(eq(materials.id, targetMaterialId));

    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

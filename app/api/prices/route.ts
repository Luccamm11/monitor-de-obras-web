import { db, createResponse, errorResponse } from '@/lib/server';
import { supplierMaterialPrices, suppliers, materials } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get('material_id');

    const query = db
      .select({
        id: supplierMaterialPrices.id,
        supplier_id: supplierMaterialPrices.supplierId,
        material_id: supplierMaterialPrices.materialId,
        price: supplierMaterialPrices.price,
        supplier_name: suppliers.name,
        tax_rate: suppliers.taxRate,
        material_name: materials.name,
        unit: materials.unit,
        last_updated: supplierMaterialPrices.lastUpdated,
      })
      .from(supplierMaterialPrices)
      .leftJoin(suppliers, eq(supplierMaterialPrices.supplierId, suppliers.id))
      .leftJoin(materials, eq(supplierMaterialPrices.materialId, materials.id));

    const data = materialId
      ? await query.where(eq(supplierMaterialPrices.materialId, parseInt(materialId, 10)))
      : await query;

    return createResponse(data);
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { supplier_id, material_id, price } = body;

    const [inserted] = await db
      .insert(supplierMaterialPrices)
      .values({
        supplierId: parseInt(supplier_id, 10),
        materialId: parseInt(material_id, 10),
        price: parseFloat(price) || 0,
        lastUpdated: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [supplierMaterialPrices.supplierId, supplierMaterialPrices.materialId],
        set: {
          price: parseFloat(price) || 0,
          lastUpdated: new Date().toISOString(),
        },
      })
      .returning();

    return createResponse({ id: inserted.id });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

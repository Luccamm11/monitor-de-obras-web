import { db, createResponse, errorResponse } from '@/lib/server';
import { suppliers, paymentMethods, supplierMaterialPrices } from '@/lib/db/schema';
import { supplierSchema } from '@/lib/schemas';
import { asc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const list = await db.select().from(suppliers).orderBy(asc(suppliers.name));

    const result = await Promise.all(
      list.map(async (s) => {
        const methods = await db
          .select({ method: paymentMethods.method })
          .from(paymentMethods)
          .where(eq(paymentMethods.supplierId, s.id));

        return {
          ...s,
          payment_methods: methods.map((m) => m.method),
        };
      })
    );

    return createResponse(result);
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, contact, phone, category, tax_rate, payment_methods, materials: materialPrices } = body;

    supplierSchema.parse({ name, contact, phone, category, taxRate: parseFloat(tax_rate) || 0 });

    const [supplier] = await db
      .insert(suppliers)
      .values({ name, contact, phone, category, taxRate: tax_rate || 0 })
      .returning();

    if (payment_methods?.length) {
      await db.insert(paymentMethods).values(
        payment_methods.map((method: string) => ({ supplierId: supplier.id, method }))
      );
    }

    if (materialPrices?.length) {
      for (const mat of materialPrices) {
        if (mat.price > 0) {
          await db.insert(supplierMaterialPrices).values({
            supplierId: supplier.id,
            materialId: mat.id,
            price: mat.price,
          }).onConflictDoUpdate({
            target: [supplierMaterialPrices.supplierId, supplierMaterialPrices.materialId],
            set: { price: mat.price, lastUpdated: new Date().toISOString() },
          });
        }
      }
    }

    return createResponse({ id: supplier.id });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

import { db, createResponse, errorResponse } from '@/lib/server';
import { suppliers, paymentMethods, supplierMaterialPrices } from '@/lib/db/schema';
import { supplierSchema } from '@/lib/schemas';
import { asc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const supplierList = await db.select().from(suppliers).orderBy(asc(suppliers.name));

    const suppliersWithPayments = await Promise.all(
      supplierList.map(async (supplierEntry) => {
        const supplierPaymentMethods = await db
          .select({ method: paymentMethods.method })
          .from(paymentMethods)
          .where(eq(paymentMethods.supplierId, supplierEntry.id));

        return {
          ...supplierEntry,
          payment_methods: supplierPaymentMethods.map((pm) => pm.method),
        };
      })
    );

    return createResponse(suppliersWithPayments);
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    const {
      name,
      contact,
      phone,
      category,
      tax_rate,
      payment_methods,
      materials: materialPrices,
    } = requestBody;

    supplierSchema.parse({ name, contact, phone, category, taxRate: parseFloat(tax_rate) || 0 });

    const [newSupplier] = await db
      .insert(suppliers)
      .values({ name, contact, phone, category, taxRate: tax_rate || 0 })
      .returning();

    if (payment_methods?.length) {
      await db.insert(paymentMethods).values(
        payment_methods.map((paymentMethod: string) => ({
          supplierId: newSupplier.id,
          method: paymentMethod,
        }))
      );
    }

    if (materialPrices?.length) {
      for (const materialPrice of materialPrices) {
        if (materialPrice.price > 0) {
          await db.insert(supplierMaterialPrices).values({
            supplierId: newSupplier.id,
            materialId: materialPrice.id,
            price: materialPrice.price,
          }).onConflictDoUpdate({
            target: [supplierMaterialPrices.supplierId, supplierMaterialPrices.materialId],
            set: { price: materialPrice.price, lastUpdated: new Date().toISOString() },
          });
        }
      }
    }

    return createResponse({ id: newSupplier.id });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

import { db, createResponse, errorResponse } from '@/lib/server';
import { labor, paymentMethods } from '@/lib/db/schema';
import { laborSchema } from '@/lib/schemas';
import { asc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const laborList = await db.select().from(labor).orderBy(asc(labor.name));

    const laborWithPayments = await Promise.all(
      laborList.map(async (laborEntry) => {
        const laborPaymentMethods = await db
          .select({ method: paymentMethods.method })
          .from(paymentMethods)
          .where(eq(paymentMethods.laborId, laborEntry.id));

        return {
          ...laborEntry,
          payment_methods: laborPaymentMethods.map((pm) => pm.method),
        };
      })
    );

    return createResponse(laborWithPayments);
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    const { name, role, daily_rate, phone, tax_rate, payment_methods } = requestBody;

    laborSchema.parse({
      name,
      role,
      dailyRate: parseFloat(daily_rate) || 0,
      phone,
      taxRate: parseFloat(tax_rate) || 0,
    });

    const [newLabor] = await db
      .insert(labor)
      .values({ name, role, dailyRate: daily_rate, phone, taxRate: tax_rate || 0 })
      .returning();

    if (payment_methods?.length) {
      await db.insert(paymentMethods).values(
        payment_methods.map((paymentMethod: string) => ({
          laborId: newLabor.id,
          method: paymentMethod,
        }))
      );
    }

    return createResponse({ id: newLabor.id });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

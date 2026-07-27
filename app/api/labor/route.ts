import { db, createResponse, errorResponse } from '@/lib/server';
import { labor, paymentMethods } from '@/lib/db/schema';
import { laborSchema } from '@/lib/schemas';
import { asc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const list = await db.select().from(labor).orderBy(asc(labor.name));

    const result = await Promise.all(
      list.map(async (l) => {
        const methods = await db
          .select({ method: paymentMethods.method })
          .from(paymentMethods)
          .where(eq(paymentMethods.laborId, l.id));

        return {
          ...l,
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
    const { name, role, daily_rate, phone, tax_rate, payment_methods } = body;

    laborSchema.parse({ name, role, dailyRate: parseFloat(daily_rate) || 0, phone, taxRate: parseFloat(tax_rate) || 0 });

    const [inserted] = await db
      .insert(labor)
      .values({ name, role, dailyRate: daily_rate, phone, taxRate: tax_rate || 0 })
      .returning();

    if (payment_methods?.length) {
      await db.insert(paymentMethods).values(
        payment_methods.map((method: string) => ({ laborId: inserted.id, method }))
      );
    }

    return createResponse({ id: inserted.id });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

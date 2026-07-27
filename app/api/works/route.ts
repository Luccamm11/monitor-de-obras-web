import { db, createResponse, errorResponse } from '@/lib/server';
import { works, transactions } from '@/lib/db/schema';
import { workSchema } from '@/lib/schemas';
import { desc, eq, and, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const list = await db.select().from(works).orderBy(desc(works.createdAt));

    const result = await Promise.all(
      list.map(async (w) => {
        const [sumRes] = await db
          .select({
            totalCost: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
          })
          .from(transactions)
          .where(and(eq(transactions.workId, w.id), eq(transactions.type, 'EXPENSE')));

        return {
          ...w,
          total_cost: Number(sumRes?.totalCost || 0),
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
    workSchema.parse({ name: body.name, address: body.address, status: body.status, budget: parseFloat(body.budget) || 0 });

    const [inserted] = await db
      .insert(works)
      .values({
        name: body.name,
        address: body.address || null,
        startDate: body.start_date || null,
        endDate: body.end_date || null,
        budget: body.budget || 0,
        status: body.status || 'ACTIVE',
      })
      .returning();

    return createResponse({ id: inserted.id });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

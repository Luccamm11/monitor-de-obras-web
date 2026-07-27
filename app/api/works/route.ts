import { db, createResponse, errorResponse } from '@/lib/server';
import { works, transactions } from '@/lib/db/schema';
import { workSchema } from '@/lib/schemas';
import { desc, eq, and, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const activeWorksList = await db.select().from(works).orderBy(desc(works.createdAt));

    const worksWithCalculatedCost = await Promise.all(
      activeWorksList.map(async (workEntry) => {
        const [expenseSummary] = await db
          .select({
            totalCost: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
          })
          .from(transactions)
          .where(and(eq(transactions.workId, workEntry.id), eq(transactions.type, 'EXPENSE')));

        return {
          ...workEntry,
          total_cost: Number(expenseSummary?.totalCost || 0),
        };
      })
    );

    return createResponse(worksWithCalculatedCost);
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    workSchema.parse({
      name: requestBody.name,
      address: requestBody.address,
      status: requestBody.status,
      budget: parseFloat(requestBody.budget) || 0,
    });

    const [createdWork] = await db
      .insert(works)
      .values({
        name: requestBody.name,
        address: requestBody.address || null,
        startDate: requestBody.start_date || null,
        endDate: requestBody.end_date || null,
        budget: requestBody.budget || 0,
        status: requestBody.status || 'ACTIVE',
      })
      .returning();

    return createResponse({ id: createdWork.id });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

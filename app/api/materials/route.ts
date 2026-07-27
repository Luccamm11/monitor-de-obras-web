import { db, createResponse, errorResponse } from '@/lib/server';
import { materials } from '@/lib/db/schema';
import { materialSchema } from '@/lib/schemas';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const data = await db.select().from(materials).orderBy(asc(materials.name));
    return createResponse(data);
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    materialSchema.parse({ name: body.name, unit: body.unit, category: body.category });

    const [inserted] = await db
      .insert(materials)
      .values({ name: body.name, unit: body.unit, category: body.category })
      .returning();

    return createResponse({ id: inserted.id });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

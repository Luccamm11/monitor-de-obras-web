import { db, createResponse, errorResponse } from '@/lib/server';
import { materials } from '@/lib/db/schema';
import { materialSchema } from '@/lib/schemas';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const materialCatalog = await db.select().from(materials).orderBy(asc(materials.name));
    return createResponse(materialCatalog);
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    materialSchema.parse({ name: requestBody.name, unit: requestBody.unit, category: requestBody.category });

    const [insertedMaterial] = await db
      .insert(materials)
      .values({ name: requestBody.name, unit: requestBody.unit, category: requestBody.category })
      .returning();

    return createResponse({ id: insertedMaterial.id });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

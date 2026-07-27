import { supabase, createResponse, errorResponse } from '@/lib/server';
import { materialSchema } from '@/lib/schemas';

export async function GET() {
  try {
    if (!supabase) return errorResponse('Supabase não configurado');
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');
    if (error) throw error;
    return createResponse(data);
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function POST(request: Request) {
  try {
    if (!supabase) return errorResponse('Supabase não configurado');
    const body = await request.json();
    materialSchema.parse({ name: body.name, unit: body.unit, category: body.category });

    const { data, error } = await supabase
      .from('materials')
      .insert({ name: body.name, unit: body.unit, category: body.category })
      .select()
      .single();
    if (error) throw error;
    return createResponse({ id: data.id });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

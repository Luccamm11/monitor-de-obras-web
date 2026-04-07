import { supabase, createResponse, errorResponse } from '@/lib/server';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');
    if (error) throw error;
    return createResponse(data);
  } catch (err) {
    return errorResponse(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('materials')
      .insert({ name: body.name, unit: body.unit, category: body.category })
      .select()
      .single();
    if (error) throw error;
    return createResponse({ id: data.id });
  } catch (err) {
    return errorResponse(err.message);
  }
}

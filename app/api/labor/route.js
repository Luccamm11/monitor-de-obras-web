import { supabase, createResponse, errorResponse } from '@/lib/server';

export async function GET() {
  try {
    const { data: labor, error } = await supabase.from('labor').select('*').order('name');
    if (error) throw error;

    for (const l of labor) {
      const { data: methods } = await supabase
        .from('payment_methods')
        .select('method')
        .eq('labor_id', l.id);
      l.payment_methods = (methods || []).map(m => m.method);
    }

    return createResponse(labor);
  } catch (err) {
    return errorResponse(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, role, daily_rate, phone, tax_rate, payment_methods } = body;

    const { data, error } = await supabase
      .from('labor')
      .insert({ name, role, daily_rate, phone, tax_rate: tax_rate || 0 })
      .select()
      .single();

    if (error) throw error;

    if (payment_methods?.length) {
      await supabase.from('payment_methods').insert(
        payment_methods.map(method => ({ labor_id: data.id, method }))
      );
    }

    return createResponse({ id: data.id });
  } catch (err) {
    return errorResponse(err.message);
  }
}

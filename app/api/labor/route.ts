import { supabase, createResponse, errorResponse } from '@/lib/server';
import { laborSchema } from '@/lib/schemas';

export async function GET() {
  try {
    if (!supabase) return errorResponse('Supabase não configurado');
    const { data: labor, error } = await supabase.from('labor').select('*').order('name');
    if (error) throw error;

    for (const l of labor) {
      const { data: methods } = await supabase
        .from('payment_methods')
        .select('method')
        .eq('labor_id', l.id);
      l.payment_methods = (methods || []).map((m: any) => m.method);
    }

    return createResponse(labor);
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function POST(request: Request) {
  try {
    if (!supabase) return errorResponse('Supabase não configurado');
    const body = await request.json();
    const { name, role, daily_rate, phone, tax_rate, payment_methods } = body;

    laborSchema.parse({ name, role, dailyRate: parseFloat(daily_rate) || 0, phone, taxRate: parseFloat(tax_rate) || 0 });

    const { data, error } = await supabase
      .from('labor')
      .insert({ name, role, daily_rate, phone, tax_rate: tax_rate || 0 })
      .select()
      .single();

    if (error) throw error;

    if (payment_methods?.length) {
      await supabase.from('payment_methods').insert(
        payment_methods.map((method: string) => ({ labor_id: data.id, method }))
      );
    }

    return createResponse({ id: data.id });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

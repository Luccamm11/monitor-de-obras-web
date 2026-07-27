import { supabase, createResponse, errorResponse } from '@/lib/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!supabase) return errorResponse('Supabase não configurado');
    const { id } = await params;
    const numId = parseInt(id, 10);
    const body = await request.json();
    const { name, role, daily_rate, phone, tax_rate, payment_methods } = body;

    const { error } = await supabase
      .from('labor')
      .update({ name, role, daily_rate, phone, tax_rate: tax_rate || 0 })
      .eq('id', numId);

    if (error) throw error;

    await supabase.from('payment_methods').delete().eq('labor_id', numId);
    if (payment_methods?.length) {
      await supabase.from('payment_methods').insert(
        payment_methods.map((method: string) => ({ labor_id: numId, method }))
      );
    }

    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!supabase) return errorResponse('Supabase não configurado');
    const { id } = await params;
    const numId = parseInt(id, 10);
    await supabase.from('payment_methods').delete().eq('labor_id', numId);
    const { error } = await supabase.from('labor').delete().eq('id', numId);
    if (error) throw error;
    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

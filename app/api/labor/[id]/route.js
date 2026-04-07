import { supabase, createResponse, errorResponse } from '@/lib/server';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, role, daily_rate, phone, tax_rate, payment_methods } = body;

    const { error } = await supabase
      .from('labor')
      .update({ name, role, daily_rate, phone, tax_rate: tax_rate || 0 })
      .eq('id', id);

    if (error) throw error;

    await supabase.from('payment_methods').delete().eq('labor_id', id);
    if (payment_methods?.length) {
      await supabase.from('payment_methods').insert(
        payment_methods.map(method => ({ labor_id: parseInt(id), method }))
      );
    }

    return createResponse({ success: true });
  } catch (err) {
    return errorResponse(err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await supabase.from('payment_methods').delete().eq('labor_id', id);
    const { error } = await supabase.from('labor').delete().eq('id', id);
    if (error) throw error;
    return createResponse({ success: true });
  } catch (err) {
    return errorResponse(err.message);
  }
}

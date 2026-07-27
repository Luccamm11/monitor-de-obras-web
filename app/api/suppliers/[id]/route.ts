import { supabase, createResponse, errorResponse } from '@/lib/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!supabase) return errorResponse('Supabase não configurado');
    const { id } = await params;
    const body = await request.json();
    const { name, contact, phone, category, tax_rate, payment_methods } = body;

    const { error } = await supabase
      .from('suppliers')
      .update({ name, contact, phone, category, tax_rate: tax_rate || 0 })
      .eq('id', id);

    if (error) throw error;

    await supabase.from('payment_methods').delete().eq('supplier_id', id);
    if (payment_methods?.length) {
      await supabase.from('payment_methods').insert(
        payment_methods.map((method: string) => ({ supplier_id: parseInt(id), method }))
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
    await supabase.from('payment_methods').delete().eq('supplier_id', id);
    await supabase.from('supplier_material_prices').delete().eq('supplier_id', id);
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

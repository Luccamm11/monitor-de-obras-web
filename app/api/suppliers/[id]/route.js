import { supabase, createResponse, errorResponse } from '@/lib/server';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, contact, phone, category, tax_rate, payment_methods } = body;

    const { error } = await supabase
      .from('suppliers')
      .update({ name, contact, phone, category, tax_rate: tax_rate || 0 })
      .eq('id', id);

    if (error) throw error;

    // Rebuild payment methods
    await supabase.from('payment_methods').delete().eq('supplier_id', id);
    if (payment_methods?.length) {
      await supabase.from('payment_methods').insert(
        payment_methods.map(method => ({ supplier_id: parseInt(id), method }))
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
    await supabase.from('payment_methods').delete().eq('supplier_id', id);
    await supabase.from('supplier_material_prices').delete().eq('supplier_id', id);
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
    return createResponse({ success: true });
  } catch (err) {
    return errorResponse(err.message);
  }
}

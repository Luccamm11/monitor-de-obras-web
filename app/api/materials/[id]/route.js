import { supabase, createResponse, errorResponse } from '@/lib/server';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { error } = await supabase
      .from('materials')
      .update({ name: body.name, unit: body.unit, category: body.category })
      .eq('id', id);
    if (error) throw error;
    return createResponse({ success: true });
  } catch (err) {
    return errorResponse(err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await supabase.from('supplier_material_prices').delete().eq('material_id', id);
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) throw error;
    return createResponse({ success: true });
  } catch (err) {
    return errorResponse(err.message);
  }
}

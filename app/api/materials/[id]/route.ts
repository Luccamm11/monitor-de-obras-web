import { supabase, createResponse, errorResponse } from '@/lib/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!supabase) return errorResponse('Supabase não configurado');
    const { id } = await params;
    const numId = parseInt(id, 10);
    const body = await request.json();
    const { error } = await supabase
      .from('materials')
      .update({ name: body.name, unit: body.unit, category: body.category })
      .eq('id', numId);
    if (error) throw error;
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
    await supabase.from('supplier_material_prices').delete().eq('material_id', numId);
    const { error } = await supabase.from('materials').delete().eq('id', numId);
    if (error) throw error;
    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

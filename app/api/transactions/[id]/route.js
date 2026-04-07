import { supabase, createResponse, errorResponse } from '@/lib/server';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { error } = await supabase
      .from('transactions')
      .update({
        description: body.description,
        amount: body.amount,
        type: body.type || 'EXPENSE',
        category: body.category || null,
        supplier_id: body.supplier_id || null,
        labor_id: body.labor_id || null,
        work_id: body.work_id || null,
        tax_amount: body.tax_amount || 0,
        date: body.date,
      })
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
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
    return createResponse({ success: true });
  } catch (err) {
    return errorResponse(err.message);
  }
}

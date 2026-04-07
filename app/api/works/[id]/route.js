import { supabase, createResponse, errorResponse } from '@/lib/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { data: work, error } = await supabase.from('works').select('*').eq('id', id).single();
    if (error) throw error;
    if (!work) return errorResponse('Work not found', 404);

    const { data: txData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('work_id', work.id)
      .eq('type', 'EXPENSE');
    work.total_cost = (txData || []).reduce((sum, t) => sum + (t.amount || 0), 0);

    return createResponse(work);
  } catch (err) {
    return errorResponse(err.message);
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { error } = await supabase
      .from('works')
      .update({
        name: body.name,
        address: body.address || null,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        budget: body.budget || 0,
        status: body.status || 'ACTIVE',
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
    await supabase.from('transactions').update({ work_id: null }).eq('work_id', id);
    const { error } = await supabase.from('works').delete().eq('id', id);
    if (error) throw error;
    return createResponse({ success: true });
  } catch (err) {
    return errorResponse(err.message);
  }
}

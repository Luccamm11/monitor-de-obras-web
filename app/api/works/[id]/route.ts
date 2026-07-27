import { supabase, createResponse, errorResponse } from '@/lib/server';
import type { Database } from '@/lib/database.types';

type WorkRow = Database['public']['Tables']['works']['Row'] & {
  total_cost?: number;
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!supabase) return errorResponse('Supabase não configurado');
    const { id } = await params;
    const numId = parseInt(id, 10);
    const { data: work, error } = await supabase.from('works').select('*').eq('id', numId).single();
    if (error) throw error;
    if (!work) return errorResponse('Work not found', 404);

    const enriched: WorkRow = { ...work };

    const { data: txData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('work_id', work.id)
      .eq('type', 'EXPENSE');
    enriched.total_cost = (txData || []).reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    return createResponse(enriched);
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!supabase) return errorResponse('Supabase não configurado');
    const { id } = await params;
    const numId = parseInt(id, 10);
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
    await supabase.from('transactions').update({ work_id: null }).eq('work_id', numId);
    const { error } = await supabase.from('works').delete().eq('id', numId);
    if (error) throw error;
    return createResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

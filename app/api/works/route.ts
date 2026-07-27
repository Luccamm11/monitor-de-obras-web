import { supabase, createResponse, errorResponse } from '@/lib/server';
import { workSchema } from '@/lib/schemas';

export async function GET() {
  try {
    if (!supabase) return errorResponse('Supabase não configurado');
    const { data: works, error } = await supabase
      .from('works')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    for (const work of works) {
      const { data: txData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('work_id', work.id)
        .eq('type', 'EXPENSE');
      work.total_cost = (txData || []).reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    }

    return createResponse(works);
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function POST(request: Request) {
  try {
    if (!supabase) return errorResponse('Supabase não configurado');
    const body = await request.json();
    workSchema.parse({ name: body.name, address: body.address, status: body.status, budget: parseFloat(body.budget) || 0 });

    const { data, error } = await supabase
      .from('works')
      .insert({
        name: body.name,
        address: body.address || null,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        budget: body.budget || 0,
        status: body.status || 'ACTIVE',
      })
      .select()
      .single();

    if (error) throw error;
    return createResponse({ id: data.id });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

import { supabase, createResponse, errorResponse } from '@/lib/server';
import { transactionSchema } from '@/lib/schemas';

function getDateFilter(filter: string | null): string | null {
  if (!filter) return null;
  const now = new Date();
  const map: Record<string, number> = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    'year': 365,
  };
  const days = map[filter];
  if (!days) return null;
  const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

export async function GET(request: Request) {
  try {
    if (!supabase) return errorResponse('Supabase não configurado');
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const workId = searchParams.get('work_id');

    let query = supabase
      .from('transactions')
      .select(`
        *,
        suppliers ( name ),
        labor ( name ),
        works ( name )
      `)
      .order('date', { ascending: false });

    const dateFrom = getDateFilter(filter);
    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }
    if (workId) {
      query = query.eq('work_id', workId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formatted = (data || []).map((t: any) => ({
      ...t,
      supplier_name: t.suppliers?.name || null,
      labor_name: t.labor?.name || null,
      work_name: t.works?.name || null,
      suppliers: undefined,
      labor: undefined,
      works: undefined,
    }));

    return createResponse(formatted);
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function POST(request: Request) {
  try {
    if (!supabase) return errorResponse('Supabase não configurado');
    const body = await request.json();

    transactionSchema.parse({
      description: body.description,
      amount: parseFloat(body.amount) || 0,
      type: body.type || 'EXPENSE',
      category: body.category,
      supplierId: body.supplier_id ? parseInt(body.supplier_id) : null,
      laborId: body.labor_id ? parseInt(body.labor_id) : null,
      workId: body.work_id ? parseInt(body.work_id) : null,
    });

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        description: body.description,
        amount: body.amount,
        type: body.type || 'EXPENSE',
        category: body.category || null,
        supplier_id: body.supplier_id || null,
        labor_id: body.labor_id || null,
        work_id: body.work_id || null,
        tax_amount: body.tax_amount || 0,
        date: body.date || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return createResponse({ id: data.id });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

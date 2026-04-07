import { supabase, errorResponse } from '@/lib/server';

function getDateFilter(filter) {
  if (!filter) return null;
  const now = new Date();
  const map = { '24h': 1, '7d': 7, '30d': 30, '90d': 90, 'year': 365 };
  const days = map[filter];
  if (!days) return null;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const dateFrom = getDateFilter(filter);

    let query = supabase.from('transactions').select(`
      *, suppliers ( name ), labor ( name ), works ( name )
    `).eq('type', 'EXPENSE').order('date', { ascending: false });

    if (dateFrom) query = query.gte('date', dateFrom);

    const { data: transactions, error } = await query;
    if (error) throw error;

    let csv = 'Data,Descrição,Valor,Categoria,Impostos,Fornecedor,Mão de Obra,Obra\n';
    (transactions || []).forEach(t => {
      const row = [
        t.date || '',
        (t.description || '').replace(/,/g, ';'),
        t.amount || 0,
        (t.category || '').replace(/,/g, ';'),
        t.tax_amount || 0,
        (t.suppliers?.name || '').replace(/,/g, ';'),
        (t.labor?.name || '').replace(/,/g, ';'),
        (t.works?.name || '').replace(/,/g, ';'),
      ];
      csv += row.join(',') + '\n';
    });

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=relatorio.csv',
      },
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}

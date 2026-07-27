import { supabase, createResponse, errorResponse } from '@/lib/server';

function getDateFilter(filter: string | null): string | null {
  if (!filter) return null;
  const now = new Date();
  const map: Record<string, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90, 'year': 365 };
  const days = map[filter];
  if (!days) return null;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function GET(request: Request) {
  try {
    if (!supabase) return errorResponse('Supabase não configurado');
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const dateFrom = getDateFilter(filter);

    let query = supabase.from('transactions').select(`
      *, suppliers ( name ), labor ( name ), works ( name )
    `).eq('type', 'EXPENSE');

    if (dateFrom) query = query.gte('date', dateFrom);

    const { data: transactions, error } = await query;
    if (error) throw error;

    const total = (transactions || []).reduce((s: number, t: any) => s + (t.amount || 0), 0);
    const totalTax = (transactions || []).reduce((s: number, t: any) => s + (t.tax_amount || 0), 0);

    const catMap: Record<string, number> = {};
    (transactions || []).forEach((t: any) => {
      const key = t.category || 'Sem categoria';
      catMap[key] = (catMap[key] || 0) + (t.amount || 0);
    });
    const byCategory = Object.entries(catMap).map(([category, total]) => ({ category, total }));

    const supMap: Record<string, number> = {};
    (transactions || []).forEach((t: any) => {
      if (t.suppliers?.name) {
        const key = t.suppliers.name;
        supMap[key] = (supMap[key] || 0) + (t.amount || 0);
      }
    });
    const bySupplier = Object.entries(supMap).map(([name, total]) => ({ name, total }));

    const labMap: Record<string, number> = {};
    (transactions || []).forEach((t: any) => {
      if (t.labor?.name) {
        const key = t.labor.name;
        labMap[key] = (labMap[key] || 0) + (t.amount || 0);
      }
    });
    const byLabor = Object.entries(labMap).map(([name, total]) => ({ name, total }));

    const workMap: Record<string, number> = {};
    (transactions || []).forEach((t: any) => {
      if (t.works?.name) {
        const key = t.works.name;
        workMap[key] = (workMap[key] || 0) + (t.amount || 0);
      }
    });
    const byWork = Object.entries(workMap).map(([name, total]) => ({ name, total }));

    return createResponse({ total, totalTax, byCategory, bySupplier, byLabor, byWork });
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

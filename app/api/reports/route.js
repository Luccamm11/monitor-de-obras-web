import { supabase, createResponse, errorResponse } from '@/lib/server';

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
    `).eq('type', 'EXPENSE');

    if (dateFrom) query = query.gte('date', dateFrom);

    const { data: transactions, error } = await query;
    if (error) throw error;

    const total = transactions.reduce((s, t) => s + (t.amount || 0), 0);
    const totalTax = transactions.reduce((s, t) => s + (t.tax_amount || 0), 0);

    // Group by category
    const catMap = {};
    transactions.forEach(t => {
      const key = t.category || 'Sem categoria';
      catMap[key] = (catMap[key] || 0) + (t.amount || 0);
    });
    const byCategory = Object.entries(catMap).map(([category, total]) => ({ category, total }));

    // Group by supplier
    const supMap = {};
    transactions.forEach(t => {
      if (t.suppliers?.name) {
        const key = t.suppliers.name;
        supMap[key] = (supMap[key] || 0) + (t.amount || 0);
      }
    });
    const bySupplier = Object.entries(supMap).map(([name, total]) => ({ name, total }));

    // Group by labor
    const labMap = {};
    transactions.forEach(t => {
      if (t.labor?.name) {
        const key = t.labor.name;
        labMap[key] = (labMap[key] || 0) + (t.amount || 0);
      }
    });
    const byLabor = Object.entries(labMap).map(([name, total]) => ({ name, total }));

    // Group by work
    const workMap = {};
    transactions.forEach(t => {
      if (t.works?.name) {
        const key = t.works.name;
        workMap[key] = (workMap[key] || 0) + (t.amount || 0);
      }
    });
    const byWork = Object.entries(workMap).map(([name, total]) => ({ name, total }));

    return createResponse({ total, totalTax, byCategory, bySupplier, byLabor, byWork });
  } catch (err) {
    return errorResponse(err.message);
  }
}

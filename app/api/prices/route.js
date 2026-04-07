import { supabase, createResponse, errorResponse } from '@/lib/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get('material_id');

    let query = supabase
      .from('supplier_material_prices')
      .select(`
        *,
        suppliers ( name, tax_rate ),
        materials ( name, unit )
      `);

    if (materialId) {
      query = query.eq('material_id', materialId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formatted = (data || []).map(p => ({
      id: p.id,
      supplier_id: p.supplier_id,
      material_id: p.material_id,
      price: p.price,
      supplier_name: p.suppliers?.name,
      tax_rate: p.suppliers?.tax_rate || 0,
      material_name: p.materials?.name,
      unit: p.materials?.unit,
      last_updated: p.last_updated,
    }));

    return createResponse(formatted);
  } catch (err) {
    return errorResponse(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { supplier_id, material_id, price } = body;

    const { data, error } = await supabase
      .from('supplier_material_prices')
      .upsert(
        { supplier_id, material_id, price, last_updated: new Date().toISOString() },
        { onConflict: 'supplier_id,material_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return createResponse({ id: data.id });
  } catch (err) {
    return errorResponse(err.message);
  }
}

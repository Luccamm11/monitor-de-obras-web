import { supabase, createResponse, errorResponse } from '@/lib/server';

export async function GET() {
  try {
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) throw error;

    // Get payment methods for each supplier
    for (const s of suppliers) {
      const { data: methods } = await supabase
        .from('payment_methods')
        .select('method')
        .eq('supplier_id', s.id);
      s.payment_methods = (methods || []).map(m => m.method);
    }

    return createResponse(suppliers);
  } catch (err) {
    return errorResponse(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, contact, phone, category, tax_rate, payment_methods, materials: materialPrices } = body;

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert({ name, contact, phone, category, tax_rate: tax_rate || 0 })
      .select()
      .single();

    if (error) throw error;

    if (payment_methods?.length) {
      await supabase.from('payment_methods').insert(
        payment_methods.map(method => ({ supplier_id: supplier.id, method }))
      );
    }

    if (materialPrices?.length) {
      for (const mat of materialPrices) {
        if (mat.price > 0) {
          await supabase.from('supplier_material_prices').upsert({
            supplier_id: supplier.id,
            material_id: mat.id,
            price: mat.price,
          }, { onConflict: 'supplier_id,material_id' });
        }
      }
    }

    return createResponse({ id: supplier.id });
  } catch (err) {
    return errorResponse(err.message);
  }
}

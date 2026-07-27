import { supabase, createResponse, errorResponse } from '@/lib/server';
import { supplierSchema } from '@/lib/schemas';
import type { Database } from '@/lib/database.types';

type SupplierRow = Database['public']['Tables']['suppliers']['Row'] & {
  payment_methods?: string[];
};

export async function GET() {
  try {
    if (!supabase) return errorResponse('Supabase não configurado');
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) throw error;

    const result: SupplierRow[] = suppliers as SupplierRow[];

    for (const s of result) {
      const { data: methods } = await supabase
        .from('payment_methods')
        .select('method')
        .eq('supplier_id', s.id);
      s.payment_methods = (methods || []).map((m) => m.method);
    }

    return createResponse(result);
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

export async function POST(request: Request) {
  try {
    if (!supabase) return errorResponse('Supabase não configurado');
    const body = await request.json();
    const { name, contact, phone, category, tax_rate, payment_methods, materials: materialPrices } = body;

    supplierSchema.parse({ name, contact, phone, category, taxRate: parseFloat(tax_rate) || 0 });

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert({ name, contact, phone, category, tax_rate: tax_rate || 0 })
      .select()
      .single();

    if (error) throw error;

    if (payment_methods?.length) {
      await supabase.from('payment_methods').insert(
        payment_methods.map((method: string) => ({ supplier_id: supplier.id, method }))
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
  } catch (err: any) {
    return errorResponse(err.message);
  }
}

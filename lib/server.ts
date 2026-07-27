import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';

export function createResponse(data: any, status = 200) {
  return Response.json(data, { status });
}

export function errorResponse(message: string, status = 500) {
  return Response.json({ error: message }, { status });
}

export { supabase, db };

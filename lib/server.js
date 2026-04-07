import { supabase } from '@/lib/supabase';

export function createResponse(data, status = 200) {
  return Response.json(data, { status });
}

export function errorResponse(message, status = 500) {
  return Response.json({ error: message }, { status });
}

export { supabase };

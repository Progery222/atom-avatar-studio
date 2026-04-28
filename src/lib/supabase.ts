import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  return createClient(supabaseUrl, supabaseKey);
}

let _supabase: ReturnType<typeof getSupabaseClient> | null = null;

export function getSupabase() {
  if (!_supabase) {
    _supabase = getSupabaseClient();
  }
  return _supabase;
}

/**
 * Загружает файл в Supabase Storage и возвращает публичный URL.
 * URL должен быть доступен внешним API (KIE.ai)
 */
export async function uploadFileToSupabase(bucket: string, path: string, file: File | Blob) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const client = getSupabase();

  const { data, error } = await client.storage
    .from(bucket)
    .upload(path, file, { upsert: true });

  if (error) {
    throw new Error(`Upload fail: ${error.message}`);
  }

  // Construct public URL directly - assumes bucket is public
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  
  console.log('[Supabase] Uploaded to:', publicUrl);
  
  return publicUrl;
}

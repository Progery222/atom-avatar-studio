import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required. Check Railway Dashboard Variables.');
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
  console.error('[Supabase] Starting upload. URL:', supabaseUrl, 'Bucket:', bucket, 'Path:', path, 'Size:', file.size);
  
  const client = getSupabase();

  try {
    const { data, error } = await client.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) {
      console.error('[Supabase] Upload error object:', JSON.stringify(error));
      throw new Error(`Upload fail: ${error.message} (status: ${error.status || 'unknown'})`);
    }

    // Construct public URL directly - assumes bucket is public
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
    
    console.error('[Supabase] Uploaded to:', publicUrl);
    
    return publicUrl;
  } catch (err: any) {
    console.error('[Supabase] Upload exception:', err?.message || err);
    throw err;
  }
}

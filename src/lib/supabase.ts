import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Загружает файл в Supabase Storage и возвращает публичный URL.
 * URL должен быть доступен внешним API (KIE.ai)
 */
export async function uploadFileToSupabase(bucket: string, path: string, file: File | Blob) {
  // Use service role key for server-side uploads if available
  const supabaseAdmin = supabaseKey !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
    ? supabase 
    : supabase;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, { upsert: true });

  if (error) {
    throw new Error(`Upload fail: ${error.message}`);
  }

  // Construct public URL directly - assumes bucket is public
  // Format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  
  console.log('[Supabase] Uploaded to:', publicUrl);
  
  return publicUrl;
}

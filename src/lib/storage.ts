import { supabase } from '@/lib/supabase'

export const COMPROBANTES_BUCKET = 'academy-comprobantes'

// El bucket es privado: cualquier archivo (comprobante de vivencial, factura de
// instructor, comprobante de pago) se muestra con una URL firmada de corta vida.
export async function signedComprobanteUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(COMPROBANTES_BUCKET).createSignedUrl(path, 120)
  if (error) return null
  return data.signedUrl
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// CORS helpers inlineados (función self-contained: sin dependencias relativas a
// ../_shared, para que el deploy vía MCP no arrastre archivos fuera de la carpeta).
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  return null
}
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// Mail de "compra de curso confirmada" (NO vivencial — ese lo manda send-reserva-email).
//
// Se dispara server-side desde confirm-course-payment y mp-webhook-academy, pero SOLO
// cuando ese llamado fue el que creó la inscripción (la señal atómica del
// UNIQUE(user_id, course_id) en academy_enrollments). Por eso el mail sale UNA sola
// vez aunque el webhook de MP y el redirect de la página de éxito corran casi a la par:
// solo uno de los dos gana el INSERT del enrollment, y solo ese llama a esta función.
//
// Como segunda red de seguridad, acá adentro solo se manda si existe un pago de curso
// en estado 'aprobado' para ese (user, course): sin compra aprobada, no hay mail.
//
// Secrets (los carga Nico en Supabase, no esta función):
//   RESEND_API_KEY → API key de Resend (ya cargado)
//   COURSE_FROM    → remitente, ej. "Travexa Academy <cursos@travexa.com.ar>"
//                    Si no está, cae a RESERVA_FROM y luego a onboarding@resend.dev.
//
// Fire-and-forget: si el mail falla responde 200 { sent:false } y no rompe nada.
// El pago y la inscripción ya están hechos; el mail es una celebración.

const ACADEMY_URL = 'https://academy.travexa.com.ar'

function fmtARS(n: number): string {
  return '$ ' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Math.round(n || 0))
}

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  try {
    const { user_id, course_id } = await req.json() as { user_id?: string; course_id?: string }
    if (!user_id || !course_id) return jsonResponse({ error: 'Faltan user_id o course_id' }, 400)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    )

    // Red de seguridad: sin pago de curso aprobado para este par (user, course) no hay
    // mail. Cuando lo llama confirm/webhook, ese pago ya fue escrito antes del enrollment,
    // así que acá siempre existe; y si alguien invoca esto de más, no manda nada.
    const { data: pago } = await supabaseAdmin
      .from('academy_payments')
      .select('monto_ars')
      .eq('user_id', user_id)
      .eq('course_id', course_id)
      .eq('tipo', 'curso')
      .eq('estado', 'aprobado')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!pago) return jsonResponse({ sent: false, reason: 'sin_pago_aprobado' }, 200)

    const { data: course } = await supabaseAdmin
      .from('academy_courses')
      .select('titulo, precio_ars')
      .eq('id', course_id)
      .maybeSingle()

    const { data: prof } = await supabaseAdmin
      .from('profiles').select('nombre, email').eq('id', user_id).maybeSingle()

    const to = prof?.email
    if (!to) return jsonResponse({ sent: false, reason: 'sin_email' }, 200)

    const apiKey = Deno.env.get('RESEND_API_KEY')
    const from = Deno.env.get('COURSE_FROM') ?? Deno.env.get('RESERVA_FROM') ?? 'Travexa Academy <onboarding@resend.dev>'
    if (!apiKey) {
      // Sin proveedor configurado: no rompemos nada.
      return jsonResponse({ sent: false, reason: 'RESEND_API_KEY no configurada' }, 200)
    }

    const monto = pago.monto_ars ?? course?.precio_ars ?? 0
    const nombre = prof?.nombre ?? '¡Hola!'
    const titulo = course?.titulo ?? 'Tu curso'

    const html = `<!doctype html><html><body style="margin:0;background:#0A1E29;font-family:Inter,Arial,sans-serif;color:#0a1e29">
      <div style="max-width:560px;margin:0 auto;padding:28px 20px">
        <div style="text-align:center;color:#F5F3EC;margin-bottom:18px">
          <div style="font-size:22px;font-weight:800">Pencom <span style="color:#4ECDB8">Travexa</span></div>
          <div style="font-size:12px;color:#8FA3AB">Travexa Academy</div>
        </div>
        <div style="background:#fff;border-radius:16px;padding:26px 24px">
          <div style="font-size:12px;color:#0E6B5C;font-weight:700">✓ ¡COMPRA CONFIRMADA!</div>
          <h1 style="font-size:20px;margin:6px 0 4px">${nombre}, ya tenés acceso a tu curso</h1>
          <p style="color:#4A6070;font-size:14px;margin:0 0 16px">${titulo}</p>
          <table style="width:100%;font-size:13px;color:#0a1e29;margin:16px 0;border-collapse:collapse">
            <tr><td style="padding:5px 0;color:#6a8590">Curso</td><td style="text-align:right;font-weight:600">${titulo}</td></tr>
            <tr><td style="padding:5px 0;color:#6a8590">Monto pagado</td><td style="text-align:right;font-weight:800">${fmtARS(monto)}</td></tr>
          </table>
          <p style="font-size:13px;color:#4A6070;line-height:1.6;margin-top:4px">
            El curso ya está disponible en tu cuenta. Entrá cuando quieras y empezá a tu ritmo.
          </p>
          <a href="${ACADEMY_URL}/mis-cursos" style="display:inline-block;margin-top:14px;background:#0E6B5C;color:#fff;text-decoration:none;padding:11px 20px;border-radius:10px;font-weight:700;font-size:14px">Empezar a aprender</a>
        </div>
        <p style="text-align:center;color:#8FA3AB;font-size:11px;margin-top:16px">Pencom Travexa SAS · Travexa Academy</p>
      </div>
    </body></html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Compra confirmada — ${titulo}`,
        html,
      }),
    })
    if (!res.ok) {
      const detail = await res.text()
      return jsonResponse({ sent: false, reason: detail }, 200)
    }
    return jsonResponse({ sent: true }, 200)
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500)
  }
})

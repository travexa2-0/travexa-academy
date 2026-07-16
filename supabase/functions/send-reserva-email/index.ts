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

// Mail de "reserva confirmada" de un vivencial (punto 4). Se dispara desde el
// cliente tras reservar; envía por Resend (API HTTP, sin SMTP).
//
// Requiere secrets en Supabase:
//   RESEND_API_KEY   → API key de Resend
//   RESERVA_FROM     → remitente verificado, ej. "Travexa Academy <reservas@travexa.com.ar>"
// Si RESEND_API_KEY no está seteada, responde 200 con { sent:false } y no rompe
// el flujo de reserva (el mail es una celebración, la reserva ya está hecha).

const ACADEMY_URL = 'https://academy.travexa.com.ar'

function fmtARS(n: number): string {
  return '$ ' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Math.round(n || 0))
}

interface Cuenta { titular?: string; banco?: string; cbu?: string; alias?: string }

function cuentasHtml(value: unknown): string {
  const raw: Cuenta[] = Array.isArray(value) ? value : value ? [value as Cuenta] : []
  const rows = raw
    .filter(c => c && (c.titular || c.banco || c.cbu || c.alias))
    .map(c => `<div style="background:#f2f5f4;border-radius:10px;padding:12px 14px;margin-bottom:8px">
      ${c.titular ? `<div><b>Titular:</b> ${c.titular}</div>` : ''}
      ${c.banco ? `<div><b>Banco:</b> ${c.banco}</div>` : ''}
      ${c.cbu ? `<div><b>CBU/CVU:</b> ${c.cbu}</div>` : ''}
      ${c.alias ? `<div><b>Alias:</b> ${c.alias}</div>` : ''}
    </div>`).join('')
  return rows || '<p>Te vamos a pasar los datos bancarios a la brevedad.</p>'
}

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'No autorizado' }, 401)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return jsonResponse({ error: 'Token inválido' }, 401)

    const { enrollment_id } = await req.json() as { enrollment_id: string }
    if (!enrollment_id) return jsonResponse({ error: 'Falta enrollment_id' }, 400)

    // Enrollment del propio usuario (no mandamos mail de reservas ajenas).
    const { data: enr } = await supabaseAdmin
      .from('academy_enrollments')
      .select('id, user_id, course_id, monto_total_ars, numero_reserva, punto_salida_elegido')
      .eq('id', enrollment_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!enr) return jsonResponse({ error: 'Reserva no encontrada' }, 404)

    const { data: course } = await supabaseAdmin
      .from('academy_courses')
      .select('titulo, vivencial_fecha_salida, vivencial_fecha_regreso, vivencial_pais, precio_ars')
      .eq('id', enr.course_id)
      .single()

    const { data: prof } = await supabaseAdmin
      .from('profiles').select('nombre, email').eq('id', user.id).maybeSingle()

    const { data: setting } = await supabaseAdmin
      .from('academy_settings').select('value').eq('key', 'travexa_datos_transferencia').maybeSingle()

    const to = prof?.email ?? user.email
    if (!to) return jsonResponse({ error: 'Sin email de destino' }, 400)

    const apiKey = Deno.env.get('RESEND_API_KEY')
    const from = Deno.env.get('RESERVA_FROM') ?? 'Travexa Academy <onboarding@resend.dev>'
    if (!apiKey) {
      // Sin proveedor configurado todavía: no rompemos el flujo.
      return jsonResponse({ sent: false, reason: 'RESEND_API_KEY no configurada' }, 200)
    }

    const total = enr.monto_total_ars ?? course?.precio_ars ?? 0
    const nombre = prof?.nombre ?? '¡Hola!'
    const html = `<!doctype html><html><body style="margin:0;background:#0A1E29;font-family:Inter,Arial,sans-serif;color:#0a1e29">
      <div style="max-width:560px;margin:0 auto;padding:28px 20px">
        <div style="text-align:center;color:#F5F3EC;margin-bottom:18px">
          <div style="font-size:22px;font-weight:800">Pencom <span style="color:#4ECDB8">Travexa</span></div>
          <div style="font-size:12px;color:#8FA3AB">Travexa Academy</div>
        </div>
        <div style="background:#fff;border-radius:16px;padding:26px 24px">
          <div style="font-size:12px;color:#C99A3A;font-weight:700">✈ ¡RESERVA CONFIRMADA!</div>
          <h1 style="font-size:20px;margin:6px 0 4px">${nombre}, tu lugar está reservado</h1>
          <p style="color:#4A6070;font-size:14px;margin:0 0 16px">${course?.titulo ?? 'Tu vivencial'}</p>
          ${enr.numero_reserva ? `<div style="display:inline-block;background:#fbf3e2;border:1px solid #e6d3a3;border-radius:10px;padding:8px 14px;font-weight:800;letter-spacing:.03em">N° ${enr.numero_reserva}</div>` : ''}
          <table style="width:100%;font-size:13px;color:#0a1e29;margin:16px 0;border-collapse:collapse">
            <tr><td style="padding:5px 0;color:#6a8590">Salida</td><td style="text-align:right;font-weight:600">${course?.vivencial_fecha_salida ?? '—'}</td></tr>
            <tr><td style="padding:5px 0;color:#6a8590">Regreso</td><td style="text-align:right;font-weight:600">${course?.vivencial_fecha_regreso ?? '—'}</td></tr>
            <tr><td style="padding:5px 0;color:#6a8590">Salís desde</td><td style="text-align:right;font-weight:600">${enr.punto_salida_elegido ?? 'Por confirmar'}</td></tr>
            <tr><td style="padding:5px 0;color:#6a8590">Monto total</td><td style="text-align:right;font-weight:800">${fmtARS(total)}</td></tr>
          </table>
          <h3 style="font-size:14px;margin:8px 0 8px;color:#0E6B5C">Datos para transferir</h3>
          <div style="font-size:13px">${cuentasHtml(setting?.value)}</div>
          <p style="font-size:13px;color:#4A6070;line-height:1.6;margin-top:14px">
            El pago es por transferencia (en un pago o en partes, siempre antes de viajar).
            Cuando transfieras, subí el comprobante desde tu perfil en Academy con <b>“Informar transferencia”</b> y Yesica lo confirma.
          </p>
          <a href="${ACADEMY_URL}/mis-cursos" style="display:inline-block;margin-top:14px;background:#0E6B5C;color:#fff;text-decoration:none;padding:11px 20px;border-radius:10px;font-weight:700;font-size:14px">Ir a mi viaje</a>
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
        subject: `Reserva confirmada${enr.numero_reserva ? ` · ${enr.numero_reserva}` : ''} — ${course?.titulo ?? 'Tu vivencial'}`,
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

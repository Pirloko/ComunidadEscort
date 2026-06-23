import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const PHONE_REGEX = /^\+569\d{8}$/
const GENERIC_ERROR = 'Credenciales inválidas'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido' }, 405)
  }

  let body: { phone?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Cuerpo de solicitud inválido' }, 400)
  }

  const { phone, password } = body
  if (!phone || !PHONE_REGEX.test(phone) || !password) {
    return jsonResponse({ error: GENERIC_ERROR }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: profile } = await adminClient
    .from('profiles')
    .select('email, account_status')
    .eq('phone', phone)
    .maybeSingle()

  // Mismo error genérico exista o no el teléfono: evita enumeración.
  if (!profile?.email) {
    return jsonResponse({ error: GENERIC_ERROR }, 401)
  }

  // No emitir tokens para cuentas bloqueadas: el chequeo debe vivir aquí
  // (server-side), no solo en el cliente tras el login.
  const { data: emailBlocked } = await adminClient.rpc('is_email_blocked', {
    p_email: profile.email,
  })
  if (emailBlocked || profile.account_status === 'bloqueada') {
    return jsonResponse({ error: GENERIC_ERROR }, 401)
  }

  const tokenResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anonKey },
    body: JSON.stringify({ email: profile.email, password }),
  })

  if (!tokenResponse.ok) {
    return jsonResponse({ error: GENERIC_ERROR }, 401)
  }

  const session = await tokenResponse.json()
  return jsonResponse(session)
})

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

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

function randomInt(maxExclusive: number): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % maxExclusive
}

function pick(chars: string): string {
  return chars[randomInt(chars.length)]
}

function generateTemporaryPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnpqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%*'
  const all = upper + lower + digits + symbols

  const chars = [pick(upper), pick(digits), pick(symbols)]
  while (chars.length < 12) {
    chars.push(pick(all))
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars.join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'No autorizado' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: callerData, error: callerError } = await callerClient.auth.getUser()
  if (callerError || !callerData.user) {
    return jsonResponse({ error: 'No autorizado' }, 401)
  }

  const { data: callerProfile } = await callerClient
    .from('profiles')
    .select('role')
    .eq('id', callerData.user.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return jsonResponse({ error: 'Solo administradoras pueden restablecer contraseñas' }, 403)
  }

  let body: { user_id?: string; mode?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Cuerpo de solicitud inválido' }, 400)
  }

  const { user_id, mode } = body
  if (!user_id) {
    return jsonResponse({ error: 'Falta el usuario' }, 400)
  }
  if (mode !== 'link' && mode !== 'temporary') {
    return jsonResponse({ error: 'Modo inválido' }, 400)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: target, error: targetError } = await adminClient.auth.admin.getUserById(user_id)
  if (targetError || !target.user?.email) {
    return jsonResponse({ error: 'Usuario no encontrado' }, 404)
  }
  const email = target.user.email

  if (mode === 'link') {
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
    })
    if (linkError || !linkData.properties?.hashed_token) {
      return jsonResponse({ error: linkError?.message ?? 'No se pudo generar el enlace' }, 400)
    }
    // Se devuelve solo el token_hash: el cliente arma un enlace a /reset-password que lo canjea
    // al pulsar un botón, para que la vista previa de WhatsApp no consuma el token de un solo uso.
    return jsonResponse({ email, tokenHash: linkData.properties.hashed_token })
  }

  const temporaryPassword = generateTemporaryPassword()

  const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(user_id, {
    password: temporaryPassword,
  })
  if (updateAuthError) {
    return jsonResponse({ error: updateAuthError.message }, 400)
  }

  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ must_change_password: true })
    .eq('id', user_id)

  if (profileError) {
    return jsonResponse(
      { error: 'Contraseña cambiada pero no se pudo exigir el cambio: ' + profileError.message },
      500,
    )
  }

  return jsonResponse({ email, temporaryPassword })
})

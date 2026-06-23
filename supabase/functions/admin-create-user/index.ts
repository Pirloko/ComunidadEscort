import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const PHONE_REGEX = /^\+569\d{8}$/

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
    return jsonResponse({ error: 'Solo administradoras pueden crear usuarios' }, 403)
  }

  let body: {
    alias?: string
    email?: string
    phone?: string
    publication_link?: string
    city_id?: string | null
  }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Cuerpo de solicitud inválido' }, 400)
  }

  const { alias, email, phone, publication_link, city_id } = body

  if (!alias || alias.trim().length < 3) {
    return jsonResponse({ error: 'El alias debe tener al menos 3 caracteres' }, 400)
  }
  if (!email || !email.includes('@')) {
    return jsonResponse({ error: 'Ingresa un correo válido' }, 400)
  }
  if (!phone || !PHONE_REGEX.test(phone)) {
    return jsonResponse({ error: 'phone debe estar en formato +569XXXXXXXX' }, 400)
  }
  if (!publication_link || publication_link.trim().length < 10) {
    return jsonResponse({ error: 'Ingresa el enlace completo de la publicación' }, 400)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const temporaryPassword = generateTemporaryPassword()

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      alias: alias.trim(),
      city_id: city_id ?? null,
      publication_link: publication_link.trim(),
      phone,
      must_change_password: true,
    },
  })

  if (createError || !created.user) {
    return jsonResponse({ error: createError?.message ?? 'No se pudo crear el usuario' }, 400)
  }

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({
      account_status: 'aprobada',
      is_active: true,
      reviewed_by: callerData.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', created.user.id)

  if (updateError) {
    return jsonResponse(
      { error: 'Usuario creado pero no se pudo aprobar automáticamente: ' + updateError.message },
      500,
    )
  }

  return jsonResponse({ email, temporaryPassword })
})

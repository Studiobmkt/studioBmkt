import { createClient } from 'jsr:@supabase/supabase-js@2'

const PROJECT_ID = 'gen-lang-client-0440968965'
const ADMIN_EMAILS = new Set(['contatorebecafurtado@gmail.com', 'intro5615@gmail.com'])
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.studiobmkt.com.br',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  return Uint8Array.from(atob(normalized + padding), char => char.charCodeAt(0))
}

async function verifyFirebaseAdmin(token: string) {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')
  if (!encodedHeader || !encodedPayload || !encodedSignature) throw new Error('Sessão inválida.')
  const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedHeader)))
  const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedPayload)))
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Sessão inválida.')
  if (claims.aud !== PROJECT_ID || claims.iss !== `https://securetoken.google.com/${PROJECT_ID}` || claims.exp * 1000 <= Date.now()) {
    throw new Error('Sessão expirada. Entre novamente no admin.')
  }
  if (typeof claims.email !== 'string' || !ADMIN_EMAILS.has(claims.email.toLowerCase())) {
    throw new Error('Você não tem permissão para enviar imagens.')
  }

  const keysResponse = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
  if (!keysResponse.ok) throw new Error('Não foi possível validar sua sessão.')
  const keys = await keysResponse.json() as { keys?: JsonWebKey[] }
  const jwk = keys.keys?.find(key => key.kid === header.kid)
  if (!jwk) throw new Error('Sua sessão foi atualizada. Entre novamente no admin.')
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decodeBase64Url(encodedSignature), new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`))
  if (!valid) throw new Error('Sessão inválida.')
}

function pathPart(value: FormDataEntryValue | null, name: string) {
  const text = typeof value === 'string' ? value : ''
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(text)) throw new Error(`${name} inválido.`)
  return text
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Faça login novamente para enviar imagens.' }, 401)

  try {
    await verifyFirebaseAdmin(token)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    if (request.method === 'DELETE') {
      const { path } = await request.json()
      if (typeof path !== 'string' || (!path.startsWith('projects/') && !path.startsWith('blog/'))) return json({ error: 'Imagem inválida.' }, 400)
      const { error } = await supabase.storage.from('case-images').remove([path])
      if (error) throw new Error(error.message)
      return json({ ok: true })
    }
    if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

    const form = await request.formData()
    const file = form.get('file')
    const projectKey = pathPart(form.get('projectKey'), 'Projeto')
    const kind = pathPart(form.get('kind'), 'Tipo')
    if (!(file instanceof File)) return json({ error: 'Selecione uma imagem.' }, 400)
    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_BYTES) return json({ error: 'Use JPG, PNG ou WebP de até 10 MB.' }, 400)
    if (kind !== 'cover' && kind !== 'gallery' && kind !== 'blog') return json({ error: 'Tipo de imagem inválido.' }, 400)

    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-')
    const path = kind === 'blog'
      ? `blog/${projectKey}/cover/${crypto.randomUUID()}-${safeName}`
      : `projects/${projectKey}/${kind}/${crypto.randomUUID()}-${safeName}`
    const { error } = await supabase.storage.from('case-images').upload(path, file, { contentType: file.type, upsert: false })
    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from('case-images').getPublicUrl(path)
    return json({ path, url: data.publicUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível enviar a imagem.'
    return json({ error: message }, 400)
  }
})

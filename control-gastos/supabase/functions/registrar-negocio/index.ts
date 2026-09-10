import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, nombreJefe, nombreNegocio } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: nuevoUsuario, error: errorCrear } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (errorCrear) {
      return new Response(JSON.stringify({ error: errorCrear.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const negocioId = crypto.randomUUID()

    const { error: errorNegocio } = await supabaseAdmin.from('negocios').insert({
      id: negocioId,
      nombre: nombreNegocio,
    })

    if (errorNegocio) {
      return new Response(JSON.stringify({ error: errorNegocio.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: errorPerfil } = await supabaseAdmin.from('perfiles').insert({
      id: nuevoUsuario.user.id,
      nombre: nombreJefe,
      rol: 'jefe',
      negocio_id: negocioId,
    })

    if (errorPerfil) {
      return new Response(JSON.stringify({ error: errorPerfil.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
// supabase/functions/invite-user/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Trata da requisição pre-flight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Cria um cliente admin do Supabase que pode ignorar a RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email } = await req.json()

    // Convida o utilizador usando o cliente admin
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
    if (inviteError) throw inviteError

    const newUser = inviteData.user;
    if (!newUser) {
      throw new Error("O convite foi enviado, mas não foi possível obter os dados do novo utilizador.");
    }

    // Atribui o papel de 'vendedor' ao novo utilizador
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: newUser.id, role: 'vendedor' })
    if (roleError) {
      // Se falhar, tenta apagar o utilizador para não o deixar num estado inconsistente
      await supabaseAdmin.auth.admin.deleteUser(newUser.id);
      throw roleError;
    }

    return new Response(JSON.stringify({ message: `Convite enviado para ${email}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
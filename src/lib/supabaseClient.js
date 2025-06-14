// src/lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// --- INFORMAÇÕES DE CONFIGURAÇÃO DO SUPABASE ---
// Substitua os valores abaixo pelos valores do seu projeto Supabase.
// Encontre-os em: Settings > API no seu dashboard Supabase.

const supabaseUrl = 'https://xyfofzofqbhtkwbjrcru.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Zm9mem9mcWJodGt3YmpyY3J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzI2NDgsImV4cCI6MjA2NTQ0ODY0OH0.9dEPQIYWTZ8xboDsDUyRJhJllmQnspmonn-yURbQGbM';

// --- CRIAÇÃO DO CLIENTE SUPABASE ---
// Aqui criamos uma instância única do cliente Supabase.
// Este 'supabase' é o objeto que usaremos em toda a aplicação
// para interagir com a nossa base de dados (ler, criar, atualizar, apagar dados).
// Ao exportá-lo, podemos simplesmente importá-lo em qualquer página ou componente
// que precise de aceder à base de dados.

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- NOTA DE SEGURANÇA ---
// A chave 'anon' (anónima) é segura para ser exposta no lado do cliente (o browser).
// A proteção dos seus dados não depende de esconder esta chave, mas sim
// das Políticas de Segurança a Nível de Linha (Row-Level Security - RLS)
// que iremos configurar diretamente na sua base de dados Supabase.
// Sem as RLS, esta chave permitiria ler toda a sua base de dados.
// Com as RLS ativas, ela apenas permite fazer o que as políticas autorizam.

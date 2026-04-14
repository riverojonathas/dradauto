-- ============================================
-- SCRIPT DE DIAGNÓSTICO — Google OAuth Sync
-- ============================================
-- Execute estes comandos no Supabase SQL Editor
-- e compartilhe os resultados comigo

-- 1. Verificar se sua clínica existe no banco
SELECT 
  id, 
  clerk_user_id, 
  nome,
  google_connected,
  google_access_token IS NOT NULL as "tem_access_token",
  google_refresh_token IS NOT NULL as "tem_refresh_token",
  google_token_expires_at,
  created_at
FROM clinics
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar políticas RLS na tabela clinics
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'clinics';

-- 3. Verificar se RLS está habilitado
SELECT 
  schemaname, 
  tablename, 
  rowsecurity
FROM pg_tables
WHERE tablename = 'clinics';

-- 4. Inserir policy para service_role (se não existir)
-- ⚠️ EXECUTE APENAS SE RLS ESTIVER ATIVADO E NÃO HOUVER POLICY
-- CREATE POLICY "service_role_all" ON clinics
--   FOR ALL TO service_role
--   USING (true) WITH CHECK (true);

-- 5. Verificar quantos pacientes não sincronizados existem
SELECT COUNT(*) as "pacientes_nao_sincronizados"
FROM patients
WHERE google_contact_id IS NULL;

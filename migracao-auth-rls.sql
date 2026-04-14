-- dradauto
-- Migração Clerk -> Supabase Auth + RLS nativo
-- Execute no Supabase SQL Editor.

begin;

-- 1. clinics.user_id
alter table public.clinics
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create unique index if not exists clinics_user_id_unique_idx
  on public.clinics (user_id)
  where user_id is not null;

comment on column public.clinics.user_id is 'FK para auth.users.id usada pelo Supabase Auth';

-- 2. Helper para policies por clinic_id
create or replace function public.is_clinic_owner(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clinics
    where clinics.id = target_clinic_id
      and clinics.user_id = auth.uid()
  );
$$;

revoke all on function public.is_clinic_owner(uuid) from public;
grant execute on function public.is_clinic_owner(uuid) to authenticated;
grant execute on function public.is_clinic_owner(uuid) to service_role;

-- 3. RLS: clinics
alter table public.clinics enable row level security;

drop policy if exists "service_role_all" on public.clinics;
create policy "service_role_all" on public.clinics
  for all to service_role
  using (true)
  with check (true);

drop policy if exists "user_read_own_clinic" on public.clinics;
create policy "user_read_own_clinic" on public.clinics
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_insert_own_clinic" on public.clinics;
create policy "user_insert_own_clinic" on public.clinics
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_update_own_clinic" on public.clinics;
create policy "user_update_own_clinic" on public.clinics
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_delete_own_clinic" on public.clinics;
create policy "user_delete_own_clinic" on public.clinics
  for delete to authenticated
  using (auth.uid() = user_id);

-- 4. RLS helper macro aplicado em tabelas com clinic_id
alter table public.patients enable row level security;
drop policy if exists "service_role_all" on public.patients;
create policy "service_role_all" on public.patients
  for all to service_role
  using (true)
  with check (true);
drop policy if exists "user_select_own_clinic_rows" on public.patients;
create policy "user_select_own_clinic_rows" on public.patients
  for select to authenticated
  using (public.is_clinic_owner(clinic_id));
drop policy if exists "user_insert_own_clinic_rows" on public.patients;
create policy "user_insert_own_clinic_rows" on public.patients
  for insert to authenticated
  with check (public.is_clinic_owner(clinic_id));
drop policy if exists "user_update_own_clinic_rows" on public.patients;
create policy "user_update_own_clinic_rows" on public.patients
  for update to authenticated
  using (public.is_clinic_owner(clinic_id))
  with check (public.is_clinic_owner(clinic_id));
drop policy if exists "user_delete_own_clinic_rows" on public.patients;
create policy "user_delete_own_clinic_rows" on public.patients
  for delete to authenticated
  using (public.is_clinic_owner(clinic_id));

alter table public.appointments enable row level security;
drop policy if exists "service_role_all" on public.appointments;
create policy "service_role_all" on public.appointments
  for all to service_role
  using (true)
  with check (true);
drop policy if exists "user_select_own_clinic_rows" on public.appointments;
create policy "user_select_own_clinic_rows" on public.appointments
  for select to authenticated
  using (public.is_clinic_owner(clinic_id));
drop policy if exists "user_insert_own_clinic_rows" on public.appointments;
create policy "user_insert_own_clinic_rows" on public.appointments
  for insert to authenticated
  with check (public.is_clinic_owner(clinic_id));
drop policy if exists "user_update_own_clinic_rows" on public.appointments;
create policy "user_update_own_clinic_rows" on public.appointments
  for update to authenticated
  using (public.is_clinic_owner(clinic_id))
  with check (public.is_clinic_owner(clinic_id));
drop policy if exists "user_delete_own_clinic_rows" on public.appointments;
create policy "user_delete_own_clinic_rows" on public.appointments
  for delete to authenticated
  using (public.is_clinic_owner(clinic_id));

alter table public.medical_records enable row level security;
drop policy if exists "service_role_all" on public.medical_records;
create policy "service_role_all" on public.medical_records
  for all to service_role
  using (true)
  with check (true);
drop policy if exists "user_select_own_clinic_rows" on public.medical_records;
create policy "user_select_own_clinic_rows" on public.medical_records
  for select to authenticated
  using (public.is_clinic_owner(clinic_id));
drop policy if exists "user_insert_own_clinic_rows" on public.medical_records;
create policy "user_insert_own_clinic_rows" on public.medical_records
  for insert to authenticated
  with check (public.is_clinic_owner(clinic_id));
drop policy if exists "user_update_own_clinic_rows" on public.medical_records;
create policy "user_update_own_clinic_rows" on public.medical_records
  for update to authenticated
  using (public.is_clinic_owner(clinic_id))
  with check (public.is_clinic_owner(clinic_id));
drop policy if exists "user_delete_own_clinic_rows" on public.medical_records;
create policy "user_delete_own_clinic_rows" on public.medical_records
  for delete to authenticated
  using (public.is_clinic_owner(clinic_id));

alter table public.anamnesis enable row level security;
drop policy if exists "service_role_all" on public.anamnesis;
create policy "service_role_all" on public.anamnesis
  for all to service_role
  using (true)
  with check (true);
drop policy if exists "user_select_own_clinic_rows" on public.anamnesis;
create policy "user_select_own_clinic_rows" on public.anamnesis
  for select to authenticated
  using (public.is_clinic_owner(clinic_id));
drop policy if exists "user_insert_own_clinic_rows" on public.anamnesis;
create policy "user_insert_own_clinic_rows" on public.anamnesis
  for insert to authenticated
  with check (public.is_clinic_owner(clinic_id));
drop policy if exists "user_update_own_clinic_rows" on public.anamnesis;
create policy "user_update_own_clinic_rows" on public.anamnesis
  for update to authenticated
  using (public.is_clinic_owner(clinic_id))
  with check (public.is_clinic_owner(clinic_id));
drop policy if exists "user_delete_own_clinic_rows" on public.anamnesis;
create policy "user_delete_own_clinic_rows" on public.anamnesis
  for delete to authenticated
  using (public.is_clinic_owner(clinic_id));

alter table public.privacy_consents enable row level security;
drop policy if exists "service_role_all" on public.privacy_consents;
create policy "service_role_all" on public.privacy_consents
  for all to service_role
  using (true)
  with check (true);
drop policy if exists "user_select_own_clinic_rows" on public.privacy_consents;
create policy "user_select_own_clinic_rows" on public.privacy_consents
  for select to authenticated
  using (clinic_id is not null and public.is_clinic_owner(clinic_id));
drop policy if exists "user_insert_own_clinic_rows" on public.privacy_consents;
create policy "user_insert_own_clinic_rows" on public.privacy_consents
  for insert to authenticated
  with check (clinic_id is not null and public.is_clinic_owner(clinic_id));
drop policy if exists "user_update_own_clinic_rows" on public.privacy_consents;
create policy "user_update_own_clinic_rows" on public.privacy_consents
  for update to authenticated
  using (clinic_id is not null and public.is_clinic_owner(clinic_id))
  with check (clinic_id is not null and public.is_clinic_owner(clinic_id));
drop policy if exists "user_delete_own_clinic_rows" on public.privacy_consents;
create policy "user_delete_own_clinic_rows" on public.privacy_consents
  for delete to authenticated
  using (clinic_id is not null and public.is_clinic_owner(clinic_id));

alter table public.whatsapp_sessions enable row level security;
drop policy if exists "service_role_all" on public.whatsapp_sessions;
create policy "service_role_all" on public.whatsapp_sessions
  for all to service_role
  using (true)
  with check (true);
drop policy if exists "user_select_own_clinic_rows" on public.whatsapp_sessions;
create policy "user_select_own_clinic_rows" on public.whatsapp_sessions
  for select to authenticated
  using (public.is_clinic_owner(clinic_id));
drop policy if exists "user_insert_own_clinic_rows" on public.whatsapp_sessions;
create policy "user_insert_own_clinic_rows" on public.whatsapp_sessions
  for insert to authenticated
  with check (public.is_clinic_owner(clinic_id));
drop policy if exists "user_update_own_clinic_rows" on public.whatsapp_sessions;
create policy "user_update_own_clinic_rows" on public.whatsapp_sessions
  for update to authenticated
  using (public.is_clinic_owner(clinic_id))
  with check (public.is_clinic_owner(clinic_id));
drop policy if exists "user_delete_own_clinic_rows" on public.whatsapp_sessions;
create policy "user_delete_own_clinic_rows" on public.whatsapp_sessions
  for delete to authenticated
  using (public.is_clinic_owner(clinic_id));

alter table public.conversation_memory enable row level security;
drop policy if exists "service_role_all" on public.conversation_memory;
create policy "service_role_all" on public.conversation_memory
  for all to service_role
  using (true)
  with check (true);
drop policy if exists "user_select_own_clinic_rows" on public.conversation_memory;
create policy "user_select_own_clinic_rows" on public.conversation_memory
  for select to authenticated
  using (public.is_clinic_owner(clinic_id));
drop policy if exists "user_insert_own_clinic_rows" on public.conversation_memory;
create policy "user_insert_own_clinic_rows" on public.conversation_memory
  for insert to authenticated
  with check (public.is_clinic_owner(clinic_id));
drop policy if exists "user_update_own_clinic_rows" on public.conversation_memory;
create policy "user_update_own_clinic_rows" on public.conversation_memory
  for update to authenticated
  using (public.is_clinic_owner(clinic_id))
  with check (public.is_clinic_owner(clinic_id));
drop policy if exists "user_delete_own_clinic_rows" on public.conversation_memory;
create policy "user_delete_own_clinic_rows" on public.conversation_memory
  for delete to authenticated
  using (public.is_clinic_owner(clinic_id));

alter table public.audit_logs enable row level security;
drop policy if exists "service_role_all" on public.audit_logs;
create policy "service_role_all" on public.audit_logs
  for all to service_role
  using (true)
  with check (true);
drop policy if exists "user_select_own_clinic_rows" on public.audit_logs;
create policy "user_select_own_clinic_rows" on public.audit_logs
  for select to authenticated
  using (clinic_id is not null and public.is_clinic_owner(clinic_id));

commit;

-- Verificações pós-execução
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'clinics',
    'patients',
    'appointments',
    'medical_records',
    'anamnesis',
    'privacy_consents',
    'whatsapp_sessions',
    'conversation_memory',
    'audit_logs'
  )
order by tablename;

select tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'clinics',
    'patients',
    'appointments',
    'medical_records',
    'anamnesis',
    'privacy_consents',
    'whatsapp_sessions',
    'conversation_memory',
    'audit_logs'
  )
order by tablename, policyname;
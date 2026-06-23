-- hiDeva Row Level Security Migration
-- Generated: 2024
-- Purpose: Enable RLS and enforce user ownership on all user-owned tables

-- ============================================================================
-- PHASE 1: Enable RLS on all user-owned tables
-- ============================================================================

-- Core app tables (from supabase/schema.sql)
alter table profiles enable row level security;
alter table notes enable row level security;
alter table tasks enable row level security;
alter table events enable row level security;
alter table projects enable row level security;
alter table documents enable row level security;
alter table memories enable row level security;
alter table agents enable row level security;
alter table workflows enable row level security;
alter table conversations enable row level security;
alter table connectors enable row level security;

-- ============================================================================
-- PHASE 3: Policies for profiles (direct user_id ownership)
-- ============================================================================

create policy "Users can view own profile"
  on profiles for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own profile"
  on profiles for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own profile"
  on profiles for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================================================
-- PHASE 4: Policies for notes (profile_id ownership)
-- ============================================================================

create policy "Users can view own notes"
  on notes for select
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can insert own notes"
  on notes for insert
  to authenticated
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can update own notes"
  on notes for update
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()))
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can delete own notes"
  on notes for delete
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

-- ============================================================================
-- PHASE 5: Policies for tasks (profile_id ownership)
-- ============================================================================

create policy "Users can view own tasks"
  on tasks for select
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can insert own tasks"
  on tasks for insert
  to authenticated
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can update own tasks"
  on tasks for update
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()))
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can delete own tasks"
  on tasks for delete
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

-- ============================================================================
-- PHASE 6: Policies for events (profile_id ownership)
-- ============================================================================

create policy "Users can view own events"
  on events for select
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can insert own events"
  on events for insert
  to authenticated
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can update own events"
  on events for update
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()))
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can delete own events"
  on events for delete
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

-- ============================================================================
-- PHASE 7: Policies for projects (profile_id ownership)
-- ============================================================================

create policy "Users can view own projects"
  on projects for select
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can insert own projects"
  on projects for insert
  to authenticated
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can update own projects"
  on projects for update
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()))
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can delete own projects"
  on projects for delete
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

-- ============================================================================
-- PHASE 8: Policies for documents (profile_id ownership)
-- ============================================================================

create policy "Users can view own documents"
  on documents for select
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can insert own documents"
  on documents for insert
  to authenticated
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can update own documents"
  on documents for update
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()))
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can delete own documents"
  on documents for delete
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

-- ============================================================================
-- PHASE 9: Policies for memories (profile_id ownership)
-- ============================================================================

create policy "Users can view own memories"
  on memories for select
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can insert own memories"
  on memories for insert
  to authenticated
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can update own memories"
  on memories for update
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()))
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can delete own memories"
  on memories for delete
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

-- ============================================================================
-- PHASE 10: Policies for agents (profile_id ownership)
-- ============================================================================

create policy "Users can view own agents"
  on agents for select
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can insert own agents"
  on agents for insert
  to authenticated
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can update own agents"
  on agents for update
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()))
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can delete own agents"
  on agents for delete
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

-- ============================================================================
-- PHASE 11: Policies for workflows (profile_id ownership)
-- ============================================================================

create policy "Users can view own workflows"
  on workflows for select
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can insert own workflows"
  on workflows for insert
  to authenticated
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can update own workflows"
  on workflows for update
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()))
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can delete own workflows"
  on workflows for delete
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

-- ============================================================================
-- PHASE 12: Policies for conversations (profile_id ownership)
-- ============================================================================

create policy "Users can view own conversations"
  on conversations for select
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can insert own conversations"
  on conversations for insert
  to authenticated
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can update own conversations"
  on conversations for update
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()))
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can delete own conversations"
  on conversations for delete
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

-- ============================================================================
-- PHASE 13: Policies for connectors (profile_id ownership)
-- ============================================================================

create policy "Users can view own connectors"
  on connectors for select
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can insert own connectors"
  on connectors for insert
  to authenticated
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can update own connectors"
  on connectors for update
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()))
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can delete own connectors"
  on connectors for delete
  to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()));
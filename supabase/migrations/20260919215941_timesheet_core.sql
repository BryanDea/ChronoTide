-- Personal timesheets. Every exposed record is owned by one authenticated user.
create table public.clients (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check (length(btrim(name)) between 1 and 200), archived_at timestamptz,
 created_at timestamptz not null default now(), unique(user_id,id)
);
create table public.profiles (
 user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
 reporting_name text not null default '', timezone text not null default 'America/El_Salvador',
 preferred_client_id uuid, created_at timestamptz not null default now(),
 foreign key(user_id,preferred_client_id) references public.clients(user_id,id)
);
create table public.projects (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 client_id uuid not null, name text not null check(length(btrim(name)) between 1 and 200),
 color text not null default '#6864e8' check(color ~ '^#[0-9a-fA-F]{6}$'), archived_at timestamptz,
 created_at timestamptz not null default now(), unique(user_id,id),
 foreign key(user_id,client_id) references public.clients(user_id,id)
);
create table public.time_entries (
 id uuid primary key, user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 project_id uuid not null, work_date date not null,
 description text not null check(length(btrim(description)) between 1 and 4000),
 duration_minutes integer not null check(duration_minutes > 0), billable boolean not null default true,
 revision integer not null default 1 check(revision > 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(user_id,project_id) references public.projects(user_id,id)
);
create table public.save_requests (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 request_id uuid not null, payload jsonb not null, result jsonb not null, created_at timestamptz not null default now(),
 primary key(user_id,request_id)
);
create table public.report_snapshots (
 id uuid primary key, user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 period_start date not null check(extract(day from period_start)=1), client_id uuid not null, project_id uuid,
 snapshot jsonb not null, sent_at timestamptz not null default now(),
 foreign key(user_id,client_id) references public.clients(user_id,id),
 foreign key(user_id,project_id) references public.projects(user_id,id)
);
create index projects_owner_client on public.projects(user_id,client_id);
create index time_entries_owner_date on public.time_entries(user_id,work_date);
create index time_entries_owner_project on public.time_entries(user_id,project_id);
create index snapshots_owner_period on public.report_snapshots(user_id,period_start);
create index snapshots_owner_client on public.report_snapshots(user_id,client_id);
create index snapshots_owner_project on public.report_snapshots(user_id,project_id);
create index profiles_owner_preference on public.profiles(user_id,preferred_client_id);

alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.profiles enable row level security;
alter table public.time_entries enable row level security;
alter table public.save_requests enable row level security;
alter table public.report_snapshots enable row level security;

create policy clients_owner on public.clients to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy projects_owner on public.projects to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy profiles_owner on public.profiles to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy entries_owner on public.time_entries to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy requests_read on public.save_requests for select to authenticated using((select auth.uid())=user_id);
create policy requests_insert on public.save_requests for insert to authenticated with check((select auth.uid())=user_id);
create policy snapshots_read on public.report_snapshots for select to authenticated using((select auth.uid())=user_id);
create policy snapshots_insert on public.report_snapshots for insert to authenticated with check((select auth.uid())=user_id);

revoke all on public.clients,public.projects,public.profiles,public.time_entries,public.save_requests,public.report_snapshots from anon,authenticated;
grant select,insert,update on public.clients,public.projects,public.profiles to authenticated;
grant select,insert,update,delete on public.time_entries to authenticated;
grant select,insert on public.save_requests,public.report_snapshots to authenticated;

create function public.guard_entry() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='UPDATE' then
   if new.user_id<>old.user_id or new.id<>old.id then raise exception 'Entry ownership and ID cannot change'; end if;
   new.revision:=old.revision+1; new.updated_at:=now(); new.created_at:=old.created_at;
 else new.revision:=1;
 end if;
 if TG_OP='INSERT' or new.project_id<>old.project_id then
   if not exists(select 1 from public.projects p join public.clients c on c.id=p.client_id and c.user_id=p.user_id where p.id=new.project_id and p.user_id=new.user_id and p.archived_at is null and c.archived_at is null) then raise exception 'Choose an active project and client'; end if;
 end if;
 return new;
end $$;
create trigger guard_entry before insert or update on public.time_entries for each row execute function public.guard_entry();
-- Existing time must not silently move to another client when a project is edited.
create function public.guard_project() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.user_id<>old.user_id or new.id<>old.id or new.client_id<>old.client_id then raise exception 'Project owner and client cannot change'; end if;
 return new;
end $$;
create trigger guard_project before update on public.projects for each row execute function public.guard_project();

create function public.ensure_workspace() returns void language plpgsql security invoker set search_path='' as $$
declare uid uuid:=auth.uid(); cid uuid;
begin
 if uid is null then raise exception 'Sign in first'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 if not exists(select 1 from public.profiles where user_id=uid) then
   insert into public.clients(user_id,name) values(uid,'PegaSupport') returning id into cid;
   insert into public.profiles(user_id,preferred_client_id) values(uid,cid);
 end if;
end $$;

-- All changes are deltas against known revisions. Replaying a request returns its
-- original result, even if the first response was lost or its records later changed.
create function public.save_time_entries(p_request_id uuid,p_changes jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare uid uuid:=auth.uid(); prior public.save_requests; item jsonb; eid uuid; expected integer; affected integer; answer jsonb:='[]'::jsonb; saved public.time_entries;
begin
 if uid is null then raise exception 'Sign in first'; end if;
 if p_request_id is null or jsonb_typeof(p_changes)<>'array' then raise exception 'Invalid save request'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select * into prior from public.save_requests where user_id=uid and request_id=p_request_id;
 if found then
   if prior.payload<>p_changes then raise exception 'Request ID reused with different changes'; end if;
   return prior.result;
 end if;
 for item in select value from jsonb_array_elements(p_changes) loop
   eid:=(item->>'id')::uuid; expected:=coalesce((item->>'expected_revision')::integer,0);
   if item->>'operation'='delete' then
     delete from public.time_entries where user_id=uid and id=eid and revision=expected;
     get diagnostics affected=row_count;
     if affected<>1 then raise exception 'Conflict: an entry changed on another device. Reload saved data before retrying.' using errcode='40001'; end if;
     answer:=answer||jsonb_build_array(jsonb_build_object('id',eid,'deleted',true));
   elsif item->>'operation'='upsert' then
     if expected=0 then
       insert into public.time_entries(id,user_id,project_id,work_date,description,duration_minutes,billable)
       values(eid,uid,(item->>'project_id')::uuid,(item->>'work_date')::date,item->>'description',(item->>'duration_minutes')::integer,(item->>'billable')::boolean) returning * into saved;
     else
       update public.time_entries set project_id=(item->>'project_id')::uuid,work_date=(item->>'work_date')::date,description=item->>'description',duration_minutes=(item->>'duration_minutes')::integer,billable=(item->>'billable')::boolean
       where user_id=uid and id=eid and revision=expected returning * into saved;
       if not found then raise exception 'Conflict: an entry changed on another device. Reload saved data before retrying.' using errcode='40001'; end if;
     end if;
     answer:=answer||jsonb_build_array(to_jsonb(saved));
   else raise exception 'Unknown change operation';
   end if;
 end loop;
 insert into public.save_requests(user_id,request_id,payload,result) values(uid,p_request_id,p_changes,answer);
 return answer;
end $$;

create function public.create_report_snapshot(p_id uuid,p_period date,p_client uuid,p_project uuid default null) returns public.report_snapshots language plpgsql security invoker set search_path='' as $$
declare uid uuid:=auth.uid(); saved public.report_snapshots; details jsonb; client_name text; person text; minutes bigint;
begin
 if uid is null then raise exception 'Sign in first'; end if;
 if p_id is null or p_period is null or extract(day from p_period)<>1 then raise exception 'Use the first day of the reporting month'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select * into saved from public.report_snapshots where user_id=uid and id=p_id;
 if found then
   if saved.period_start<>p_period or saved.client_id<>p_client or saved.project_id is distinct from p_project then raise exception 'Snapshot request reused with different filters'; end if;
   return saved;
 end if;
 select name into client_name from public.clients where id=p_client and user_id=uid;
 if not found then raise exception 'Client not found'; end if;
 if p_project is not null and not exists(select 1 from public.projects where id=p_project and user_id=uid and client_id=p_client) then raise exception 'Project not found for this client'; end if;
 select reporting_name into person from public.profiles where user_id=uid;
 if person is null or btrim(person)='' then raise exception 'Set your reporting name in Settings first'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'date',e.work_date,'project_id',p.id,'project',p.name,'description',e.description,'minutes',e.duration_minutes,'billable',e.billable) order by e.work_date,e.created_at,e.id),'[]'::jsonb),coalesce(sum(e.duration_minutes),0)
 into details,minutes from public.time_entries e join public.projects p on p.id=e.project_id and p.user_id=e.user_id
 where e.user_id=uid and p.client_id=p_client and (p_project is null or p.id=p_project) and e.work_date>=p_period and e.work_date<(p_period+interval '1 month')::date;
 insert into public.report_snapshots(id,user_id,period_start,client_id,project_id,snapshot)
 values(p_id,uid,p_period,p_client,p_project,jsonb_build_object('version',1,'reporting_name',person,'client_name',client_name,'period',to_char(p_period,'YYYY-MM'),'entries',details,'total_minutes',minutes)) returning * into saved;
 return saved;
end $$;

revoke execute on function public.guard_entry(), public.guard_project(), public.ensure_workspace(), public.save_time_entries(uuid,jsonb), public.create_report_snapshot(uuid,date,uuid,uuid) from public, anon;
grant execute on function public.ensure_workspace(), public.save_time_entries(uuid,jsonb), public.create_report_snapshot(uuid,date,uuid,uuid) to authenticated;

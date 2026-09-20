-- Entire test runs in a transaction and leaves no users or records behind.
begin;
insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000001','timesheets-test-a@example.invalid'),('00000000-0000-4000-8000-000000000002','timesheets-test-b@example.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select public.ensure_workspace();
update public.profiles set reporting_name='Isolation Test A';
insert into public.projects(id,client_id,name) select '00000000-0000-4000-8000-000000000101',id,'Test project' from public.clients;
select public.save_time_entries('00000000-0000-4000-8000-000000000201','[{"operation":"upsert","id":"00000000-0000-4000-8000-000000000301","expected_revision":0,"project_id":"00000000-0000-4000-8000-000000000101","work_date":"2026-09-30","description":"Original description","duration_minutes":150,"billable":true}]');
select public.save_time_entries('00000000-0000-4000-8000-000000000201','[{"operation":"upsert","id":"00000000-0000-4000-8000-000000000301","expected_revision":0,"project_id":"00000000-0000-4000-8000-000000000101","work_date":"2026-09-30","description":"Original description","duration_minutes":150,"billable":true}]');
do $$begin if (select count(*) from public.time_entries)<>1 or (select sum(duration_minutes) from public.time_entries)<>150 then raise exception 'FAIL duplicate retry';end if;end$$;
select public.create_report_snapshot('00000000-0000-4000-8000-000000000401','2026-09-01',(select id from public.clients),null);
select public.save_time_entries('00000000-0000-4000-8000-000000000202','[{"operation":"upsert","id":"00000000-0000-4000-8000-000000000301","expected_revision":1,"project_id":"00000000-0000-4000-8000-000000000101","work_date":"2026-10-01","description":"Edited after sending","duration_minutes":180,"billable":false}]');
do $$begin
 if (select (snapshot->>'total_minutes')::int from public.report_snapshots)<>150 then raise exception 'FAIL snapshot changed';end if;
 if (select snapshot->'entries'->0->>'description' from public.report_snapshots)<>'Original description' then raise exception 'FAIL snapshot description changed';end if;
 begin
 perform public.save_time_entries('00000000-0000-4000-8000-000000000203','[{"operation":"delete","id":"00000000-0000-4000-8000-000000000301","expected_revision":1}]');
 raise exception 'FAIL stale revision accepted';
 exception when serialization_failure then null;end;
 begin update public.report_snapshots set snapshot='{}';raise exception 'FAIL mutable snapshot';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
select public.ensure_workspace();
do $$declare affected int;begin
 if (select count(*) from public.time_entries)<>0 or (select count(*) from public.projects)<>0 or (select count(*) from public.report_snapshots)<>0 or (select count(*) from public.save_requests)<>0 then raise exception 'FAIL cross-user read';end if;
 if (select count(*) from public.clients)<>1 or (select count(*) from public.profiles)<>1 then raise exception 'FAIL profile/client isolation';end if;
 update public.time_entries set description='attack' where id='00000000-0000-4000-8000-000000000301';get diagnostics affected=row_count;if affected<>0 then raise exception 'FAIL cross-user update';end if;
 begin
 insert into public.clients(user_id,name) values('00000000-0000-4000-8000-000000000001','attack');
 raise exception 'FAIL owner spoof accepted';exception when insufficient_privilege then null;end;
 begin
 insert into public.projects(client_id,name) values((select id from public.clients),'Own valid project');
 update public.profiles set preferred_client_id=(select client_id from public.projects where id='00000000-0000-4000-8000-000000000101');
 end;
 begin
 insert into public.time_entries(id,project_id,work_date,description,duration_minutes) values(gen_random_uuid(),'00000000-0000-4000-8000-000000000101','2026-09-01','attack',60);
 raise exception 'FAIL cross-user relation accepted';
 exception when raise_exception then if SQLERRM='FAIL cross-user relation accepted' then raise;end if;end;
end$$;
set local role anon;
do $$begin
 begin perform * from public.time_entries;raise exception 'FAIL anonymous read';exception when insufficient_privilege then null;end;
 begin perform public.ensure_workspace();raise exception 'FAIL anonymous RPC';exception when insufficient_privilege then null;end;
end$$;
reset role;
select 'PASS: retry deduplication, conflict detection, snapshot stability, anonymous restrictions, user isolation' as result;
rollback;

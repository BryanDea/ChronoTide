'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fromRecord, type EntryRecord, type LiveEntry, type Client, type LiveProject, type Profile, type Snapshot } from './models';
import { entryChanges, type Change } from './changes';
export function errorMessage(error:unknown):string {const message=error instanceof Error?error.message:typeof error==='object'&&error&&'message' in error?String(error.message):'Unable to reach Supabase.';return /fetch|network/i.test(message)?'Could not reach Supabase. Check your connection and retry; your input is preserved.':message;}
async function allRows(db:SupabaseClient,table:string){const rows:Record<string,unknown>[]=[];for(let offset=0;;offset+=1000){const {data,error}=await db.from(table).select('*').order(table==='profiles'?'user_id':'id').range(offset,offset+999);if(error)throw error;rows.push(...data);if(data.length<1000)return rows;}}
export function useWorkspace(db:SupabaseClient) {
 const [entries,setEntries]=useState<LiveEntry[]>([]);const [base,setBase]=useState<LiveEntry[]>([]);
 const [clients,setClients]=useState<Client[]>([]);const [projects,setProjects]=useState<LiveProject[]>([]);const [profile,setProfile]=useState<Profile|null>(null);const [snapshots,setSnapshots]=useState<Snapshot[]>([]);
 const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [error,setError]=useState('');const [savedAt,setSavedAt]=useState<string|null>(null);const [retryPending,setRetryPending]=useState(false);
 const pending=useRef<{id:string;changes:Change[]}|null>(null);const busy=useRef(false);const dirtyRef=useRef(false);const alive=useRef(true);const generation=useRef(0);
 const dirty=entryChanges(base,entries).length>0;
 const load=useCallback(async()=>{
   const started=generation.current;
   const {error:initError}=await db.rpc('ensure_workspace');if(initError)throw initError;
   const [es,cs,ps,profileResult,ss]=await Promise.all([allRows(db,'time_entries'),allRows(db,'clients'),allRows(db,'projects'),db.from('profiles').select('*').single(),allRows(db,'report_snapshots')]);
   if(profileResult.error)throw profileResult.error;if(!alive.current||started!==generation.current)return;
   const next=es.map(e=>fromRecord(e as unknown as EntryRecord));setEntries(next);setBase(next);
   setClients(cs.map(c=>({id:String(c.id),name:String(c.name),archivedAt:c.archived_at as string|null})));
   setProjects(ps.map(p=>({id:String(p.id),clientId:String(p.client_id),name:String(p.name),color:String(p.color),code:String(p.name).split(/\s+/).map(s=>s[0]).slice(0,2).join('').toUpperCase(),archivedAt:p.archived_at as string|null})));
   setProfile(profileResult.data);setSnapshots(ss as unknown as Snapshot[]);setError('');dirtyRef.current=false;
 },[db]);
 const refresh=useCallback(async()=>{setLoading(true);try{await load();pending.current=null;setRetryPending(false);}catch(e){setError(errorMessage(e));}finally{if(alive.current)setLoading(false);}},[load]);
 useEffect(()=>{alive.current=true;void load().catch(e=>{if(alive.current)setError(errorMessage(e));}).finally(()=>{if(alive.current)setLoading(false);});const focus=()=>{if(!dirtyRef.current&&!busy.current&&!pending.current)void load().catch(e=>{if(alive.current)setError(errorMessage(e));});};window.addEventListener('focus',focus);return()=>{alive.current=false;window.removeEventListener('focus',focus);};},[load]);
 const updateEntries=(next:LiveEntry[])=>{if(busy.current||pending.current)throw new Error('Retry the pending save, or reload saved data, before making more edits.');generation.current++;dirtyRef.current=true;setEntries(next);setError('');setSavedAt(null);};
 async function save(){
   if(busy.current)return false;
   const request=pending.current||{id:crypto.randomUUID(),changes:entryChanges(base,entries)};
   if(!request.changes.length)return true;
   generation.current++;busy.current=true;pending.current=request;setSaving(true);setError('');
   try{const {data,error:saveError}=await db.rpc('save_time_entries',{p_request_id:request.id,p_changes:request.changes});if(saveError)throw saveError;
     const result=data as (EntryRecord&{deleted?:boolean})[];const byId=new Map(entries.map(e=>[e.id,e]));for(const item of result){if(item.deleted)byId.delete(item.id);else byId.set(item.id,fromRecord(item));}
     const next=Array.from(byId.values());setEntries(next);setBase(next);dirtyRef.current=false;pending.current=null;setRetryPending(false);setSavedAt(new Date().toLocaleTimeString());return true;
   }catch(e){setError(errorMessage(e));setRetryPending(true);return false;}finally{busy.current=false;setSaving(false);}
 }
 async function saveClient(id:string,name:string,archivedAt:string|null){const row={id,name,archived_at:archivedAt};const {error:e}=await db.from('clients').upsert(row);if(e)throw e;generation.current++;setClients(old=>{const c={id,name,archivedAt};return old.some(x=>x.id===id)?old.map(x=>x.id===id?c:x):[...old,c];});}
 async function saveProject(id:string,name:string,clientId:string,color:string,archivedAt:string|null){const {error:e}=await db.from('projects').upsert({id,name,client_id:clientId,color,archived_at:archivedAt});if(e)throw e;generation.current++;setProjects(old=>{const p={id,name,clientId,color,archivedAt,code:name.slice(0,2).toUpperCase()};return old.some(x=>x.id===id)?old.map(x=>x.id===id?p:x):[...old,p];});}
 async function saveProfile(values:Pick<Profile,'reporting_name'|'timezone'|'preferred_client_id'>){if(!profile)return;try{new Intl.DateTimeFormat('en',{timeZone:values.timezone});}catch{throw new Error('Enter a valid timezone, for example America/El_Salvador.');}const {data,error:e}=await db.from('profiles').update(values).eq('user_id',profile.user_id).select().single();if(e)throw e;generation.current++;setProfile(data);}
 async function snapshot(id:string,period:string,clientId:string,projectId:string|null){const {data,error:e}=await db.rpc('create_report_snapshot',{p_id:id,p_period:period+'-01',p_client:clientId,p_project:projectId});if(e)throw e;generation.current++;setSnapshots(old=>[data as Snapshot,...old.filter(s=>s.id!==data.id)]);return data as Snapshot;}
 return {entries,clients,projects,profile,snapshots,loading,saving,error,dirty,savedAt,retryPending,updateEntries,save,refresh,saveClient,saveProject,saveProfile,snapshot};
}

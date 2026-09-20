'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { CalendarDays, Clock3, FolderKanban, Building2, FileText, Settings2, ChevronLeft, ChevronRight, Plus, Moon, Sun, ArrowUpRight, Check, Keyboard, Layers3, CloudOff, Loader2, RefreshCw, Trash2, Pencil, Wallet, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { parseDuration, formatDuration as fmt, shiftDate, total, inMonth, labelDate, monday } from '@/lib/timesheets/domain';

const navigation = [{name:'This Week',icon:CalendarDays},{name:'Projects',icon:FolderKanban},{name:'Clients',icon:Building2},{name:'Reports',icon:FileText},{name:'Settings',icon:Settings2}];
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { LiveEntry as Entry } from '@/lib/timesheets/models';
import { useWorkspace, errorMessage } from '@/lib/timesheets/use-workspace';
import { AuthGate } from '@/components/timesheets/auth-gate';
import { Management, Preferences } from '@/components/timesheets/management';
import { Reports } from '@/components/timesheets/reports';
function todayIn(timezone:string){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(type=>parts.find(p=>p.type===type)!.value).join('-');}
type Row = { key:string; project:string; description:string; billable:boolean };
type Editor = { date:string; project:string; description:string; billable:boolean; id?:string; duration:string };
export default function Home(){return <AuthGate>{(db,user)=><Workspace key={user.id} db={db} user={user}/>}</AuthGate>;}
function Workspace({db,user}:{db:SupabaseClient;user:User}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [page,setPage] = useState('This Week');
  const ws=useWorkspace(db);
  const {entries,projects,clients,profile,dirty}=ws;
  const today=todayIn(profile?.timezone||'America/El_Salvador');
  const initialWeek=monday(today);
  const [weekOverride,setWeek] = useState<string|null>(null);
  const week=weekOverride||initialWeek;
  const [selectedClient,setSelectedClient]=useState('');
  const clientId=selectedClient||clients.find(c=>c.id===profile?.preferred_client_id&&!c.archivedAt)?.id||clients.find(c=>!c.archivedAt)?.id||clients[0]?.id||'';
  const clientName=clients.find(c=>c.id===clientId)?.name||'Choose a client';
  const activeProjects=projects.filter(p=>p.clientId===clientId&&!p.archivedAt&&!clients.find(c=>c.id===p.clientId)?.archivedAt);
  const clientEntries=entries.filter(e=>projects.find(p=>p.id===e.project)?.clientId===clientId);
  const [discard,setDiscard]=useState(false);
  const [view,setView] = useState('week');
  const [day,setDay] = useState(0);

  const [detail,setDetail] = useState<{date:string;row:Row}|null>(null);
  const [editor,setEditor] = useState<Editor|null>(null);
  const [entryError,setEntryError] = useState('');
  const [deleting,setDeleting] = useState<string|null>(null);

  const days = Array.from({length:7},(_,i)=>shiftDate(week,i));
  const weekEntries = clientEntries.filter(e=>e.date>=week && e.date<=days[6]);
  const rows = Array.from(new Map(weekEntries.map(e=>{const key=JSON.stringify([e.project,e.description,e.billable]);return [key,{key,project:e.project,description:e.description,billable:e.billable}];})).values());
  const currentWeekEntries = clientEntries.filter(e=>e.date>=initialWeek && e.date<=shiftDate(initialWeek,6));
  const currentMonthEntries = inMonth(clientEntries,today.slice(0,7));
  const selectedDay=days[day];
  const cellEntries=(row:Row,date:string)=>entries.filter(e=>e.project===row.project&&e.description===row.description&&e.billable===row.billable&&e.date===date);
  useEffect(()=>{if(!dirty)return; const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();}; window.addEventListener('beforeunload',warn);return ()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  function updateEntries(next:Entry[]) {ws.updateEntries(next);}
  function startEditor(entry?:Entry, date=selectedDay, row?:Row) {if(ws.saving||ws.retryPending){toast.error('Retry the pending save or reload saved data before editing.');return;}if(!entry&&!activeProjects.length){toast.info('Create an active project to start entering time.');setPage('Projects');return;}setEntryError('');setEditor(entry?{...entry,duration:fmt(entry.minutes)}:{date,project:row?.project||activeProjects[0]?.id||'',description:row?.description||'',billable:row?.billable??true,duration:''});}
  function commitEditor() {
    if(!editor)return;
    try {
      const minutes=parseDuration(editor.duration);
      if(!editor.description.trim())throw new Error('Add a short description of your work.');
      if(!editor.date)throw new Error('Choose a work date.');
      const entry:Entry={id:editor.id||crypto.randomUUID(),project:editor.project,date:editor.date,description:editor.description.trim(),billable:editor.billable,minutes,revision:entries.find(e=>e.id===editor.id)?.revision||0};
      updateEntries(editor.id?entries.map(e=>e.id===editor.id?entry:e):[...entries,entry]);setEditor(null);
      toast.success('Entry updated', {description:'Save your changes to sync them across devices.'});
    } catch(error) {setEntryError((error as Error).message);}
  }
  function openCell(row:Row,date:string) {const list=cellEntries(row,date);if(list.length>1)setDetail({row,date});else startEditor(list[0],date,row);}
  async function saveWeek() {if(await ws.save())toast.success('Saved to Supabase');}
  function moveWeek(offset:number) {setWeek(shiftDate(week,offset*7));}
  function goPage(name:string) {setPage(name);}
  const projectName=(id:string)=>projects.find(p=>p.id===id)?.name||id;
  const renderDay=()=> <div className="day-editor">
    <div className="day-tabs" aria-label="Choose a day">{days.map((d,i)=><button key={d} aria-pressed={day===i} onClick={()=>setDay(i)} className={day===i?'selected':''}><span>{labelDate(d,{weekday:'short'})}</span><strong>{labelDate(d,{day:'numeric'})}</strong><small>{fmt(total(weekEntries.filter(e=>e.date===d)))}</small></button>)}</div>
    <div className="day-heading"><h3>{labelDate(selectedDay,{weekday:'long',month:'long',day:'numeric'})}</h3><Button variant="outline" onClick={()=>startEditor(undefined,selectedDay)}><Plus/>Add entry</Button></div>
    {weekEntries.filter(e=>e.date===selectedDay).length===0?<div className="empty-state"><Clock3/><h3>A little room in your day</h3><p>No hours entered for this date.</p><Button onClick={()=>startEditor(undefined,selectedDay)}><Plus/>Add your first entry</Button></div>:weekEntries.filter(e=>e.date===selectedDay).map(e=><div className="day-entry" key={e.id}><span className="project-mark" style={{background:projects.find(p=>p.id===e.project)?.color}}/><div><strong>{e.description}</strong><p>{projectName(e.project)} <span>· {e.billable?'Billable':'Non-billable'}</span></p></div><strong className="entry-hours">{fmt(e.minutes)}</strong><Button size="icon" variant="ghost" aria-label={`Edit ${e.description}`} onClick={()=>startEditor(e)}><Pencil/></Button></div>)}
    <div className="day-total"><span>Daily total</span><strong>{fmt(total(weekEntries.filter(e=>e.date===selectedDay)))}</strong></div>
  </div>;

  if(ws.loading)return <div className="auth-shell"><Loader2 className="animate-spin"/><p>Loading your saved records…</p></div>;
  if(!profile)return <div className="auth-shell"><div className="auth-card"><h1>Unable to load your workspace</h1><p role="alert">{ws.error}</p><Button onClick={()=>void ws.refresh()}><RefreshCw/>Retry</Button><Button variant="ghost" onClick={()=>void db.auth.signOut()}>Sign out</Button></div></div>;
  return <SidebarProvider style={{'--sidebar-width':'238px'} as React.CSSProperties}>
    <Sidebar className="app-sidebar"><SidebarHeader><button className="brand" onClick={()=>goPage('This Week')}><span className="brand-mark"><Layers3 size={22}/></span><span>Worklog<span className="brand-caption">PERSONAL TIMESHEETS</span></span></button></SidebarHeader>
    <SidebarContent><div className="workspace-label">WORKSPACE</div><SidebarMenu>{navigation.map(({name,icon:Icon})=><SidebarMenuItem key={name}><SidebarMenuButton isActive={page===name} onClick={()=>goPage(name)}><Icon/><span>{name}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>
      <div className="sidebar-client"><span className="eyebrow">CURRENT CLIENT</span><div><span className="client-avatar">{clientName[0]}</span><span><strong>{clientName}</strong><small>Independent work</small></span></div></div>
    </SidebarContent><SidebarFooter><div className="profile"><span className="profile-avatar">YW</span><span><strong>{profile.reporting_name||'Your workspace'}</strong><small title={user.email}>{user.email}</small></span><Button variant="ghost" size="icon" aria-label="Open settings" onClick={()=>goPage('Settings')}><Settings2/></Button></div></SidebarFooter></Sidebar>
    <SidebarInset>
      <header className="topbar"><div className="breadcrumb"><SidebarTrigger className="md:hidden"/><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{page}</strong></div><div className="topbar-actions"><span className="preview-badge">PRIVATE WORKSPACE</span><Button variant="ghost" size="icon" aria-label="Toggle light and dark mode" onClick={()=>setTheme(resolvedTheme==='dark'?'light':'dark')}><Sun className="hidden dark:block"/><Moon className="dark:hidden"/></Button></div></header>
      <main className="workspace">
        {ws.error&&<div className="connection-error" role="alert"><span><CloudOff size={18}/>{ws.error}</span><div><Button variant="outline" onClick={()=>dirty||ws.retryPending?setDiscard(true):void ws.refresh()}>Reload saved data</Button>{ws.retryPending&&<Button disabled={ws.saving} onClick={()=>void saveWeek()}>Retry save</Button>}</div></div>}
        <div className="page-heading"><div><div className="eyebrow">{page==='This Week'?'PERSONAL TIMESHEETS':'YOUR WORKSPACE'}</div><h1>{page==='This Week'?'Your week, at a glance.':page}</h1><p>{page==='This Week'?clientName+' · Weekly hours and daily entries':page==='Projects'?'A little structure for everything you’re working on.':page==='Clients'?'The people and businesses you work with.':page==='Reports'?'From daily work to a clear monthly record.':'Make this workspace your own.'}</p></div>{page==='This Week'?<Button className="primary-action" onClick={()=>startEditor()}><Plus size={18}/>New entry</Button>:null}</div>
        {page==='This Week'&&<>
          <section className="summary-grid" aria-label="Hours summary">
            <div className="summary-card"><div className="summary-title">Current week <span className="summary-icon"><CalendarDays/></span></div><div className="summary-number">{fmt(total(currentWeekEntries))}<span>hrs</span></div><div className="summary-bottom"><span>{labelDate(initialWeek,{month:'short',day:'numeric'})}–{labelDate(shiftDate(initialWeek,6),{day:'numeric'})}</span><span className="metric-pill">{new Set(currentWeekEntries.map(e=>e.date)).size} days logged</span></div></div>
            <div className="summary-card"><div className="summary-title">Current month <span className="summary-icon"><Clock3/></span></div><div className="summary-number">{fmt(total(currentMonthEntries))}<span>hrs</span></div><div className="summary-bottom"><span>{labelDate(today,{month:'long',year:'numeric'})}</span><span>Across {new Set(currentMonthEntries.map(e=>e.project)).size} projects</span></div></div>
            <div className="summary-card billable-card"><div className="summary-title">Billable this week <span className="summary-icon"><Wallet/></span></div><div className="summary-number">{fmt(total(currentWeekEntries.filter(e=>e.billable)))}<span>hrs</span></div><div className="summary-bottom"><span>{total(currentWeekEntries)?Math.round(total(currentWeekEntries.filter(e=>e.billable))/total(currentWeekEntries)*100):0}% of your weekly hours</span><span className="billable-swatch"/></div></div>
          </section>
          <section className="timesheet-panel">
            <div className="timesheet-toolbar"><div className="week-picker"><div className="week-arrows"><Button variant="ghost" size="icon" aria-label="Previous week" onClick={()=>moveWeek(-1)}><ChevronLeft/></Button><Button variant="ghost" size="icon" aria-label="Next week" onClick={()=>moveWeek(1)}><ChevronRight/></Button></div><h2>{labelDate(week,{month:'short',day:'numeric'})} – {labelDate(days[6],{month:week.slice(5,7)!==days[6].slice(5,7)?'short':undefined,day:'numeric'})}<span>{' '}{labelDate(week,{year:'numeric'})}</span></h2><Button variant="outline" size="sm" onClick={()=>{setWeek(initialWeek);setDay(0);}}>This week</Button></div><div className="timesheet-controls"><Select value={clientId} onValueChange={setSelectedClient}><SelectTrigger aria-label="Client"><Building2 size={14}/><SelectValue placeholder="Select client"/></SelectTrigger><SelectContent>{clients.map(c=><SelectItem key={c.id} value={c.id}>{c.name}{c.archivedAt?' (archived)':''}</SelectItem>)}</SelectContent></Select><div className="desktop-toggle"><Tabs value={view} onValueChange={setView}><TabsList aria-label="Timesheet layout"><TabsTrigger value="week"><LayoutGrid/>Week</TabsTrigger><TabsTrigger value="day"><CalendarDays/>Day</TabsTrigger></TabsList></Tabs></div></div></div>
            <div className={view==='week'?'desktop-grid':'hidden'}><Table className="timesheet-table"><TableHeader><TableRow><TableHead className="project-column">Project & task</TableHead>{days.map((d,i)=><TableHead key={d} className={`${i>4?'weekend':''} ${d===today?'highlight-day':''}`}><span>{labelDate(d,{weekday:'short'})}</span><strong>{labelDate(d,{day:'2-digit'})}</strong>{d==='2026-09-18'&&<span className="day-dot"/>}</TableHead>)}<TableHead className="total-column">Total</TableHead></TableRow></TableHeader><TableBody>{rows.length===0&&<TableRow><TableCell colSpan={9}><div className="empty-state"><Clock3/><h3>A fresh week</h3><p>Add a task to start tracking your work.</p><Button onClick={()=>startEditor()}><Plus/>Add your first entry</Button></div></TableCell></TableRow>}{rows.map(row=>{const project=projects.find(p=>p.id===row.project)!;const rowEntries=weekEntries.filter(e=>e.project===row.project&&e.description===row.description&&e.billable===row.billable);return <TableRow key={row.key}><TableCell className="project-column"><div className="row-label"><span className="project-mark" style={{background:project.color}}/><div><strong>{row.description}</strong><span>{project.name}{!row.billable&&<em>Non-billable</em>}</span></div></div></TableCell>{days.map((date,i)=>{const list=cellEntries(row,date);return <TableCell key={date} className={`${i>4?'weekend':''} ${date===today?'highlight-day':''}`}><button className={`time-cell ${list.length?'has-hours':''}`} onClick={()=>openCell(row,date)} aria-label={`${row.description}, ${date}, ${list.length?fmt(total(list)):'no hours'}, ${list.length} entries`}><span>{list.length?fmt(total(list)):'—'}</span>{list.length>1&&<small>{list.length}</small>}</button></TableCell>})}<TableCell className="total-column">{fmt(total(rowEntries))}</TableCell></TableRow>})}</TableBody><TableFooter><TableRow><TableCell className="project-column">Daily totals</TableCell>{days.map(d=><TableCell key={d}>{fmt(total(weekEntries.filter(e=>e.date===d)))}</TableCell>)}<TableCell className="total-column grand-total">{fmt(total(weekEntries))}</TableCell></TableRow></TableFooter></Table></div>
            <div className={view==='day'?'day-view':'mobile-day-view'}>{renderDay()}</div>
            <div className="grid-add"><Button variant="ghost" onClick={()=>startEditor()}><Plus/>Add a task</Button><span>Hours : minutes</span></div>
            <div className="savebar"><div className={ws.error?'save-state error':'save-state'}>{ws.saving?<Loader2 className="animate-spin" size={16}/>:dirty?<Pencil size={15}/>:<Check size={16}/>}<span>{ws.saving?'Saving to Supabase…':ws.retryPending?'Save failed. Your input is preserved.':dirty?'Unsaved changes':ws.savedAt?'Saved at '+ws.savedAt:'All changes saved'}</span></div><div className="save-actions">{dirty&&<Button variant="ghost" disabled={ws.saving} onClick={()=>setDiscard(true)}>Discard changes</Button>}<Button disabled={ws.saving||(!dirty&&!ws.retryPending)} onClick={()=>void saveWeek()}>{ws.retryPending?'Retry save':'Save changes'}</Button></div></div>
          </section>
          <section className="bottom-grid"><div className="breakdown-card"><div className="section-title"><div><h2>Where your time went</h2><p>Project breakdown for the selected week</p></div><span className="subtle-label">{fmt(total(weekEntries))} hrs</span></div><div className="stacked-bar" aria-label="Project distribution">{projects.filter(p=>p.clientId===clientId).map(p=><span key={p.id} style={{background:p.color,width:`${total(weekEntries)?total(weekEntries.filter(e=>e.project===p.id))/total(weekEntries)*100:0}%`}}/>)}</div><div className="project-legend">{projects.filter(p=>p.clientId===clientId).map(p=><div key={p.id}><span className="project-mark" style={{background:p.color}}/><span>{p.name}</span><strong>{fmt(total(weekEntries.filter(e=>e.project===p.id)))}</strong></div>)}</div></div><div className="report-nudge"><span className="report-icon"><FileText/></span><div><h2>A month of work. Ready to share.</h2><p>Bring your hours together in a clean client report.</p><Button variant="link" onClick={()=>goPage('Reports')}>View monthly report <ArrowUpRight/></Button></div></div></section>
          <div className="keyboard-hint"><Keyboard size={15}/><span><kbd>Tab</kbd> move between cells <span>·</span> <kbd>Enter</kbd> open details <span>·</span> Try <strong>2:30</strong> for two and a half hours</span></div>
        </>}
        {(page==='Projects'||page==='Clients')&&<Management kind={page} clients={clients} projects={projects} entries={entries} saveClient={ws.saveClient} saveProject={ws.saveProject}/>}
        {page==='Reports'&&<Reports entries={entries} projects={projects} clients={clients} reportingName={profile.reporting_name} initialMonth={today.slice(0,7)} initialClient={clientId} snapshots={ws.snapshots} dirty={dirty} createSnapshot={ws.snapshot}/>}
        {page==='Settings'&&<Preferences key={profile.reporting_name+profile.timezone+profile.preferred_client_id} profile={profile} clients={clients} save={ws.saveProfile} dirty={dirty||ws.retryPending} signOut={async()=>{const {error}=await db.auth.signOut();if(error)toast.error(error.message);}}/>}
        <footer className="workspace-footer"><span>WORKLOG <span> / </span> PERSONAL TIMESHEETS</span><span>Made for your independent work.</span></footer>
      </main>
    </SidebarInset>
    <Sheet open={!!detail} onOpenChange={open=>{if(!open)setDetail(null);}}><SheetContent className="entry-sheet"><SheetHeader><SheetTitle>Cell details</SheetTitle><SheetDescription>{detail&&`${labelDate(detail.date,{weekday:'long',month:'short',day:'numeric'})} · ${detail.row.description}`}</SheetDescription></SheetHeader><div className="sheet-body"><p className="detail-note">Each entry keeps its own description and duration.</p>{detail&&cellEntries(detail.row,detail.date).map(e=><div className="detail-entry" key={e.id}><div><strong>{e.description}</strong><p>{fmt(e.minutes)} · {e.billable?'Billable':'Non-billable'}</p></div><Button variant="ghost" size="icon" aria-label={`Edit entry ${e.id}`} onClick={()=>{setDetail(null);startEditor(e);}}><Pencil/></Button><Button variant="ghost" size="icon" aria-label={`Delete entry ${e.id}`} onClick={()=>setDeleting(e.id)}><Trash2/></Button></div>)}<Button variant="outline" onClick={()=>{if(detail){startEditor(undefined,detail.date,detail.row);setDetail(null);}}}><Plus/>Add another entry</Button></div></SheetContent></Sheet>
    <Sheet open={!!editor} onOpenChange={open=>{if(!open)setEditor(null);}}><SheetContent className="entry-sheet"><SheetHeader><SheetTitle>{editor?.id?'Edit entry':'New time entry'}</SheetTitle><SheetDescription>{clientName} · Enter hours and minutes.</SheetDescription></SheetHeader>{editor&&<form className="entry-form" onSubmit={e=>{e.preventDefault();commitEditor();}}><div><Label htmlFor="work-date">Work date</Label><Input id="work-date" type="date" required value={editor.date} onChange={e=>setEditor({...editor,date:e.target.value})}/></div><div><Label>Project</Label><Select value={editor.project} onValueChange={project=>setEditor({...editor,project})}><SelectTrigger className="w-full" aria-label="Entry project"><SelectValue/></SelectTrigger><SelectContent>{projects.filter(p=>p.id===editor.project||activeProjects.some(a=>a.id===p.id)).map(p=><SelectItem key={p.id} value={p.id}>{p.name}{p.archivedAt?' (archived)':''}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="description">What did you work on?</Label><Input id="description" required value={editor.description} placeholder="A short description of your work" onChange={e=>setEditor({...editor,description:e.target.value})}/></div><div><Label htmlFor="duration">Duration</Label><Input id="duration" autoFocus placeholder="2:30" value={editor.duration} onChange={e=>setEditor({...editor,duration:e.target.value})}/><p className="input-help">Use 2:30, 2h 30m, or 2.5 hours.</p></div><div className="setting-row"><Label htmlFor="billable">Billable time</Label><Switch id="billable" checked={editor.billable} onCheckedChange={billable=>setEditor({...editor,billable})}/></div>{entryError&&<p role="alert" className="form-error">{entryError}</p>}<div className="entry-actions">{editor.id&&<Button type="button" variant="ghost" className="delete-button" onClick={()=>setDeleting(editor.id!)}><Trash2/>Delete</Button>}<Button type="button" variant="outline" onClick={()=>setEditor(null)}>Cancel</Button><Button type="submit"><Check/>Apply changes</Button></div></form>}</SheetContent></Sheet>
    <AlertDialog open={!!deleting} onOpenChange={open=>{if(!open)setDeleting(null);}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this entry?</AlertDialogTitle><AlertDialogDescription>This removes the individual entry from both the daily and weekly views. Other entries in its cell stay intact.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep entry</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={()=>{try{updateEntries(entries.filter(e=>e.id!==deleting));if(editor?.id===deleting)setEditor(null);setDeleting(null);}catch(e){toast.error(errorMessage(e));}}}>Delete entry</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={discard} onOpenChange={setDiscard}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reload your saved records?</AlertDialogTitle><AlertDialogDescription>This discards unsaved edits. If a save response was lost, the reload will show what reached Supabase. Keep editing to retain your current input.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep my edits</AlertDialogCancel><AlertDialogAction onClick={()=>void ws.refresh()}>Reload saved data</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </SidebarProvider>;
}

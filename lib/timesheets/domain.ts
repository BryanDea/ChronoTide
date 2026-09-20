export type Entry = { id: string; project: string; description: string; date: string; minutes: number; billable: boolean };
export type Project = { id: string; name: string; code: string; color: string };
export const projects: Project[] = [
  { id: 'support', name: 'Platform support', code: 'PS', color: '#6864e8' },
  { id: 'delivery', name: 'Application delivery', code: 'AD', color: '#279985' },
  { id: 'operations', name: 'Client operations', code: 'CO', color: '#c08330' },
];
export function parseDuration(input: string): number {
  const value = input.trim().toLowerCase();
  let minutes: number;
  const colon = /^(\d+):([0-5]\d)$/.exec(value);
  const units = /^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?$/.exec(value);
  if (colon) minutes = Number(colon[1]) * 60 + Number(colon[2]);
  else if (units && (units[1] || units[2])) minutes = Number(units[1] || 0) * 60 + Number(units[2] || 0);
  else if (/^\d+(?:\.\d+)?$/.test(value)) minutes = Number(value) * 60;
  else throw new Error('Enter hours like 2:30, 2h 30m, or 2.5.');
  const rounded = Math.round(minutes);
  if (!Number.isSafeInteger(rounded) || Math.abs(minutes - rounded) > 1e-8 || rounded <= 0) throw new Error('Use a positive duration in whole minutes.');
  return rounded;
}
export function formatDuration(minutes: number): string { return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`; }
export function dateString(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function dateObject(date: string): Date { const [y,m,d] = date.split('-').map(Number); return new Date(y,m-1,d,12); }
export function shiftDate(date: string, count: number): string { const d = dateObject(date); d.setDate(d.getDate()+count); return dateString(d); }
export function monday(date: string): string { const d = dateObject(date); return shiftDate(date,-((d.getDay()+6)%7)); }
export function total(entries: Entry[]): number { return entries.reduce((sum,e)=>sum+e.minutes,0); }
export function inMonth(entries: Entry[], month: string): Entry[] { return entries.filter(e=>e.date.slice(0,7)===month); }
export function labelDate(date: string, options: Intl.DateTimeFormatOptions): string { return dateObject(date).toLocaleDateString('en-US', options); }
export function sampleEntries(start: string): Entry[] {
  const rows = [
    { project:'support', description:'Incident triage & resolution', billable:true, hours:[180,150,120,210,120] },
    { project:'support', description:'Platform health checks', billable:true, hours:[60,60,90,60,60] },
    { project:'delivery', description:'Workflow implementation', billable:true, hours:[150,180,180,120,150] },
    { project:'delivery', description:'Testing & release preparation', billable:true, hours:[60,60,60,90,60] },
    { project:'operations', description:'Planning & documentation', billable:false, hours:[30,30,30,30,60] },
  ];
  const entries: Entry[] = [];
  rows.forEach((r,ri)=>r.hours.forEach((minutes,di)=>entries.push({id:`sample-${ri}-${di}`,project:r.project,description:r.description,billable:r.billable,minutes,date:shiftDate(start,di)})));
  // One deliberately split cell demonstrates preservation of individual records.
  entries[0].minutes = 120;
  entries.push({...entries[0],id:'sample-split',minutes:60});
  return entries;
}

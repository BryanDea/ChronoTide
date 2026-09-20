import type { LiveEntry } from './models';
export type Change = {operation:'upsert'|'delete';id:string;expected_revision:number;project_id?:string;work_date?:string;description?:string;duration_minutes?:number;billable?:boolean};
export function entryChanges(base:LiveEntry[],draft:LiveEntry[]):Change[] {
 const previous=new Map(base.map(e=>[e.id,e]));const current=new Set(draft.map(e=>e.id));
 const changes:Change[]=base.filter(e=>!current.has(e.id)).map(e=>({operation:'delete',id:e.id,expected_revision:e.revision}));
 for(const e of draft){const old=previous.get(e.id);if(old&&old.project===e.project&&old.date===e.date&&old.description===e.description&&old.minutes===e.minutes&&old.billable===e.billable)continue;
 changes.push({operation:'upsert',id:e.id,expected_revision:old?.revision||0,project_id:e.project,work_date:e.date,description:e.description,duration_minutes:e.minutes,billable:e.billable});}
 return changes;
}

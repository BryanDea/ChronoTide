import type { Entry, Project } from './domain';
export type Client = {id:string;name:string;archivedAt:string|null};
export type LiveProject = Project & {clientId:string;archivedAt:string|null};
export type LiveEntry = Entry & {revision:number};
export type Profile = {user_id:string;reporting_name:string;timezone:string;preferred_client_id:string|null};
export type ReportEntry = {id:string;date:string;project_id:string;project:string;description:string;minutes:number;billable:boolean};
export type ReportData = {version:number;reporting_name:string;client_name:string;period:string;entries:ReportEntry[];total_minutes:number};
export type Snapshot = {id:string;period_start:string;client_id:string;project_id:string|null;snapshot:ReportData;sent_at:string};
export type EntryRecord = {id:string;project_id:string;work_date:string;description:string;duration_minutes:number;billable:boolean;revision:number};
export function fromRecord(e:EntryRecord): LiveEntry {return {id:e.id,project:e.project_id,date:e.work_date,description:e.description,minutes:e.duration_minutes,billable:e.billable,revision:e.revision};}

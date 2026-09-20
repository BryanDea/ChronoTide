import type { ReportData } from './models';
import { formatDuration } from './domain.ts';
export function reportFilename(report:ReportData){return `${report.client_name.replace(/[^\p{L}\p{N} _-]/gu,'').trim()||'Client'}_${report.period.slice(5)}${report.period.slice(0,4)}_Timesheets`;}
export function reportCSV(report:ReportData):string {
 const safe=(value:unknown)=>{let s=String(value);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 const rows:unknown[][]=[['Reporting name','Client','Period','Date','Project','Description','Billable','Minutes','Hours (h:mm)'],...report.entries.map(e=>[report.reporting_name,report.client_name,report.period,e.date,e.project,e.description,e.billable?'Yes':'No',e.minutes,formatDuration(e.minutes)]),['','','','','','TOTAL','',report.total_minutes,formatDuration(report.total_minutes)]];
 return '\uFEFF'+rows.map(row=>row.map(safe).join(',')).join('\r\n');
}
export function downloadCSV(report:ReportData){const url=URL.createObjectURL(new Blob([reportCSV(report)],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=reportFilename(report)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export async function buildPDF(report:ReportData,sentAt?:string){
 const [{jsPDF},{default:autoTable}]=await Promise.all([import('jspdf'),import('jspdf-autotable')]);const doc=new jsPDF();
 doc.setFontSize(22);doc.setTextColor('#292638');doc.text('Monthly timesheet',14,21);doc.setFontSize(12);doc.text(doc.splitTextToSize(report.client_name,180),14,32);doc.setFontSize(10);doc.setTextColor('#646477');
 const metadata=`${report.reporting_name} | ${report.period}${sentAt?' | Sent '+sentAt.slice(0,10):''}`;const lines=doc.splitTextToSize(metadata,180);doc.text(lines,14,42);
 autoTable(doc,{startY:48+lines.length*4,head:[['Date','Project / work description','Billable','Hours']],body:report.entries.map(e=>[e.date,e.project+'\n'+e.description,e.billable?'Yes':'No',formatDuration(e.minutes)]),theme:'striped',headStyles:{fillColor:'#5851d8'},styles:{fontSize:9,cellPadding:3,overflow:'linebreak'},columnStyles:{0:{cellWidth:26},2:{cellWidth:18},3:{cellWidth:22,halign:'right'}},margin:{bottom:22},didDrawPage:()=>{doc.setFontSize(9);doc.setTextColor('#777777');doc.text('Hours shown as h:mm. Work dates are calendar dates.',14,287);}});
 const end=(doc as unknown as {lastAutoTable:{finalY:number}}).lastAutoTable?.finalY||60;const byProject=new Map<string,number>();report.entries.forEach(e=>byProject.set(e.project,(byProject.get(e.project)||0)+e.minutes));
 autoTable(doc,{startY:end+10,head:[['Summary','Hours']],body:[...Array.from(byProject).map(([name,min])=>[name,formatDuration(min)]),['Billable',formatDuration(report.entries.filter(e=>e.billable).reduce((s,e)=>s+e.minutes,0))],['Non-billable',formatDuration(report.entries.filter(e=>!e.billable).reduce((s,e)=>s+e.minutes,0))],['Monthly total',formatDuration(report.total_minutes)]],theme:'plain',headStyles:{textColor:'#5851d8'},styles:{fontSize:10},columnStyles:{1:{halign:'right'}}});
 for(let page=1;page<=doc.getNumberOfPages();page++){doc.setPage(page);doc.setFontSize(9);doc.setTextColor('#777777');doc.text(`${page} / ${doc.getNumberOfPages()}`,195,287,{align:'right'});}return doc;
}

export async function downloadPDF(report:ReportData,sentAt?:string){const doc=await buildPDF(report,sentAt);doc.save(reportFilename(report)+'.pdf');}

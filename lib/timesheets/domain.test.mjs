import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration, formatDuration, sampleEntries, total, inMonth, shiftDate, monday } from './domain.ts';

test('accepted input formats resolve to the same integer minutes',()=>{
  for(const value of ['2:30','2h 30m','2.5','150m']) assert.equal(parseDuration(value),150);
  assert.equal(parseDuration('0.1'),6);
  assert.equal(parseDuration('1:01'),61);
  assert.equal(formatDuration(150),'2:30');
});
test('invalid, zero, negative, and fractional-minute inputs are rejected',()=>{
  for(const value of ['','0','-1','2:90','1.001','two','Infinity']) assert.throws(()=>parseDuration(value));
});
test('editing an individual record preserves its sibling and adds only the delta',()=>{
  const entries=sampleEntries('2026-09-14');
  const originalTotal=total(entries);
  const updated=entries.map(e=>e.id==='sample-0-0'?{...e,minutes:150}:e);
  assert.equal(total(updated),originalTotal+30);
  assert.equal(updated.find(e=>e.id==='sample-split').minutes,60);
  assert.equal(updated.length,entries.length);
});
test('calendar operations preserve dates across month and year boundaries',()=>{
  assert.equal(shiftDate('2026-12-31',1),'2027-01-01');
  assert.equal(shiftDate('2028-02-28',1),'2028-02-29');
  assert.equal(monday('2026-10-01'),'2026-09-28');
});
test('a cross-month week attributes each entry to its work month',()=>{
  const entries=sampleEntries('2026-09-28');
  assert.equal(total(inMonth(entries,'2026-09')),24*60);
  assert.equal(total(inMonth(entries,'2026-10')),16*60);
  assert.equal(total(inMonth(entries,'2026-09'))+total(inMonth(entries,'2026-10')),total(entries));
});

const {entryChanges}=await import('./changes.ts');
const {reportCSV,reportFilename,buildPDF}=await import('./reports.ts');
test('entry changes use stable IDs and expected revisions instead of duplicate inserts',()=>{
 const entry={id:'existing',project:'project',date:'2026-09-30',description:'Work',minutes:150,billable:true,revision:3};
 assert.deepEqual(entryChanges([entry],[entry]),[]);
 const change=entryChanges([entry],[{...entry,minutes:180}]);assert.equal(change[0].expected_revision,3);assert.equal(change[0].id,'existing');
 assert.equal(entryChanges([entry],[])[0].operation,'delete');
});
test('CSV escapes descriptions and neutralizes spreadsheet formulas',()=>{
 const report={version:1,client_name:'PegaSupport',reporting_name:'Test',period:'2026-09',total_minutes:150,entries:[{id:'a',date:'2026-09-30',project_id:'p',project:'Support',description:'=HYPERLINK("bad")',billable:true,minutes:150}]};
 assert.equal(reportFilename(report),'PegaSupport_092026_Timesheets');
 assert.match(reportCSV(report),/"'=HYPERLINK\(""bad""\)"/);
 assert.match(reportCSV(report),/"150","2:30"/);
});
test('PDF report produces a nonempty multipage document with long entries',async()=>{
 const report={version:1,client_name:'PegaSupport',reporting_name:'Test Professional',period:'2026-09',total_minutes:15000,entries:Array.from({length:100},(_,i)=>({id:String(i),date:'2026-09-30',project_id:'p',project:'Platform support',description:'Incident investigation and resolution. '+('Long description '.repeat(10)),billable:true,minutes:150}))};
 const doc=await buildPDF(report);assert.ok(doc.getNumberOfPages()>1);assert.ok(doc.output('arraybuffer').byteLength>5000);
});

import { env } from 'cloudflare:workers';
import { demoUnits, demoStaff, demoPlatforms, demoGrants, demoEvents } from './seed';
import type { State, Staff } from './types';
export function db(){ if(!env.DB) throw new Error('資料庫尚未連線');return env.DB; }
export async function seed(){
 const d=db();if(await d.prepare('SELECT value FROM meta WHERE key = ?').bind('seeded').first())return;
 const stmts:D1PreparedStatement[]=[];
 function insert(table:string,columns:string[],rows:unknown[][]){for(let i=0;i<rows.length;i+=8){const chunk=rows.slice(i,i+8);stmts.push(d.prepare(`INSERT OR IGNORE INTO ${table} (${columns.join(',')}) VALUES ${chunk.map(()=>`(${columns.map(()=>'?').join(',')})`).join(',')}`).bind(...chunk.flat()));}}
 insert('units',['id','name','code','color','location'],demoUnits.map(x=>[x.id,x.name,x.code,x.color,x.location]));
 insert('staff',['id','employee_no','name','unit_id','role','level','start_date','status','updated_at','version'],demoStaff.map(x=>[x.id,x.employeeNo,x.name,x.unitId,x.role,x.level,x.startDate,x.status,x.updatedAt,x.version]));
 insert('platforms',['id','name','description','color','icon'],demoPlatforms.map(x=>[x.id,x.name,x.description,x.color,x.icon]));
 insert('grants',['staff_id','platform_id','enabled'],demoGrants.map(x=>[x.staffId,x.platformId,x.enabled]));
 insert('events',['id','staff_id','type','before_json','after_json','effective_date','note','created_at','actor'],demoEvents.map(x=>[x.id,x.staffId,x.type,JSON.stringify(x.before),JSON.stringify(x.after),x.effectiveDate,x.note,x.createdAt,x.actor]));
 stmts.push(d.prepare('INSERT OR IGNORE INTO meta (key,value) VALUES (?,?)').bind('seeded','demo-v1'));
 await d.batch(stmts);
}
export const staffColumns='id,employee_no AS employeeNo,name,unit_id AS unitId,role,level,start_date AS startDate,status,updated_at AS updatedAt,version';
export async function state():Promise<State>{
 await seed();const d=db();const [units,staff,events,platforms,grants,clients]=await d.batch([
 d.prepare('SELECT * FROM units ORDER BY id'),d.prepare(`SELECT ${staffColumns} FROM staff ORDER BY employee_no`),
 d.prepare('SELECT id,staff_id AS staffId,type,before_json,after_json,effective_date AS effectiveDate,note,created_at AS createdAt,actor FROM events ORDER BY effective_date DESC,created_at DESC'),
 d.prepare('SELECT * FROM platforms ORDER BY rowid'),d.prepare('SELECT staff_id AS staffId,platform_id AS platformId,enabled FROM grants'),
 d.prepare('SELECT id,name,key_prefix AS keyPrefix,unit_ids AS unitIds,platform_id AS platformId,enabled,created_at AS createdAt,last_used_at AS lastUsedAt FROM clients ORDER BY created_at DESC')]);
 return {units:units.results,staff:staff.results,events:events.results.map((x:any)=>{const {before_json,after_json,...r}=x;return {...r,before:JSON.parse(before_json),after:JSON.parse(after_json)}}),platforms:platforms.results,grants:grants.results,clients:clients.results.map((x:any)=>({...x,unitIds:JSON.parse(x.unitIds)}))} as State;
}
export async function findStaff(id:string){return db().prepare(`SELECT ${staffColumns} FROM staff WHERE id=?`).bind(id).first<Staff>();}
export async function hashKey(key:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}

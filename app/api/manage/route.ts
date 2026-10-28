import { getChatGPTUser } from '@/app/chatgpt-auth';
import {isAdmin} from '@/lib/access';
import { db, seed, findStaff, hashKey } from '@/lib/store';
import { today, type Staff } from '@/lib/types';
const fail=(error:string,status=400)=>Response.json({error},{status});
function text(v:unknown,max=100){return typeof v==='string'?v.trim().slice(0,max):'';}
function date(v:unknown){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v&&v<=today();}
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!user)return fail('請先登入',401);
 if(!isAdmin(user))return fail('分享模式僅供瀏覽，管理操作限授權管理員',403);
 if(req.headers.get('origin')!==new URL(req.url).origin)return fail('請從資料中心操作',403);
 try{
 await seed();const raw=await req.json();if(!raw||typeof raw!=='object'||Array.isArray(raw))return fail('請提供有效的操作資料');const b=raw as Record<string,any>;const d=db();const now=new Date().toISOString();
 const actor=user.userId;
 if(b.action==='client.create'){
 const name=text(b.name,60);const ids=Array.isArray(b.unitIds)?[...new Set(b.unitIds as string[])]:[];
 const us=await d.prepare('SELECT id FROM units').all<{id:string}>();if(!name||!ids.length||ids.some(id=>!us.results.some(u=>u.id===id)))return fail('請填寫平台名稱並選擇可讀取的單位');
 const pid=b.platformId||null;if(pid&&!await d.prepare('SELECT id FROM platforms WHERE id=?').bind(pid).first())return fail('平台不存在');
 const key='nh_'+Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
 await d.prepare('INSERT INTO clients (id,name,key_hash,key_prefix,unit_ids,platform_id,enabled,created_at) VALUES (?,?,?,?,?,?,1,?)').bind(crypto.randomUUID(),name,await hashKey(key),key.slice(0,11),JSON.stringify(ids),pid,now).run();return Response.json({ok:true,key});
 }
 if(b.action==='client.revoke'){const r=await d.prepare('UPDATE clients SET enabled=0 WHERE id=? AND enabled=1').bind(text(b.id)).run();return r.meta.changes?Response.json({ok:true}):fail('找不到有效的金鑰',404);}
 if(b.action==='platform.create'){
 const name=text(b.name,40),description=text(b.description,120);if(!name)return fail('請輸入平台名稱');
 if(await d.prepare('SELECT id FROM platforms WHERE name=?').bind(name).first())return fail('已有同名平台',409);
 const id=crypto.randomUUID();await d.prepare('INSERT INTO platforms (id,name,description,color,icon) VALUES (?,?,?,?,?)').bind(id,name,description,'#358c7e','PanelsTopLeft').run();return Response.json({ok:true,id});
 }
 if(b.action==='staff.create'){
 const name=text(b.name,30),employeeNo=text(b.employeeNo,30).toUpperCase(),unitId=text(b.unitId),role=text(b.role),level=text(b.level);
 if(!name||!/^[-A-Z0-9_]{2,30}$/.test(employeeNo)||!['臨床護理師','護理主管'].includes(role)||!['N0','N1','N2','N3','N4'].includes(level)||!date(b.startDate))return fail('請確認姓名、員編、職務、分級及到職日期（不可晚於今天）');
 if(!await d.prepare('SELECT id FROM units WHERE id=?').bind(unitId).first())return fail('單位不存在');
 if(await d.prepare('SELECT id FROM staff WHERE employee_no=?').bind(employeeNo).first())return fail('員工編號已存在',409);
 const s:Staff={id:crypto.randomUUID(),name,employeeNo,unitId,role,level,startDate:b.startDate,status:'在職',version:1,updatedAt:now};
 await d.batch([d.prepare('INSERT INTO staff (id,employee_no,name,unit_id,role,level,start_date,status,updated_at,version) VALUES (?,?,?,?,?,?,?,?,?,1)').bind(s.id,s.employeeNo,s.name,s.unitId,s.role,s.level,s.startDate,s.status,now),d.prepare('INSERT INTO events (id,staff_id,type,before_json,after_json,effective_date,note,created_at,actor) VALUES (?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),s.id,'新進','{}',JSON.stringify(s),s.startDate,text(b.note,300),now,actor)]);return Response.json({ok:true,id:s.id});
 }
 if(!['staff.edit','staff.transfer','staff.status','staff.grants'].includes(b.action))return fail('不支援的操作');
 const prev=await findStaff(text(b.id));if(!prev)return fail('找不到人員',404);if(b.version!==prev.version)return fail('資料已被更新，請重新載入後再操作',409);
 const next={...prev,version:prev.version+1,updatedAt:now};let type='資料更新';let effectiveDate=today();let platformIds:string[]=[];
 if(b.action==='staff.edit'){
 const name=text(b.name,30),role=text(b.role),level=text(b.level);if(!name||!['臨床護理師','護理主管'].includes(role)||!['N0','N1','N2','N3','N4'].includes(level))return fail('請確認姓名、職務及分級');next.name=name;next.role=role;next.level=level;
 }else if(b.action==='staff.transfer'){
 if(prev.status!=='在職')return fail('僅在職人員可辦理轉調');if(b.unitId===prev.unitId)return fail('請選擇不同的轉入單位');
 if(!await d.prepare('SELECT id FROM units WHERE id=?').bind(text(b.unitId)).first())return fail('單位不存在');next.unitId=b.unitId;type='轉調';effectiveDate=b.effectiveDate;
 }else if(b.action==='staff.status'){
 if(!['在職','留職停薪','離職'].includes(b.status)||b.status===prev.status)return fail('請選擇不同的人員狀態');next.status=b.status;type=b.status==='在職'?'復職':b.status;effectiveDate=b.effectiveDate;
 }else{
 if(prev.status!=='在職')return fail('僅在職人員可啟用平台');
 const ps=await d.prepare('SELECT id FROM platforms').all<{id:string}>();platformIds=Array.isArray(b.platformIds)?[...new Set(b.platformIds as string[])]:[];if(platformIds.some(id=>!ps.results.some(p=>p.id===id)))return fail('平台不存在');type='平台資格';
 }
 if(!date(effectiveDate)||effectiveDate<prev.startDate)return fail('生效日期須為到職日之後，且不可晚於今天');
 if(['staff.transfer','staff.status'].includes(b.action)){
 const last=await d.prepare("SELECT MAX(effective_date) AS latest FROM events WHERE staff_id=? AND type IN ('新進','轉調','離職','留職停薪','復職')").bind(prev.id).first<{latest:string}>();if(last?.latest&&effectiveDate<last.latest)return fail('生效日期不可早於最近一次人員異動');
 }
 const eventBefore=b.action==='staff.grants'?{...prev,platformIds:(await d.prepare('SELECT platform_id FROM grants WHERE staff_id=? AND enabled=1').bind(prev.id).all<{platform_id:string}>()).results.map(x=>x.platform_id)}:prev;
 const eventAfter=b.action==='staff.grants'?{...next,platformIds}:next;
 const eventId=crypto.randomUUID();
 const stmts=[d.prepare('INSERT INTO events (id,staff_id,type,before_json,after_json,effective_date,note,created_at,actor) SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM staff WHERE id=? AND version=?)').bind(eventId,prev.id,type,JSON.stringify(eventBefore),JSON.stringify(eventAfter),effectiveDate,text(b.note,300),now,actor,prev.id,prev.version),d.prepare('UPDATE staff SET name=?,unit_id=?,role=?,level=?,status=?,updated_at=?,version=? WHERE id=? AND version=? AND EXISTS (SELECT 1 FROM events WHERE id=?)').bind(next.name,next.unitId,next.role,next.level,next.status,now,next.version,next.id,prev.version,eventId)];
 if(b.action==='staff.grants'||next.status!=='在職'){
 stmts.push(d.prepare('UPDATE grants SET enabled=0 WHERE staff_id=? AND EXISTS (SELECT 1 FROM events WHERE id=?)').bind(prev.id,eventId));
 for(const pid of platformIds)stmts.push(d.prepare('INSERT INTO grants (staff_id,platform_id,enabled) SELECT ?,?,1 WHERE EXISTS (SELECT 1 FROM events WHERE id=?) ON CONFLICT(staff_id,platform_id) DO UPDATE SET enabled=1').bind(prev.id,pid,eventId));
 }
 const results=await d.batch(stmts);if(!results[0].meta.changes)return fail('資料已被更新，請重新載入',409);return Response.json({ok:true});
 }catch(e){console.error(e);return fail('操作未完成，請檢查資料或重新載入後再試',500);}
}

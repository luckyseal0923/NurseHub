import { db, staffColumns } from '@/lib/store';
import { apiScope, apiJson } from '@/lib/api';
export async function GET(req:Request){try{
 const scope=await apiScope(req);if(!scope)return apiJson({error:'invalid_api_key'},401);
 const url=new URL(req.url),unit=url.searchParams.get('unitId'),q=url.searchParams.get('q')?.slice(0,80)||'';
 if(unit&&!scope.unitIds.includes(unit))return apiJson({error:'unit_out_of_scope'},403);
 const offset=Number(url.searchParams.get('offset')||0),limit=Number(url.searchParams.get('limit')||100);
 if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(limit)||limit<1||limit>100)return apiJson({error:'invalid_pagination'},400);
 const ids=unit?[unit]:scope.unitIds;const values:unknown[]=[...ids];
 let where=`status='在職' AND unit_id IN (${ids.map(()=>'?').join(',')})`;
 if(q){where+=' AND (name LIKE ? OR employee_no LIKE ?)';values.push(`%${q}%`,`%${q}%`);}
 if(scope.platformId){where+=' AND EXISTS (SELECT 1 FROM grants g WHERE g.staff_id=staff.id AND g.platform_id=? AND g.enabled=1)';values.push(scope.platformId);}
 const d=db();const [rows,count]=await d.batch([d.prepare(`SELECT ${staffColumns} FROM staff WHERE ${where} ORDER BY employee_no LIMIT ? OFFSET ?`).bind(...values,limit,offset),d.prepare(`SELECT COUNT(*) AS total FROM staff WHERE ${where}`).bind(...values)]);
 return apiJson({data:rows.results,total:(count.results[0] as any).total,limit,offset,apiVersion:'v1',generatedAt:new Date().toISOString()});
 }catch(e){console.error(e);return apiJson({error:'service_unavailable'},503);}}

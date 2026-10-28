import { db, hashKey } from './store';
export type Scope={id:string;unitIds:string[];platformId:string|null};
export async function apiScope(req:Request):Promise<Scope|null>{
 const key=req.headers.get('X-API-Key')||req.headers.get('Authorization')?.replace(/^Bearer\s+/i,'');if(!key||key.length>200)return null;
 const c=await db().prepare('SELECT id,unit_ids,platform_id FROM clients WHERE key_hash=? AND enabled=1').bind(await hashKey(key)).first<{id:string;unit_ids:string;platform_id:string|null}>();if(!c)return null;
 await db().prepare('UPDATE clients SET last_used_at=? WHERE id=?').bind(new Date().toISOString(),c.id).run();return {id:c.id,unitIds:JSON.parse(c.unit_ids),platformId:c.platform_id};
}
export const apiJson=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});

/// <reference types="vite/client" />
import {env} from 'cloudflare:workers';
import type {ChatGPTUser} from '@/app/chatgpt-auth';
export function isAdmin(user:ChatGPTUser|null){
 if(!user)return false;
 if(import.meta.env.DEV&&user.userId==='local_seedy')return true;
 const allowed=((env as unknown as Record<string,string|undefined>).NURSEHUB_ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 return allowed.includes(user.email.toLowerCase());
}

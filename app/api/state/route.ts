import { state } from '@/lib/store';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import {isAdmin} from '@/lib/access';
import {publicDemo} from '@/lib/seed';
export async function GET(){const user=await getChatGPTUser();if(!isAdmin(user))return Response.json(publicDemo,{headers:{'Cache-Control':'private, no-store'}});try{return Response.json(await state(),{headers:{'Cache-Control':'private, no-store'}});}catch(e){console.error(e);return Response.json({error:'資料載入失敗，請稍後重試'},{status:500});}}

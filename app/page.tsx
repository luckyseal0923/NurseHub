import Hub from './hub';
import { getChatGPTUser } from './chatgpt-auth';
import {isAdmin} from '@/lib/access';
export const dynamic='force-dynamic';
export default async function Home(){const user=await getChatGPTUser();return <Hub canEdit={isAdmin(user)}/>;}

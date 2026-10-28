export type Unit = { id:string; name:string; code:string; color:string; location:string };
export type Staff = { id:string; employeeNo:string; name:string; unitId:string; role:string; level:string; startDate:string; status:string; updatedAt:string; version:number };
export type Change = { id:string; staffId:string; type:string; before:Partial<Staff>; after:Partial<Staff>; effectiveDate:string; note:string; createdAt:string; actor:string };
export type Platform = { id:string; name:string; description:string; color:string; icon:string };
export type Grant = { staffId:string; platformId:string; enabled:number };
export type Client = { id:string; name:string; keyPrefix:string; unitIds:string[]; platformId:string|null; enabled:number; createdAt:string; lastUsedAt:string|null };
export type State = { units:Unit[]; staff:Staff[]; events:Change[]; platforms:Platform[]; grants:Grant[]; clients:Client[] };
export const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei'}).format(new Date());

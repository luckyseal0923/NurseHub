import type { Unit, Staff, Platform, Change, Grant } from './types';
export const demoUnits:Unit[] = [
 {id:'U01',name:'內科病房',code:'MED',color:'#37968b',location:'醫療大樓 6F'},
 {id:'U02',name:'外科病房',code:'SUR',color:'#668cc0',location:'醫療大樓 7F'},
 {id:'U03',name:'加護病房',code:'ICU',color:'#9a80bd',location:'醫療大樓 3F'},
 {id:'U04',name:'急診室',code:'ER',color:'#d89b65',location:'醫療大樓 1F'},
 {id:'U05',name:'婦產科病房',code:'OBS',color:'#c482a0',location:'醫療大樓 5F'},
 {id:'U06',name:'兒科病房',code:'PED',color:'#69a2a6',location:'醫療大樓 8F'}
];
const names = ['陳雅涵','林怡君','黃詩涵','張惠雯','李佳蓉','王品妤','吳思穎','劉宛庭','蔡承恩','楊子晴','許淑芬','鄭雅婷','謝佳穎','洪佩珊','郭映彤','曾郁雯','邱冠宇','廖婉如','賴欣儀','徐庭瑄','周美玲','葉書妤','蘇怡安','莊凱翔','呂佳欣','江語柔','何佩蓉','蕭芷涵','羅宇軒','高筱雯','潘麗華','簡詩芸','朱俞安','鍾昀潔','游柏翰','彭心怡','詹雅筑','胡婉婷','施宜蓁','沈昱辰','余慧娟','盧芷晴','杜家妤','梁舒涵','趙子睿','顏品萱','柯孟潔','翁涵瑜','魏佳恩','孫庭安','戴淑惠','范怡萱','宋彥廷','方雅雯','鄧昕妤','石宛蓉','侯欣妍','夏以柔','白承翰','田若晴'];
export const demoStaff:Staff[] = names.map((name,i)=>({id:`DEMO-N${String(i+1).padStart(3,'0')}`,employeeNo:`N${String(i+1).padStart(4,'0')}`,name,unitId:demoUnits[Math.floor(i/10)].id,role:i%10===0?'護理主管':'臨床護理師',level:i%10===0?'N4':['N1','N2','N2','N3','N1','N3','N2','N4','N0'][i%10-1],startDate:i%10===9?'2026-10-01':`${2015+i%10}-${String(i%12+1).padStart(2,'0')}-${String(i%23+1).padStart(2,'0')}`,status:'在職',updatedAt:'2026-10-28T01:00:00.000Z',version:1}));
export const demoPlatforms:Platform[] = [
 {id:'education',name:'護理教育訓練',description:'課程指派、到課與學習紀錄',color:'#358c7e',icon:'GraduationCap'},
 {id:'competency',name:'臨床能力認證',description:'能力分級與認證人員清冊',color:'#7d80b8',icon:'BadgeCheck'},
 {id:'onboarding',name:'新人培育計畫',description:'新進人員與臨床導師培育',color:'#bf8e5c',icon:'Sprout'},
 {id:'management',name:'單位管理平台',description:'單位主管與團隊管理資格',color:'#658db5',icon:'PanelsTopLeft'}
];
export const demoGrants:Grant[] = demoStaff.flatMap((s,i)=>demoPlatforms.filter(p=>p.id==='education'||p.id==='competency'||(p.id==='onboarding'&&i%10===9)||(p.id==='management'&&s.role==='護理主管')).map(p=>({staffId:s.id,platformId:p.id,enabled:1})));
export const demoEvents:Change[] = [9,19,29,39,49,59].map((i,j)=>({id:`demo-join-${j}`,staffId:demoStaff[i].id,type:'新進',before:{},after:demoStaff[i],effectiveDate:'2026-10-01',note:'Demo：新進護理人員建檔',createdAt:`2026-10-01T0${j+1}:00:00.000Z`,actor:'Demo 管理員'}));
// Public sharing uses a fixed fictitious snapshot, never the administrator's live database.
export const publicDemo={units:demoUnits,staff:demoStaff,events:[...demoEvents].reverse(),platforms:demoPlatforms,grants:demoGrants,clients:[]};

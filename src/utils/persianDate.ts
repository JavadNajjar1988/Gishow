import {toGregorian,toJalaali,isValidJalaaliDate} from 'jalaali-js';
export const latinDigits=(s:string)=>s.replace(/[۰-۹٠-٩]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.includes(c)?'۰۱۲۳۴۵۶۷۸۹'.indexOf(c):'٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
export function persianDateToISO(date:string,time:string):string {
  const match=latinDigits(date).match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  const clock=latinDigits(time).match(/^(\d{2}):(\d{2})$/);
  if(!match || !clock)throw new Error('تاریخ و ساعت را کامل وارد کنید.');
  const [y,m,d]=match.slice(1).map(Number),[h,min]=clock.slice(1).map(Number);
  if(y<1300 || y>1500 || !isValidJalaaliDate(y,m,d) || h>23 || min>59)throw new Error('تاریخ یا ساعت معتبر نیست.');
  const {gy,gm,gd}=toGregorian(y,m,d);
  const target=Date.UTC(gy,gm-1,gd,h,min);
  let guess=target,offset=0;
  for(let i=0;i<3;i++) {
    const zone=new Intl.DateTimeFormat('en',{timeZone:'Asia/Tehran',timeZoneName:'longOffset'}).formatToParts(new Date(guess)).find(p=>p.type==='timeZoneName')!.value;
    const z=zone.match(/GMT([+-])(\d{2}):(\d{2})/)!;
    offset=(Number(z[2])*60+Number(z[3]))*(z[1]==='+'?1:-1);guess=target-offset*60000;
  }
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(guess));
  const get=(k:string)=>Number(parts.find(p=>p.type===k)?.value);
  if(get('year')!==gy || get('month')!==gm || get('day')!==gd || get('hour')!==h || get('minute')!==min)throw new Error('این ساعت در تاریخ انتخاب‌شده وجود ندارد.');
  const pad=(v:number)=>String(v).padStart(2,'0');
  return `${gy}-${pad(gm)}-${pad(gd)}T${pad(h)}:${pad(min)}:00${offset<0?'-':'+'}${pad(Math.floor(Math.abs(offset)/60))}:${pad(Math.abs(offset)%60)}`;
}
export function todayPersian() {
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tehran',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date());
  const get=(k:string)=>Number(parts.find(p=>p.type===k)?.value);
  return toJalaali(get('year'),get('month'),get('day'));
}

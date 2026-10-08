import {Seat,PartOfSalon} from '../types';
export function buildSeatLayout(seats:Seat[],shape:PartOfSalon['shape']='straight',aisles=0,aisleAfter?:number[]){
 const rows=[...new Set(seats.map(s=>s.row))].sort((a,b)=>a-b);
 const min=Math.min(...seats.map(s=>s.number),1),max=Math.max(...seats.map(s=>s.number),1);
 const count=max-min+1,breaks=Math.min(Math.max(0,aisles),Math.max(0,count-1),3);
 const pitch=42,margin=50,gaps=aisleAfter?.filter(n=>n>=min&&n<max).sort((a,b)=>a-b);
 const positions=seats.map(seat=>{
   const column=seat.number-min,row=rows.indexOf(seat.row),offset=column-(count-1)/2;
   const aisle=gaps?gaps.filter(n=>seat.number>n).length:Math.min(breaks,Math.floor(column/(count/(breaks+1))));
   const curve=shape==='arc'?Math.pow(offset/Math.max(1,count/2),2)*32:shape==='angled_left'?-offset/Math.max(1,count/2)*32:shape==='angled_right'?offset/Math.max(1,count/2)*32:0;
   return {seat,x:margin+column*pitch+aisle*28,y:60+row*52+curve,rotation:shape==='arc'?offset/Math.max(1,count/2)*14:0};
 });
 return {rows,positions,width:Math.max(300,margin*2+count*pitch+(gaps?.length??breaks)*28),height:Math.max(180,rows.length*52+140)};
}


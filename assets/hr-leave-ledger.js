(function(){
 const RULES='bombhr-leave-rules-v175',LEDGER='bombhr-employee-leave-ledger-v175',EVENTS='bombhr-demo-events',PAYROLL='bombhr-payroll-adjustments-v123';
 const defaults=[
  {id:'annual',name:'年假／特休',quota:7,unit:'天',mode:'balance',validMonths:12,payrollRate:0,enabled:true},
  {id:'travel',name:'旅遊假',quota:7,unit:'天',mode:'fixed',fixedDays:7,validMonths:12,payrollRate:0,enabled:true},
  {id:'marriage',name:'婚假',quota:8,unit:'天',mode:'balance',validMonths:3,payrollRate:0,enabled:true},
  {id:'sick',name:'病假',quota:30,unit:'天',mode:'balance',validMonths:12,payrollRate:0.5,enabled:true},
  {id:'personal',name:'事假',quota:14,unit:'天',mode:'balance',validMonths:12,payrollRate:1,enabled:true},
  {id:'bereavement',name:'喪假',quota:8,unit:'天',mode:'balance',validMonths:3,payrollRate:0,enabled:true}
 ];
 const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return JSON.parse(JSON.stringify(f))}};
 const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
 const rules=()=>read(RULES,defaults);
 if(!localStorage.getItem(RULES))write(RULES,defaults);
 function days(value){const n=parseFloat(String(value||'').match(/[\d.]+/)?.[0]||0);return n>0?n:0}
 function ruleFor(type){return rules().find(r=>r.enabled!==false&&(r.name===type||type?.includes(r.name)||r.name.includes(type||'')))}
 function account(employeeId,type){const r=ruleFor(type),all=read(LEDGER,{}),key=r?.id||type;all[employeeId]||(all[employeeId]={});all[employeeId][key]||(all[employeeId][key]={used:0,transactions:[],entitlementDate:null});return {r,all,key,item:all[employeeId][key]}}
 function remaining(employeeId,type){const {r,item}=account(employeeId,type);return r?Math.max(0,Number(r.quota||0)-Number(item.used||0)):Infinity}
 function validate(employeeId,type,requested,startDate,entitlementDate){const d=days(requested),{r,item}=account(employeeId,type);if(!r)return {ok:true,days:d,remaining:Infinity};if(!r.enabled)return {ok:false,message:`${type}目前未啟用`};if(r.mode==='fixed'&&d!==Number(r.fixedDays||r.quota))return {ok:false,message:`${r.name}每次必須一次申請 ${r.fixedDays||r.quota} 天，不能拆分使用`};const entitlement=entitlementDate||item.entitlementDate;if(r.id==='marriage'&&!entitlement)return {ok:false,message:'婚假請填寫結婚登記日，系統才能檢查 3 個月使用期限'};if(entitlement&&r.validMonths){const expiry=new Date(entitlement);expiry.setMonth(expiry.getMonth()+Number(r.validMonths));if(new Date(startDate)>expiry)return {ok:false,message:`${r.name}須於資格日起 ${r.validMonths} 個月內使用完畢（期限 ${expiry.toLocaleDateString('zh-TW')}）`}}const left=remaining(employeeId,type);if(d>left)return {ok:false,message:`${r.name}剩餘 ${left} 天，本次申請 ${d} 天，額度不足`};return {ok:true,days:d,remaining:left}}
 function addPayroll(event,r,d){if(!r?.payrollRate)return;const all=read(PAYROLL,{}),items=all[event.employeeId]||(all[event.employeeId]=[]),source=`LEAVE-${event.id||event.eventId}`;if(items.some(x=>x.eventId===source))return;const daily=Number(event.dailyWage||1000),amount=Math.round(daily*d*Number(r.payrollRate));items.push({name:`${r.name}薪資扣款`,type:'扣款',amount,note:`核准 ${d} 天・依假別規則自動連動`,usage:'本月自動計薪',operator:event.reviewer||'假勤規則引擎',time:new Date().toLocaleString('zh-TW',{hour12:false}),eventId:source});write(PAYROLL,all)}
 function approve(event){if(event.subtype!=='leave')return {ok:true};const type=event.leaveType||String(event.title||'').replace(/申請$/,''),d=Number(event.leaveDays)||days(event.duration),txid=event.id||event.eventId,current=account(event.employeeId,type);if(current.item.transactions.some(x=>x.id===txid))return {ok:true,duplicate:true,remaining:remaining(event.employeeId,type)};const check=validate(event.employeeId,type,d,event.period?.split('–')[0],event.entitlementDate);if(!check.ok)return check;const {r,all,item}=account(event.employeeId,type);if(event.entitlementDate)item.entitlementDate=event.entitlementDate;item.used=Number(item.used||0)+d;item.transactions.push({id:txid,days:d,type,date:new Date().toISOString(),period:event.period||'',status:'approved'});write(LEDGER,all);addPayroll(event,r,d);return {ok:true,remaining:remaining(event.employeeId,type)}}
 function summary(employeeId){return rules().filter(r=>r.enabled!==false).map(r=>({rule:r,remaining:remaining(employeeId,r.name),used:account(employeeId,r.name).item.used||0}))}
 function attendanceSummary(employeeId){const list=read(EVENTS,[]).filter(e=>e.employeeId===employeeId&&e.category==='attendance'),late=list.filter(e=>e.action==='late');return {lateCount:late.length,lateMinutes:late.reduce((n,e)=>n+Number(e.lateMinutes||0),0),deduction:late.reduce((n,e)=>n+Number(e.deduction||0),0)}}
 window.BOMBHR_HR_LEDGER={keys:{RULES,LEDGER,EVENTS,PAYROLL},defaults,rules,saveRules:v=>write(RULES,v),days,validate,approve,remaining,summary,attendanceSummary};
})();

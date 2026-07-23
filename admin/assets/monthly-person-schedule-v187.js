(function(){
 'use strict';
 const SCHEDULE_KEY='bombhr-schedules-v176',EVENT_KEY='bombhr-demo-events';
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const iso=(year,month,day)=>`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(e){return fallback}};
 const parseDays=(value,max)=>{
   const raw=String(value||'').trim();
   if(!raw)return {days:[],invalid:[]};
   const tokens=raw.split(/[.,、，\s;；]+/).filter(Boolean),invalid=[],days=[];
   tokens.forEach(token=>{const day=Number(token);if(!Number.isInteger(day)||day<1||day>max)invalid.push(token);else if(!days.includes(day))days.push(day)});
   return {days:days.sort((a,b)=>a-b),invalid};
 };
 const ruleByCode=(ledger,code)=>{
   const map={年:'annual',旅:'travel',喪:'bereavement',婚:'marriage',病:'sick',事:'personal'};
   return ledger?.rules().find(rule=>rule.id===map[code]);
 };
 const buildMonthRows=(year,month,max,employee,occupied,codeNames)=>Array.from({length:max},(_,index)=>{
   const day=index+1,code=occupied.get(day)||'1',work=code==='1';
   return {date:iso(year,month,day),employeeId:employee.id,employeeName:employee.name,department:employee.department,start:work?'09:00':'',end:work?'18:00':'',code,site:'台中總公司',note:work?'整月快速輸入：正常上班':`整月快速輸入：${codeNames.get(code)||code}`};
 });
 const currentMonth=()=>{
   const cursor=typeof scheduleCursor!=='undefined'?scheduleCursor:new Date();
   return {year:cursor.getFullYear(),month:cursor.getMonth()+1,max:new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate()};
 };
 function fields(){
   const codes=window.BOMBHR_SCHEDULING?.scheduleCodes?.()||[{code:'休',name:'休假'},{code:'年',name:'年假'}];
   return codes.filter(item=>item.code!=='1');
 }
 function values(max){
   return fields().map(item=>({item,...parseDays(document.querySelector(`[data-monthly-code="${CSS.escape(item.code)}"]`)?.value,max)}));
 }
 function preview(max){
   const box=document.getElementById('monthlyPersonPreview');if(!box)return;
   const list=values(max),used=new Map(),conflicts=[];
   list.forEach(group=>group.days.forEach(day=>{if(used.has(day))conflicts.push(`${day} 日同時填在「${used.get(day)}」與「${group.item.code}」`);else used.set(day,group.item.code)}));
   const invalid=list.flatMap(group=>group.invalid.map(value=>`${group.item.code}：${value}`));
   box.innerHTML=list.filter(group=>group.days.length).map(group=>`<span>${esc(group.item.name)}：${group.days.join('、')} 日</span>`).join('')+
     conflicts.map(text=>`<span class="danger">${esc(text)}</span>`).join('')+
     invalid.map(text=>`<span class="danger">無效日期 ${esc(text)}（本月 1～${max} 日）</span>`).join('');
 }
 function makeLeaveEvent(employee,rule,dates){
   const id=`MONTH-LEAVE-${employee.id}-${rule.id}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
   return {id,eventId:id,category:'approval',subtype:'leave',title:`${rule.name}申請`,leaveType:rule.name,employee:employee.name,employeeId:employee.id,department:employee.department,dates,period:`${dates[0]}–${dates[dates.length-1]}`,duration:`${dates.length} 天`,leaveDays:dates.length,status:'approved',statusText:'已核准',source:'monthly-person-schedule',reason:'由整月員工排班快速輸入',reviewer:currentProfile().name,reviewerId:currentProfile().id,reviewerRole:currentProfile().label||currentRole(),reviewerDepartment:currentProfile().department||'—',reviewedAt:new Date().toISOString(),submitted:new Date().toLocaleString('zh-TW',{hour12:false})};
 }
 function openBatch(button){
   const employee={id:button.dataset.employeeId,name:button.dataset.employeeName,department:button.dataset.employeeDepartment||'—'};
   const {year,month,max}=currentMonth(),codeFields=fields();
   const body=`<div class="monthly-person-example"><b>${year} 年 ${month} 月整月快速輸入</b><br>同一欄可輸入：04.08.13.18，或用逗號、空格分隔；系統會自動套入目前月份。</div><div class="monthly-person-grid">${codeFields.map(item=>`<label class="monthly-person-field"><span><i>${esc(item.code)}</i>${esc(item.name)}</span><input class="form-control" data-monthly-code="${esc(item.code)}" inputmode="numeric" placeholder="${item.code==='休'?'04.08.13.18.19.24.25.30':item.code==='年'?'23.29':'輸入日期'}"><small>可輸入 1～${max} 日</small></label>`).join('')}</div><div class="monthly-person-preview" id="monthlyPersonPreview"></div><p class="form-error" id="monthlyPersonError"></p>`;
   openModal('員工整月排班快速輸入',`${employee.name}・${employee.id}・${employee.department}`,body,`<button class="secondary-btn" id="useRangeLeave">改用單日／日期區間</button><button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="applyMonthlyPerson">套用到 ${month} 月班表</button>`);
   document.querySelectorAll('[data-monthly-code]').forEach(input=>input.addEventListener('input',()=>preview(max)));
   document.getElementById('useRangeLeave').onclick=()=>{closeModal();setTimeout(()=>window.BOMBHR_SCHEDULING.quickLeaveModal(button),0)};
   document.getElementById('applyMonthlyPerson').onclick=()=>{
     const groups=values(max),error=document.getElementById('monthlyPersonError'),occupied=new Map();
     error.textContent='';
     if(groups.some(group=>group.invalid.length)){error.textContent=`日期只能輸入 1～${max}，請修正紅色提示`;return}
     for(const group of groups)for(const day of group.days){if(occupied.has(day)){error.textContent=`${day} 日重複填在「${occupied.get(day)}」與「${group.item.code}」，請保留其中一個`;return}occupied.set(day,group.item.code)}
     if(!occupied.size){error.textContent='請至少輸入一個日期';return}
     const ledger=window.BOMBHR_HR_LEDGER,leavePlans=[];
     for(const group of groups.filter(item=>item.days.length&&item.item.code!=='休')){
       const rule=ruleByCode(ledger,group.item.code);
       if(!rule)continue;
       const dates=group.days.map(day=>iso(year,month,day)),event=makeLeaveEvent(employee,rule,dates);
       const check=ledger.validate(employee.id,rule.name,dates.length,dates[0],'');
       if(!check.ok){error.textContent=check.message;return}
       leavePlans.push({event,rule});
     }
     for(const plan of leavePlans){const result=ledger.approve(plan.event);if(!result.ok){error.textContent=result.message;return}}
     const monthPrefix=`${year}-${String(month).padStart(2,'0')}`,existing=read(SCHEDULE_KEY,[]).filter(row=>!(row.employeeId===employee.id&&String(row.date).startsWith(monthPrefix)));
     const codeNames=new Map(groups.map(group=>[group.item.code,group.item.name]));
     const rows=buildMonthRows(year,month,max,employee,occupied,codeNames);
     localStorage.setItem(SCHEDULE_KEY,JSON.stringify([...existing,...rows]));
     const events=read(EVENT_KEY,[]);leavePlans.forEach(plan=>events.unshift(plan.event));localStorage.setItem(EVENT_KEY,JSON.stringify(events.slice(0,200)));
     if(typeof addAudit==='function')addAudit('員工整月排班快速輸入',`${employee.name}・${employee.id}・${year}/${month}・${[...occupied].map(([day,code])=>`${day}${code}`).join('、')}・${currentProfile().name} ${currentProfile().id}`);
     closeModal();toast(`${employee.name}的 ${month} 月排班已完成：${occupied.size} 個排休，其餘日期自動套用 1`);
     window.dispatchEvent(new HashChangeEvent('hashchange'));
   };
 }
 document.addEventListener('click',event=>{
   const button=event.target.closest?.('[data-schedule-person]');
   if(!button)return;
   event.preventDefault();event.stopImmediatePropagation();openBatch(button);
 },true);
 window.BOMBHR_MONTHLY_PERSON_SCHEDULE={parseDays,buildMonthRows,openBatch};
})();

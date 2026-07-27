(function(){
 'use strict';
 const KEY='bombhr-schedule-participants-v195';
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}};
 const write=value=>localStorage.setItem(KEY,JSON.stringify(value));
 const monthValue=()=>typeof scheduleCursor!=='undefined'?`${scheduleCursor.getFullYear()}-${String(scheduleCursor.getMonth()+1).padStart(2,'0')}`:new Date().toISOString().slice(0,7);
 const effective=(setting,month)=>{
   if(!setting||setting.mode==='participate')return false;
   if(setting.mode==='exclude')return month>=(setting.effectiveMonth||'0000-00');
   if(setting.mode==='pause'){const start=String(setting.startDate||'').slice(0,7),end=String(setting.endDate||'9999-12').slice(0,7);return (!start||month>=start)&&(!end||month<=end)}
   return false;
 };
 function isIncluded(person,month=monthValue()){const setting=read()[person.employeeId];return !effective(setting,month)}
 function settingFor(employeeId){return read()[employeeId]||{mode:'participate',effectiveMonth:monthValue(),startDate:'',endDate:'',reason:'',shift:'09:00-18:00'}}
 function people(){
   let custom=[];try{custom=typeof getCustomEmployees==='function'?getCustomEmployees():JSON.parse(localStorage.getItem('bombhr-custom-employees-v147')||localStorage.getItem('bombhr-custom-employees')||'[]')}catch(e){}
   const all=[...(window.BOMBHR_IMPORTED_PERSONNEL||[]),...custom].filter((person,index,list)=>person?.employeeId&&list.findIndex(item=>item.employeeId===person.employeeId)===index);
   return all.filter(person=>typeof window.bombhrCanAccessEmployee!=='function'||window.bombhrCanAccessEmployee(person.employeeId));
 }
 function statusLabel(setting){
   if(setting.mode==='exclude')return `自 ${setting.effectiveMonth||'現在'} 起不參與`;
   if(setting.mode==='pause')return `${setting.startDate||'未定'}～${setting.endDate||'未定'} 暫停`;
   if(setting.mode==='fixed')return `固定班 ${setting.shift||'09:00-18:00'}`;
   return '參與排班';
 }
 function renderRows(filter=''){
   const root=document.getElementById('scheduleParticipationList');if(!root)return;
   const keyword=filter.trim().toLowerCase(),records=read(),visible=people().filter(person=>!keyword||[person.name,person.employeeId,person.department,person.position].join(' ').toLowerCase().includes(keyword));
   root.innerHTML=visible.map(person=>{
     const setting=records[person.employeeId]||settingFor(person.employeeId),mode=setting.mode||'participate';
     return `<div class="schedule-participation-row" data-participation-row="${person.employeeId}" data-mode="${mode}"><div class="schedule-participation-person"><b>${person.name}</b><small>${person.employeeId}・${person.department||'—'}／${person.position||'—'}</small><small>${statusLabel(setting)}</small></div><label>排班狀態<select class="form-control" data-participation-mode><option value="participate" ${mode==='participate'?'selected':''}>參與排班</option><option value="exclude" ${mode==='exclude'?'selected':''}>不參與排班</option><option value="pause" ${mode==='pause'?'selected':''}>指定期間暫停</option><option value="fixed" ${mode==='fixed'?'selected':''}>固定班制</option></select></label><label data-effective-field>生效月份<input class="form-control" data-participation-effective type="month" value="${setting.effectiveMonth||monthValue()}"></label><label data-start-field>暫停開始<input class="form-control" data-participation-start type="date" value="${setting.startDate||''}"></label><label data-end-field>暫停結束<input class="form-control" data-participation-end type="date" value="${setting.endDate||''}"></label><label data-shift-field>固定班別<select class="form-control" data-participation-shift><option value="09:00-18:00" ${setting.shift==='09:00-18:00'?'selected':''}>日班 09:00–18:00</option><option value="08:30-17:30" ${setting.shift==='08:30-17:30'?'selected':''}>早班 08:30–17:30</option><option value="13:00-22:00" ${setting.shift==='13:00-22:00'?'selected':''}>晚班 13:00–22:00</option></select></label><label>原因／備註<input class="form-control" data-participation-reason value="${setting.reason||''}" placeholder="選填"></label></div>`;
   }).join('')||'<div class="empty-state">沒有符合目前權限範圍的員工。</div>';
   root.querySelectorAll('[data-participation-mode]').forEach(select=>{select.onchange=()=>updateVisibility(select.closest('[data-participation-row]'))});
   root.querySelectorAll('[data-participation-row]').forEach(updateVisibility);
 }
 function updateVisibility(row){
   const mode=row.querySelector('[data-participation-mode]').value;row.dataset.mode=mode;
   row.querySelector('[data-effective-field]').hidden=mode!=='exclude';
   row.querySelector('[data-start-field]').hidden=mode!=='pause';
   row.querySelector('[data-end-field]').hidden=mode!=='pause';
   row.querySelector('[data-shift-field]').hidden=mode!=='fixed';
 }
 function openManager(){
   const all=people(),records=read(),excluded=all.filter(person=>effective(records[person.employeeId],monthValue())).length;
   openModal('排班對象管理',`${monthValue()}・目前權限範圍內共 ${all.length} 位員工`,`<div class="schedule-participation-summary"><span>參與排班 <b>${all.length-excluded}</b></span><span>本月不顯示 <b>${excluded}</b></span><span>歷史資料 <b>永久保留</b></span></div><label class="search-field">⌕<input id="scheduleParticipationSearch" placeholder="搜尋姓名、員編、部門或職位"></label><div class="schedule-participation-list" id="scheduleParticipationList"></div><div class="schedule-participation-note">不參與或暫停排班只會從生效月份的班表名單隱藏，不會刪除員工主檔、登入帳號、薪資、保險、假別額度或歷史班表。</div>`,`<button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="saveScheduleParticipation">儲存排班對象</button>`);
   renderRows();
   document.getElementById('scheduleParticipationSearch').oninput=event=>renderRows(event.target.value);
   document.getElementById('saveScheduleParticipation').onclick=saveManager;
 }
 function saveManager(){
   const records=read(),errors=[];
   document.querySelectorAll('[data-participation-row]').forEach(row=>{
     const id=row.dataset.participationRow,mode=row.querySelector('[data-participation-mode]').value,startDate=row.querySelector('[data-participation-start]').value,endDate=row.querySelector('[data-participation-end]').value;
     if(mode==='pause'&&(!startDate||!endDate||endDate<startDate)){errors.push(`${id} 的暫停日期不完整`);return}
     records[id]={mode,effectiveMonth:row.querySelector('[data-participation-effective]').value||monthValue(),startDate,endDate,shift:row.querySelector('[data-participation-shift]').value,reason:row.querySelector('[data-participation-reason]').value.trim(),updatedBy:`${currentProfile().name}・${currentProfile().id}`,updatedRole:currentProfile().label||currentRole(),updatedDepartment:currentProfile().department||'—',updatedAt:new Date().toLocaleString('zh-TW',{hour12:false})};
   });
   if(errors.length){toast(errors[0]);return}
   write(records);
   if(typeof addAudit==='function')addAudit('修改排班對象',`${currentProfile().name}・${currentProfile().id}・${currentProfile().label||currentRole()}・責任部門 ${currentProfile().department||'—'}・${new Date().toLocaleString('zh-TW',{hour12:false})}`);
   closeModal();toast('排班對象設定已儲存；員工主檔與歷史班表不受影響');window.dispatchEvent(new HashChangeEvent('hashchange'));
 }
 function injectButton(){
   const download=document.querySelector('a[href*="BOMB-HR-每月班表範例"]');if(!download||document.querySelector('[data-schedule-participation]'))return;
   const button=document.createElement('button');button.type='button';button.className='secondary-btn schedule-participation-trigger';button.dataset.scheduleParticipation='';button.textContent='排班對象';button.onclick=openManager;download.parentNode.insertBefore(button,download);
 }
 const priorBind=bindView;
 bindView=function(route){priorBind(route);if(route==='scheduling')setTimeout(injectButton,0)};
 setTimeout(injectButton,0);
 setTimeout(()=>{if(location.hash==='#scheduling')window.dispatchEvent(new HashChangeEvent('hashchange'))},0);
 window.BOMBHR_SCHEDULE_PARTICIPATION={read,isIncluded,settingFor,effective,people,renderRows,openManager,saveManager,injectButton};
})();

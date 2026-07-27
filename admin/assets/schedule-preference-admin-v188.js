(function(){
 'use strict';
 const KEY='bombhr-schedule-preferences-v188',POLICY='bombhr-schedule-preference-policy-v188',SCHEDULE='bombhr-schedules-v176';
 const defaults={mode:'window',startDay:15,endDay:20,optional:true};
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(e){return fallback}};
 const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const visible=item=>currentRole()!=='supervisor'||item.supervisorId===currentProfile().id||(typeof window.bombhrCanAccessEmployee==='function'&&window.bombhrCanAccessEmployee(item.employeeId));
 const submissions=()=>read(KEY,[]).filter(item=>item.status!=='draft'&&visible(item));
 function inbox(){
   const rows=submissions();
   return `<section class="preference-admin-card"><div class="preference-admin-head"><div><b>員工下月排休意願</b><small>僅供主管排班協調，不屬於正式請假，也不扣除假別額度</small></div><span class="preference-admin-count">${rows.filter(item=>item.status==='submitted').length} 件待安排</span></div>${rows.length?`<div class="table-wrap"><table><thead><tr><th>員工</th><th>排班月份</th><th>希望休假日期</th><th>備註</th><th>狀態</th><th>操作</th></tr></thead><tbody>${rows.map(item=>`<tr><td><b>${esc(item.employeeName)}</b><small class="table-subline">${esc(item.employeeId)}・${esc(item.department)}</small></td><td>${esc(item.targetMonth)}</td><td><div class="preference-date-tags">${item.dates.map(day=>`<i>${esc(day)}</i>`).join('')}</div></td><td>${esc(item.memo||'—')}</td><td>${badge(item.statusText)}</td><td class="row-actions">${item.status==='submitted'?`<button data-apply-preference="${esc(item.id)}">套入班表</button>`:'<button data-view-preference="${esc(item.id)}">查看</button>'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="preference-admin-empty">目前沒有員工提交排休意願；未提交不列為異常。</div>'}</section>`;
 }
 const baseSchedulingView=schedulingView;
 schedulingView=function(){const html=baseSchedulingView();return html.replace('<div class="schedule-toolbar">',inbox()+'<div class="schedule-toolbar">')};
 function applyPreference(id){
   const all=read(KEY,[]),item=all.find(row=>row.id===id);if(!item||!visible(item))return;
   openModal('套用員工排休意願',`${item.employeeName}・${item.targetMonth}`,`<div class="permission-locked"><b>希望休假：${item.dates.join('、')} 日</b><span>套用後會在月班表標記為「休」，不會扣除任何假別額度。若需使用年假等假別，員工仍須另外提出正式請假。</span></div>${item.memo?`<div class="form-hint">員工備註：${esc(item.memo)}</div>`:''}`,`<button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="confirmApplyPreference">確認套入班表</button>`);
   document.getElementById('confirmApplyPreference').onclick=()=>{
     const dates=item.dates.map(day=>`${item.targetMonth}-${day}`),schedules=read(SCHEDULE,[]).filter(row=>!(row.employeeId===item.employeeId&&dates.includes(row.date)));
     dates.forEach(date=>schedules.push({date,employeeId:item.employeeId,employeeName:item.employeeName,department:item.department,start:'',end:'',code:'休',site:'台中總公司',note:`員工排休意願・${item.id}`}));
     write(SCHEDULE,schedules);item.status='applied';item.statusText='主管已套入班表';item.appliedBy=`${currentProfile().name}・${currentProfile().id}`;item.appliedAt=new Date().toLocaleString('zh-TW',{hour12:false});write(KEY,all);
     if(typeof addAudit==='function')addAudit('套用員工排休意願',`${item.employeeName}・${item.employeeId}・${item.targetMonth}・${item.dates.join('、')}・${item.appliedBy}`);
     closeModal();toast(`${item.employeeName}的排休意願已套入 ${item.targetMonth} 班表`);window.dispatchEvent(new HashChangeEvent('hashchange'));
   };
 }
 function policyView(){
   const p=read(POLICY,defaults);
   return `<section class="panel preference-policy-card"><div><h3>下月排休意願設定</h3><p>控制 Employee App 的提交期間；此功能永遠維持自願填寫。</p></div><div class="form-grid"><label class="form-field">開放方式<select id="preferencePolicyMode" class="form-control"><option value="window" ${p.mode==='window'?'selected':''}>每月指定日期開放</option><option value="anytime" ${p.mode==='anytime'?'selected':''}>隨時開放</option></select></label><label class="form-field">開始日<input id="preferenceStartDay" class="form-control" type="number" min="1" max="31" value="${p.startDay}"></label><label class="form-field">結束日<input id="preferenceEndDay" class="form-control" type="number" min="1" max="31" value="${p.endDay}"></label></div><div class="preference-policy-note">未提交不會產生缺繳、異常或催繳通知。員工提交的是排休意願，不等於請假核准，最終仍由主管發布班表。</div><button class="primary-btn" id="savePreferencePolicy">儲存排休意願設定</button></section>`;
 }
 const baseSettingsView=views.settings;
 views.settings=()=>baseSettingsView().replace('<button data-tab="basic">基本設定</button>','<button data-tab="preference-policy">排休意願</button><button data-tab="basic">基本設定</button>');
 const priorBind=bindView;
 bindView=function(route){
   priorBind(route);
   if(route==='scheduling')setTimeout(()=>document.querySelectorAll('[data-apply-preference]').forEach(button=>button.onclick=()=>applyPreference(button.dataset.applyPreference)),0);
   if(route==='settings')setTimeout(()=>{const tab=document.querySelector('[data-tab="preference-policy"]');if(tab)tab.onclick=()=>{document.querySelectorAll('.tabs button').forEach(button=>button.classList.toggle('active',button===tab));document.getElementById('tabContent').innerHTML=policyView();document.getElementById('savePreferencePolicy').onclick=()=>{const mode=document.getElementById('preferencePolicyMode').value,startDay=Number(document.getElementById('preferenceStartDay').value),endDay=Number(document.getElementById('preferenceEndDay').value);if(mode==='window'&&(startDay<1||endDay>31||startDay>endDay)){toast('請輸入正確的開放日期範圍');return}write(POLICY,{mode,startDay,endDay,optional:true,updatedBy:`${currentProfile().name}・${currentProfile().id}`,updatedAt:new Date().toLocaleString('zh-TW',{hour12:false})});if(typeof addAudit==='function')addAudit('修改排休意願開放設定',`${mode==='anytime'?'隨時開放':`每月 ${startDay}～${endDay} 日`}・自願填寫`);toast('排休意願設定已儲存並同步 Employee App')}}},0);
 };
 window.addEventListener('storage',event=>{if(event.key===KEY&&location.hash==='#scheduling')window.dispatchEvent(new HashChangeEvent('hashchange'))});
 window.BOMBHR_SCHEDULE_PREFERENCE_ADMIN={submissions,visible,inbox,applyPreference,policyView};
})();

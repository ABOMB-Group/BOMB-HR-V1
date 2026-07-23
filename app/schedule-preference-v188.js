(function(){
 'use strict';
 const KEY='bombhr-schedule-preferences-v188',POLICY='bombhr-schedule-preference-policy-v188';
 const EMPLOYEE={id:'AB00008',name:'佑',department:'技術',supervisor:'肉肉',supervisorId:'AB00006'};
 const defaults={mode:'window',startDay:15,endDay:20,optional:true};
 const read=(key,fallback)=>{try{return {...(Array.isArray(fallback)?{}:fallback),...JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}}catch(e){return fallback}};
 const list=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return []}};
 const pad=n=>String(n).padStart(2,'0');
 const monthInfo=()=>{const now=new Date(),target=new Date(now.getFullYear(),now.getMonth()+1,1);return {now,target,key:`${target.getFullYear()}-${pad(target.getMonth()+1)}`,label:`${target.getFullYear()} 年 ${target.getMonth()+1} 月`,days:new Date(target.getFullYear(),target.getMonth()+1,0).getDate()}};
 const policy=()=>read(POLICY,defaults);
 const isOpen=()=>{const p=policy(),day=new Date().getDate();return p.mode==='anytime'||(day>=Number(p.startDay)&&day<=Number(p.endDay))};
 function ensureUI(){
   if(document.querySelector('[data-open-schedule-preference]'))return;
   const grid=document.querySelector('#scheduleView .apply-grid');
   if(grid){const button=document.createElement('button');button.className='apply-card';button.dataset.openSchedulePreference='';button.innerHTML='<div class="apply-icon">休</div><b>下月排休意願</b><small>提交希望休假日期給直屬主管</small>';grid.appendChild(button)}
   const section=document.createElement('section');section.className='subview';section.id='schedulePreferenceSubview';section.innerHTML='<div class="subview-head"><button class="back-btn" data-close-schedule-preference>‹</button><h2>下月排休意願</h2></div><div id="schedulePreferenceContent"></div>';
   document.body.appendChild(section);
   document.addEventListener('click',event=>{if(event.target.closest('[data-open-schedule-preference]'))open();if(event.target.closest('[data-close-schedule-preference]'))close()});
 }
 function currentRecord(){
   const info=monthInfo();
   return list().find(item=>item.employeeId===EMPLOYEE.id&&item.targetMonth===info.key)||null;
 }
 function render(){
   const root=document.getElementById('schedulePreferenceContent');if(!root)return;
   const info=monthInfo(),p=policy(),opened=isOpen(),record=currentRecord(),selected=new Set(record?.dates||[]);
   root.innerHTML=`<div class="preference-hero"><b>${info.label}排休意願</b><span>直屬主管：${EMPLOYEE.supervisor}</span><small>這是排班意願，不是正式請假；不會扣除年假或其他假別額度，最終班表仍以主管發布結果為準。</small><span class="preference-window ${opened?'':'closed'}">${p.mode==='anytime'?'企業設定：隨時開放':`每月 ${p.startDay}～${p.endDay} 日開放提交`}${opened?'・目前開放':'・目前未開放'}</span></div><div class="card"><div class="form-group"><label>希望休假的日期 <span class="optional-badge">可複選</span></label><div class="preference-date-grid">${Array.from({length:info.days},(_,index)=>{const day=pad(index+1);return `<button type="button" data-preference-day="${day}" class="${selected.has(day)?'selected':''}">${index+1}</button>`}).join('')}</div><div class="readonly-note">已選擇：<b id="preferenceSelected">${[...selected].join('、')||'尚未選擇'}</b></div></div><div class="form-group"><label>備註 <span class="optional-badge">選填</span></label><textarea id="preferenceMemo" placeholder="例如：家庭行程；主管仍可依人力協調">${record?.memo||''}</textarea></div><div class="preference-note">沒有提交也沒有關係，不會列為缺繳或異常；公司與主管不會強制催繳。</div><div class="preference-actions"><button class="secondary" id="savePreferenceDraft">儲存草稿</button><button class="primary" id="submitPreference" ${opened?'':'disabled'}>${record?.status==='submitted'?'更新並重新提交':'提交直屬主管'}</button></div>${!opened?'<div class="readonly-note">目前不在提交期間；仍可先儲存草稿。若企業改為「隨時開放」，即可立即提交。</div>':''}</div><div class="preference-history" id="preferenceHistory"></div>`;
   const chosen=new Set(selected);
   document.querySelectorAll('[data-preference-day]').forEach(button=>button.onclick=()=>{button.classList.toggle('selected');button.classList.contains('selected')?chosen.add(button.dataset.preferenceDay):chosen.delete(button.dataset.preferenceDay);document.getElementById('preferenceSelected').textContent=[...chosen].sort().join('、')||'尚未選擇'});
   const save=status=>{
     if(status==='submitted'&&!chosen.size){toast('請至少選擇一個希望休假的日期');return}
     const all=list(),now=new Date().toLocaleString('zh-TW',{hour12:false}),payload={id:record?.id||`PREF-${EMPLOYEE.id}-${info.key}`,employeeId:EMPLOYEE.id,employeeName:EMPLOYEE.name,department:EMPLOYEE.department,supervisor:EMPLOYEE.supervisor,supervisorId:EMPLOYEE.supervisorId,targetMonth:info.key,dates:[...chosen].sort(),memo:document.getElementById('preferenceMemo').value.trim(),status,statusText:status==='draft'?'草稿':record?.status==='applied'?'已更新，待主管重新安排':'已提交主管',submittedAt:status==='submitted'?now:(record?.submittedAt||''),updatedAt:now,optional:true};
     const index=all.findIndex(item=>item.id===payload.id);index>=0?all.splice(index,1,payload):all.unshift(payload);localStorage.setItem(KEY,JSON.stringify(all));window.dispatchEvent(new CustomEvent('bombhr-schedule-preference-update'));toast(status==='draft'?'排休意願草稿已儲存':`已提交給直屬主管 ${EMPLOYEE.supervisor}`);render();
   };
   document.getElementById('savePreferenceDraft').onclick=()=>save('draft');
   document.getElementById('submitPreference').onclick=()=>save('submitted');
   const history=document.getElementById('preferenceHistory'),mine=list().filter(item=>item.employeeId===EMPLOYEE.id);
   history.innerHTML=mine.length?mine.map(item=>`<div class="preference-history-item"><div><b>${item.targetMonth.replace('-',' 年 ')} 月</b><em>${item.statusText}</em></div><small>希望日期：${item.dates.join('、')||'未填寫'}</small><small>${item.updatedAt||''}</small></div>`).join(''):'';
 }
 function open(){ensureUI();document.querySelectorAll('.subview').forEach(view=>view.classList.remove('active'));document.getElementById('schedulePreferenceSubview').classList.add('active');render()}
 function close(){document.getElementById('schedulePreferenceSubview')?.classList.remove('active')}
 ensureUI();
 window.addEventListener('storage',event=>{if([KEY,POLICY].includes(event.key)&&document.getElementById('schedulePreferenceSubview')?.classList.contains('active'))render()});
 window.BOMBHR_SCHEDULE_PREFERENCE_APP={open,render,isOpen,monthInfo};
})();

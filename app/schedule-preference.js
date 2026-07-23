(function(){
 'use strict';
 const KEY='bombhr-schedule-preferences-v188',POLICY='bombhr-schedule-preference-policy-v188';
 const signedIn=window.BOMBHR_APP_EMPLOYEE||{employeeId:'AB00008',name:'佑',department:'技術',managerId:'AB00006'},EMPLOYEE={id:signedIn.employeeId,name:signedIn.name,department:signedIn.department,supervisor:signedIn.manager||'直屬主管',supervisorId:signedIn.managerId||''};
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
   if(grid){const button=document.createElement('button');button.className='apply-card';button.dataset.openSchedulePreference='';button.innerHTML='<b>下月排休意願</b><small>提交希望休假日期給直屬主管</small>';grid.appendChild(button)}
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
   const info=monthInfo(),p=policy(),opened=isOpen(),record=currentRecord(),initial=(record?.dates||[]).join('.');
   root.innerHTML=`<div class="preference-hero"><b>${info.label}排休意願</b><span>直屬主管：${EMPLOYEE.supervisor}</span><small>這是排班意願，不是正式請假；不會扣除年假或其他假別額度，最終班表仍以主管發布結果為準。</small><span class="preference-window ${opened?'':'closed'}">${p.mode==='anytime'?'企業設定：隨時開放':`每月 ${p.startDay}～${p.endDay} 日開放提交`}${opened?'・目前開放':'・目前未開放'}</span></div><div class="card preference-compact-card"><div class="form-group"><label>希望休假的日期 <span class="optional-badge">直接輸入數字</span></label><input id="preferenceDateInput" class="preference-date-input" inputmode="decimal" autocomplete="off" value="${initial}" placeholder="例如：04.08.13.18.24.25"><small class="preference-input-help">可使用句點、逗號或空格分隔；系統會自動排除重複及無效日期。</small><div class="preference-date-preview" id="preferenceDatePreview"></div><div class="readonly-note">已選擇 <b id="preferenceSelectedCount">0</b> 天</div></div><div class="form-group"><label>備註 <span class="optional-badge">選填</span></label><textarea id="preferenceMemo" rows="2" placeholder="例如：家庭行程；主管仍可依人力協調">${record?.memo||''}</textarea></div><div class="preference-note">沒有提交也沒有關係，不會列為缺繳或異常；公司與主管不會強制催繳。</div><div class="preference-actions"><button class="secondary" id="savePreferenceDraft">儲存草稿</button><button class="primary" id="submitPreference" ${opened?'':'disabled'}>${record?.status==='submitted'?'更新並重新提交':'提交直屬主管'}</button></div>${!opened?'<div class="readonly-note">目前不在提交期間；仍可先儲存草稿。若企業改為「隨時開放」，即可立即提交。</div>':''}</div><div class="preference-history" id="preferenceHistory"></div>`;
   const input=document.getElementById('preferenceDateInput'),preview=document.getElementById('preferenceDatePreview'),count=document.getElementById('preferenceSelectedCount');
   const parseDates=()=>[...new Set(input.value.split(/[.,，、\s]+/).map(value=>Number(value)).filter(day=>Number.isInteger(day)&&day>=1&&day<=info.days))].sort((a,b)=>a-b).map(pad);
   const updatePreview=()=>{const dates=parseDates();preview.innerHTML=dates.length?dates.map(day=>`<span>${Number(day)} 日</span>`).join(''):'<small>尚未輸入日期</small>';count.textContent=dates.length;return dates};
   input.addEventListener('input',updatePreview);input.addEventListener('blur',()=>{input.value=updatePreview().join('.')});updatePreview();
   const save=status=>{
     const dates=updatePreview();if(status==='submitted'&&!dates.length){toast('請至少輸入一個希望休假的日期');return}
     input.value=dates.join('.');
     const all=list(),now=new Date().toLocaleString('zh-TW',{hour12:false}),payload={id:record?.id||`PREF-${EMPLOYEE.id}-${info.key}`,employeeId:EMPLOYEE.id,employeeName:EMPLOYEE.name,department:EMPLOYEE.department,supervisor:EMPLOYEE.supervisor,supervisorId:EMPLOYEE.supervisorId,targetMonth:info.key,dates,memo:document.getElementById('preferenceMemo').value.trim(),status,statusText:status==='draft'?'草稿':record?.status==='applied'?'已更新，待主管重新安排':'已提交主管',submittedAt:status==='submitted'?now:(record?.submittedAt||''),updatedAt:now,optional:true};
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

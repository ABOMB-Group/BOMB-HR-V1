(function(){
 'use strict';
 const api=window.BOMBHR_HR_LEDGER;if(!api)return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const allowed=()=>['executive','hradmin'].includes(typeof currentRole==='function'?currentRole():'');
 const profiles=()=>typeof employees!=='undefined'?employees.map(row=>({id:row[0],name:row[1],department:row[2],position:row[3]})):[];
 function policyPanel(){
  const p=api.annualPolicy(),overrides=api.annualOverrides(),settlements=api.annualSettlements();
  return `<section class="annual-policy-shell">
   <div class="annual-policy-head"><div><span>ANNUAL LEAVE</span><h3>年假額度與年度結算</h3><p>設定職級額度、個人例外、未休折算工資及員工顯示權限。</p></div><button class="primary-btn" data-annual-run>建立年度結算</button></div>
   <div class="annual-flow"><span><b>1</b>年度內使用</span><i>→</i><span><b>2</b>12/31 鎖定</span><i>→</i><span><b>3</b>未休折算工資</span><i>→</i><span><b>4</b>1/1 發新額度</span></div>
   <div class="annual-policy-grid">
    <article><header><div><b>職級群組額度</b><small>個人例外優先於群組額度</small></div></header><div class="annual-group-list">${(p.groups||[]).map((g,i)=>`<label><span>${esc(g.name)}</span><input data-annual-group="${i}" type="number" min="0" step=".5" value="${g.quota}"><em>天</em></label>`).join('')}</div></article>
    <article><header><div><b>年度結算規則</b><small>法定年假未休完自動建立薪資加給</small></div></header><div class="annual-option-list"><label><span>結算方式<small>未休年假不直接作廢</small></span><select data-annual-mode><option value="cash" selected>折算工資</option></select></label><label><span>自動更新時間<small>每年固定執行</small></span><b>1 月 1 日 00:00</b></label></div></article>
    <article><header><div><b>員工 APP 顯示</b><small>員工只可查看自己的資料</small></div></header><div class="annual-toggle-list"><label><span>顯示年假總額、已用與剩餘</span><input data-annual-balance type="checkbox" ${p.employeeCanViewBalance!==false?'checked':''}></label><label><span>顯示年假結算與折算金額</span><input data-annual-settlement-visible type="checkbox" ${p.employeeCanViewSettlement?'checked':''}></label></div><p class="annual-safe-note">目前預設：員工看得到剩餘年假，但看不到折算內容。</p></article>
   </div>
   <div class="annual-person-head"><div><b>個人年假例外</b><small>適用高階主管或個別約定；可用姓名、員編搜尋</small></div><label>⌕<input data-annual-search placeholder="搜尋姓名或員工編號"></label></div>
   <div class="annual-person-list">${profiles().map(e=>{const o=overrides[e.id]||{},group=o.groupId||'employee';return `<div class="annual-person-row" data-annual-person="${e.id}" data-search="${esc((e.name+' '+e.id).toLowerCase())}"><div><b>${esc(e.name)}</b><small>${esc(e.id)}・${esc(e.department)}・${esc(e.position)}</small></div><select data-person-group><option value="employee" ${group==='employee'?'selected':''}>一般員工</option><option value="supervisor" ${group==='supervisor'?'selected':''}>主管</option><option value="executive" ${group==='executive'?'selected':''}>高階主管</option></select><label><input data-person-custom type="checkbox" ${o.enabled!==false&&o.quota!==undefined?'checked':''}> 個人額度</label><input data-person-quota type="number" min="0" step=".5" value="${o.quota??api.annualQuota(e.id,7)}"><span>天</span></div>`}).join('')}</div>
   <div class="annual-actions"><button class="secondary-btn" data-annual-reset>重新載入</button><button class="primary-btn" data-annual-save>儲存年假設定</button></div>
   <div class="annual-settlement-head"><div><b>年假結算明細</b><small>僅最高權限及財務人事行政可查看與操作</small></div><span>${settlements.length} 筆</span></div>
   <div class="annual-settlement-table">${settlements.length?`<table><thead><tr><th>年度</th><th>員工</th><th>核發／已用</th><th>未休</th><th>折算工資</th><th>狀態</th></tr></thead><tbody>${settlements.map(x=>`<tr><td>${x.year}</td><td><b>${esc(x.employeeName)}</b><small>${esc(x.employeeId)}</small></td><td>${x.quota}／${x.used} 天</td><td>${x.unused} 天</td><td>NT$ ${Number(x.amount||0).toLocaleString('zh-TW')}</td><td><span>${esc(x.status)}</span></td></tr>`).join('')}</tbody></table>`:'<div class="annual-empty">尚無年度結算紀錄。執行後會保留未休日數、日薪、折算金額、操作人及時間。</div>'}</div>
  </section>`;
 }
 function save(){
  if(!allowed()){toast('只有最高權限或財務人事行政可以設定年假');return}
  const p=api.annualPolicy();document.querySelectorAll('[data-annual-group]').forEach(input=>p.groups[+input.dataset.annualGroup].quota=Number(input.value||0));p.employeeCanViewBalance=document.querySelector('[data-annual-balance]').checked;p.employeeCanViewSettlement=document.querySelector('[data-annual-settlement-visible]').checked;p.settlementMode='cash';api.saveAnnualPolicy(p);
  const all={};document.querySelectorAll('[data-annual-person]').forEach(row=>{const custom=row.querySelector('[data-person-custom]').checked;all[row.dataset.annualPerson]={groupId:row.querySelector('[data-person-group]').value,enabled:custom,quota:custom?Number(row.querySelector('[data-person-quota]').value||0):undefined,updatedAt:new Date().toISOString(),updatedBy:currentProfile().name}});
  api.saveAnnualOverrides(all);if(typeof addAudit==='function')addAudit('修改年假額度與結算設定',`群組及個人額度・員工結算顯示 ${p.employeeCanViewSettlement?'開啟':'關閉'}`);toast('年假額度、個人例外與顯示權限已儲存');window.dispatchEvent(new CustomEvent('bombhr-demo-update'));
 }
 function runSettlement(){
  if(!allowed())return toast('目前權限不可執行年假結算');
  const year=new Date().getFullYear()-1,operator=`${currentProfile().name}・${currentProfile().id}`;
  profiles().forEach(e=>{const salary=typeof employeeSalaryProfile==='function'?employeeSalaryProfile(e.id):{base:30300};const daily=Math.round(Number(salary.base||30300)/30);api.settleAnnual(e.id,e.name,year,daily,operator)});
  if(typeof addAudit==='function')addAudit('執行年假年度結算',`${year} 年・${profiles().length} 位員工`);
  toast(`${year} 年年假已結算，未休額度已轉入薪資紀錄`);window.dispatchEvent(new HashChangeEvent('hashchange'));
 }
 function transactionMonth(item){
  if(/^\d{4}-\d{2}$/.test(String(item.usageMonth||'')))return item.usageMonth.replace('-','／');
  const dates=String(item.period||item.usageDate||item.date||'').match(/\d{4}-\d{2}-\d{2}/g)||[];
  return [...new Set(dates.map(date=>date.slice(0,7).replace('-','／')))].join(' → ')||'—';
 }
 function transactionStatus(item){
  return item.status==='approved'?'已核准':item.status==='cancelled'?'已取消':item.status==='reversed'?'額度已恢復':item.status==='adjusted'?'人事已確認':item.status==='archived'?'舊紀錄已補登':item.status==='corrected'?'日期已修正':item.status||'已記錄';
 }
 function enhanceEmployeeAnnualControls(employeeId){
  const annualInput=document.getElementById('employeeAnnualLeave'),grid=annualInput?.closest('.salary-field-grid');
  if(!grid||grid.querySelector('#employeeAnnualUsageDate'))return;
  const reason=document.getElementById('employeeAnnualReason')?.closest('label'),dateLabel=document.createElement('label');
  dateLabel.innerHTML=`年假使用／調整日期<input id="employeeAnnualUsageDate" type="date" value="${new Date().toISOString().slice(0,10)}" ${annualInput.disabled?'disabled':''}>`;
  grid.insertBefore(dateLabel,reason||null);
  const button=document.createElement('button');button.type='button';button.className='secondary-btn annual-history-button';button.dataset.annualHistoryEmployee=employeeId;button.textContent='查看年假使用明細';grid.closest('section')?.append(button);
 }
 function openAnnualHistory(employeeId){
  const employee=(typeof getEmployeeRecord==='function'?getEmployeeRecord(employeeId):null)||profiles().find(x=>x.id===employeeId)||{name:employeeId},summary=api.summary(employeeId).find(x=>x.rule.id==='annual')||{rule:{quota:0},used:0,remaining:0},history=api.annualHistory(employeeId),usedRows=history.filter(x=>Number(x.days)>0&&!['cancelled','reversed'].includes(x.status)),pending=api.annualUnallocated(employeeId);
  openModal('年假使用明細',`${employee.name}・${employeeId}｜依實際休假日期或補登月份統計`,`<div class="annual-history-summary"><div><small>本年度核發</small><b>${summary.rule.quota} 天</b></div><div><small>已使用</small><b>${summary.used} 天</b></div><div><small>目前剩餘</small><b>${summary.remaining} 天</b></div><div class="${pending?'has-unallocated':''}"><small>尚未歸入月份</small><b>${pending} 天</b></div></div>${pending?`<div class="annual-unallocated-warning"><div><b>有 ${pending} 天舊年假尚未歸入月份</b><small>額度已經扣除，補登月份不會再次扣除。</small></div>${allowed()?`<button class="primary-btn" data-annual-allocate="${employeeId}">補登使用月份</button>`:'<span>請由人事補登</span>'}</div>`:''}<div class="annual-history-note">最高權限或財務人事行政可直接補登月份；只調整月份不會改動原請假日期與班表。</div><div class="annual-history-table">${history.length?`<table><thead><tr><th>使用月份</th><th>原日期／期間</th><th>異動天數</th><th>來源</th><th>狀態</th><th>原因／操作人</th><th>操作</th></tr></thead><tbody>${history.map(item=>`<tr class="${item.status==='cancelled'||item.status==='reversed'?'is-reversed':''}"><td>${transactionMonth(item)}</td><td>${esc(item.period||item.usageDate||String(item.date||'').slice(0,10)||'—')}</td><td class="${Number(item.days)<0?'negative':''}">${Number(item.days)>0?'+':''}${Number(item.days||0)} 天</td><td>${esc(item.type||item.source||'系統紀錄')}</td><td><span>${transactionStatus(item)}</span></td><td><b>${esc(item.note||item.cancelReason||item.correctionReason||'—')}</b><small>${esc(item.operator||item.cancelledBy||item.correctedBy||'系統')}</small></td><td>${allowed()&&Number(item.days)>0&&!['cancelled','reversed','corrected'].includes(item.status)?`<button class="annual-correct-button" data-annual-correct="${esc(item.id)}" data-employee="${employeeId}">補登月份</button>`:'—'}</td></tr>`).join('')}</tbody></table>`:'<div class="annual-empty">目前尚無年假使用月份紀錄。請將舊資料補登月份，新的核准年假會自動出現在這裡。</div>'}</div>`,`<button class="secondary-btn" data-annual-history-back="${employeeId}">← 返回員工人事資料</button><button class="primary-btn" data-modal-close>完成</button>`);
  document.querySelector('[data-annual-history-back]')?.addEventListener('click',()=>{closeModal();employeeModal(employeeId,false);enhanceEmployeeSalaryPage(employeeId);document.querySelector('[data-employee-page="salary"]')?.click();setTimeout(()=>enhanceEmployeeAnnualControls(employeeId),0)});
  document.querySelector('[data-annual-allocate]')?.addEventListener('click',()=>openAnnualAllocation(employeeId,employee.name,pending));
  document.querySelectorAll('[data-annual-correct]').forEach(button=>button.addEventListener('click',()=>openAnnualCorrection(employeeId,employee.name,button.dataset.annualCorrect)));
  }
 function openAnnualAllocation(employeeId,employeeName,pending){
  openModal('補登舊年假使用月份',`${employeeName}・目前有 ${pending} 天尚未歸入月份；本操作不會再次扣除額度`,`<div class="form-grid"><label class="form-field">使用月份<input id="annualArchiveMonth" class="form-control" type="month" value="${new Date().toISOString().slice(0,7)}"></label><label class="form-field">補登天數<input id="annualArchiveDays" class="form-control" type="number" min=".5" step=".5" max="${pending}" value="${pending}"></label><label class="form-field full">補登原因<input id="annualArchiveReason" class="form-control" value="舊年假使用月份補登"></label></div><div class="policy-note">直接選擇月份即可，例如 2026 年 7 月；已使用及剩餘天數不會重複變動，也不會改動班表。</div>`,`<button class="secondary-btn" data-annual-allocation-back>← 返回明細</button><button class="primary-btn" id="saveAnnualAllocation">確認補登</button>`);
  document.querySelector('[data-annual-allocation-back]').onclick=()=>openAnnualHistory(employeeId);
  document.getElementById('saveAnnualAllocation').onclick=()=>{const result=api.allocateAnnualHistory(employeeId,Number(document.getElementById('annualArchiveDays').value),document.getElementById('annualArchiveMonth').value,document.getElementById('annualArchiveReason').value,`${currentProfile().name}・${currentProfile().id}`);if(!result.ok){toast(result.message);return}if(typeof addAudit==='function')addAudit('補登舊年假使用月份',`${employeeName}・${result.allocated} 天・${result.usageMonth}`);toast(`已補登至 ${result.usageMonth.replace('-','／')}，年假額度沒有重複扣除`);openAnnualHistory(employeeId)};
 }
 function openAnnualCorrection(employeeId,employeeName,transactionId){
  const item=api.annualHistory(employeeId).find(x=>x.id===transactionId);if(!item)return toast('找不到要修正的年假紀錄');
  const source=String(item.usageMonth||item.period||item.usageDate||''),match=source.match(/\d{4}-\d{2}/),month=match?.[0]||new Date().toISOString().slice(0,7);
  openModal('補登年假使用月份',`${employeeName}・原紀錄 ${item.period||item.usageDate||'未記錄日期'}・${item.days} 天`,`<div class="form-grid"><label class="form-field">使用月份<input id="annualCorrectMonth" class="form-control" type="month" value="${month}"></label><label class="form-field">使用天數<input id="annualCorrectDays" class="form-control" type="number" min=".5" step=".5" value="${item.days}"></label><label class="form-field full">補登原因<input id="annualCorrectReason" class="form-control" value="補登年假使用月份"></label></div><div class="policy-note">例如選擇 2026 年 7 月，即把這筆年假歸入 7 月統計；不需要開始與結束日期，也不會改動原請假日期或班表。</div>`,`<button class="secondary-btn" data-annual-correct-back>← 返回明細</button><button class="primary-btn" id="saveAnnualCorrection">儲存補登</button>`);
  document.querySelector('[data-annual-correct-back]').onclick=()=>openAnnualHistory(employeeId);
  document.getElementById('saveAnnualCorrection').onclick=()=>{const usageMonth=document.getElementById('annualCorrectMonth').value,days=Number(document.getElementById('annualCorrectDays').value),reason=document.getElementById('annualCorrectReason').value.trim(),result=api.updateAnnualHistoryMonth(employeeId,transactionId,usageMonth,days,reason,`${currentProfile().name}・${currentProfile().id}`);if(!result.ok){toast(result.message);return}if(typeof addAudit==='function')addAudit('補登年假使用月份',`${employeeName}・${result.before.usageMonth||result.before.period||'未歸入月份'} → ${result.after.usageMonth}・${result.before.days} 天 → ${result.after.days} 天`);window.dispatchEvent(new CustomEvent('bombhr-demo-update'));toast(`已歸入 ${usageMonth.replace('-','／')}，原請假日期與班表沒有變動`);openAnnualHistory(employeeId)};
 }
 window.BOMBHR_OPEN_ANNUAL_HISTORY=openAnnualHistory;
 window.BOMBHR_ENHANCE_EMPLOYEE_ANNUAL=enhanceEmployeeAnnualControls;
 function bind(){
  document.querySelector('[data-annual-save]')?.addEventListener('click',save);
  document.querySelector('[data-annual-reset]')?.addEventListener('click',()=>window.dispatchEvent(new HashChangeEvent('hashchange')));
  document.querySelector('[data-annual-run]')?.addEventListener('click',runSettlement);
  document.querySelector('[data-annual-search]')?.addEventListener('input',e=>document.querySelectorAll('[data-annual-person]').forEach(row=>row.hidden=!row.dataset.search.includes(e.target.value.trim().toLowerCase())));
  document.querySelectorAll('[data-person-group]').forEach(select=>select.addEventListener('change',()=>{const row=select.closest('[data-annual-person]'),p=api.annualPolicy(),g=p.groups.find(x=>x.id===select.value);if(!row.querySelector('[data-person-custom]').checked)row.querySelector('[data-person-quota]').value=g?.quota||0}));
 }
 document.addEventListener('click',event=>{
  const employeeTrigger=event.target.closest('[data-view-employee],[data-edit-employee]');
  if(employeeTrigger){const employeeId=employeeTrigger.dataset.viewEmployee||employeeTrigger.dataset.editEmployee;setTimeout(()=>enhanceEmployeeAnnualControls(employeeId),100)}
  const historyButton=event.target.closest('[data-annual-history-employee]');
  if(historyButton){event.preventDefault();openAnnualHistory(historyButton.dataset.annualHistoryEmployee)}
 },true);
 const oldView=window.BOMBHR_LEAVE_RULE_ADMIN?.view,oldBind=window.BOMBHR_LEAVE_RULE_ADMIN?.bind;
 if(oldView&&oldBind){window.BOMBHR_LEAVE_RULE_ADMIN.view=()=>oldView()+policyPanel();window.BOMBHR_LEAVE_RULE_ADMIN.bind=()=>{oldBind();bind()}}
})();

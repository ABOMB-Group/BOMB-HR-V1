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
 function bind(){
  document.querySelector('[data-annual-save]')?.addEventListener('click',save);
  document.querySelector('[data-annual-reset]')?.addEventListener('click',()=>window.dispatchEvent(new HashChangeEvent('hashchange')));
  document.querySelector('[data-annual-run]')?.addEventListener('click',runSettlement);
  document.querySelector('[data-annual-search]')?.addEventListener('input',e=>document.querySelectorAll('[data-annual-person]').forEach(row=>row.hidden=!row.dataset.search.includes(e.target.value.trim().toLowerCase())));
  document.querySelectorAll('[data-person-group]').forEach(select=>select.addEventListener('change',()=>{const row=select.closest('[data-annual-person]'),p=api.annualPolicy(),g=p.groups.find(x=>x.id===select.value);if(!row.querySelector('[data-person-custom]').checked)row.querySelector('[data-person-quota]').value=g?.quota||0}));
 }
 const oldView=window.BOMBHR_LEAVE_RULE_ADMIN?.view,oldBind=window.BOMBHR_LEAVE_RULE_ADMIN?.bind;
 if(oldView&&oldBind){window.BOMBHR_LEAVE_RULE_ADMIN.view=()=>oldView()+policyPanel();window.BOMBHR_LEAVE_RULE_ADMIN.bind=()=>{oldBind();bind()}}
})();

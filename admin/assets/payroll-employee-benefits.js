(function(){
 'use strict';
 if(typeof views==='undefined'||typeof views.payroll!=='function')return;
 const originalPayrollView=views.payroll,tabKey='bombhr-payroll-workspace-tab-v206';
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(e){return fallback}};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const currentTab=()=>sessionStorage.getItem(tabKey)||'settlement';
 const people=()=>payrollRoster||[];
 const profile=id=>employeeSalaryProfile(id);
 const annual=id=>window.BOMBHR_HR_LEDGER?.summary(id).find(x=>x.rule.id==='annual')||{rule:{quota:0},used:0,remaining:0};
 const adjustments=id=>getPayrollAdjustments()[id]||[];
 const signedAdjustments=id=>adjustments(id).reduce((sum,item)=>sum+(['收入','加給'].includes(item.type)?1:-1)*Number(item.amount||0),0);
 const fixed=p=>Number(p.base||0)+Number(p.positionAllowance||0)+Number(p.attendanceBonus||0)+Number(p.seniorityAllowance||0)+Number(p.laborPensionIncome||0);
 const deductions=p=>Number(p.healthInsurance||0)+Number(p.laborInsurance||0)+Number(p.lateDeduction||0);
 const net=row=>{const p=profile(row.id);return fixed(p)+Number(p.overtime||row.overtime||0)-deductions(p)+signedAdjustments(row.id)};
 function tabs(){
  const active=currentTab();
  return `<div class="payroll-workspace-tabs"><button data-payroll-workspace="settlement" class="${active==='settlement'?'active':''}"><b>月薪結算</b></button><button data-payroll-workspace="profiles" class="${active==='profiles'?'active':''}"><b>員工薪資與福利</b></button></div>`;
 }
 function rows(){
  const canEdit=currentProfile().payrollEdit;
  return people().map(row=>{const p=profile(row.id),a=annual(row.id),items=adjustments(row.id),saved=Boolean(getEmployeeSalaryProfiles()[row.id]),delta=signedAdjustments(row.id);return `<tr data-payroll-benefit-row data-department="${esc(row.department)}" data-status="${saved?'已設定':'待補資料'}" data-keyword="${esc(`${row.name} ${row.id} ${row.department} ${row.position}`.toLowerCase())}"><td><div class="person"><span class="avatar">${esc(row.name[0])}</span><div><b>${esc(row.name)}</b><small>${esc(row.id)}</small></div></div></td><td><b>${esc(row.department)}</b><small>${esc(row.position)}</small></td><td><b>NT$ ${fixed(p).toLocaleString('zh-TW')}</b><small>生效 ${esc(p.effectiveDate||'未設定')}</small></td><td><b>NT$ ${deductions(p).toLocaleString('zh-TW')}</b><small>勞保＋健保＋出勤</small></td><td><b>${a.rule.quota}／${a.used}／${a.remaining} 天</b><small>核發／已用／剩餘</small></td><td class="${delta<0?'number-negative':'number-positive'}"><b>${delta>=0?'+':'-'} NT$ ${Math.abs(delta).toLocaleString('zh-TW')}</b><small>${items.length?items.map(x=>x.name).join('、'):'本月無異動'}</small></td><td><strong class="net-pay">NT$ ${net(row).toLocaleString('zh-TW')}</strong></td><td><span class="payroll-profile-status ${saved?'ready':'pending'}">${saved?'已設定':'待補資料'}</span></td><td><div class="payroll-benefit-actions"><button data-payroll-benefit-edit="${row.id}" class="table-primary-btn">${canEdit?'查看／調整':'查看'}</button><button data-payroll-annual-history="${row.id}">年假明細</button></div></td></tr>`}).join('');
 }
 function profileView(){
  const list=people(),ready=list.filter(row=>getEmployeeSalaryProfiles()[row.id]).length,total=list.reduce((sum,row)=>sum+net(row),0),departments=[...new Set(list.map(x=>x.department))];
  return head('員工薪資與福利','','',`<button class="secondary-btn" data-payroll-export>匯出薪資福利</button><button class="primary-btn" data-payroll-workspace="settlement">前往本月結薪</button>`)+tabs()+`<div class="payroll-profile-stats"><div><small>在職薪資人員</small><b>${list.length}</b><span>人</span></div><div><small>薪資福利已設定</small><b>${ready}</b><span>人</span></div><div><small>待補資料</small><b>${list.length-ready}</b><span>人</span></div><div><small>本月預估實領</small><b>NT$ ${total.toLocaleString('zh-TW')}</b></div></div><section class="payroll-profile-panel"><div class="payroll-profile-panel-head"><div><h3>員工薪資與福利名冊</h3></div><div class="payroll-profile-filters"><label>⌕<input id="payrollBenefitSearch" placeholder="搜尋姓名、員編、部門或職位"></label><select id="payrollBenefitDepartment"><option value="">全部部門</option>${departments.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('')}</select><select id="payrollBenefitStatus"><option value="">全部狀態</option><option>已設定</option><option>待補資料</option></select></div></div><div class="payroll-profile-table"><table><thead><tr><th>員工</th><th>部門／職位</th><th>固定薪資</th><th>每月扣款</th><th>年假</th><th>本月異動</th><th>預估實領</th><th>狀態</th><th>操作</th></tr></thead><tbody>${rows()}</tbody></table></div></section>`;
 }
 views.payroll=()=>{
  if(currentTab()==='profiles')return profileView();
  return originalPayrollView()
   .replace('<div class="stat-grid">',tabs()+'<div class="stat-grid">');
 };
 function refresh(){location.hash='payroll';window.dispatchEvent(new HashChangeEvent('hashchange'))}
 function openProfile(employeeId){
  if(typeof window.bombhrCanAccessEmployee==='function'&&!window.bombhrCanAccessEmployee(employeeId)){toast('你沒有權限查看此員工資料');return}
  employeeModal(employeeId,false);enhanceEmployeeSalaryPage(employeeId);document.querySelector('[data-employee-page="salary"]')?.click();setTimeout(()=>window.BOMBHR_ENHANCE_EMPLOYEE_ANNUAL?.(employeeId),0);
 }
 function filterRows(){
  const q=(document.getElementById('payrollBenefitSearch')?.value||'').trim().toLowerCase(),department=document.getElementById('payrollBenefitDepartment')?.value||'',status=document.getElementById('payrollBenefitStatus')?.value||'';
  document.querySelectorAll('[data-payroll-benefit-row]').forEach(row=>row.hidden=Boolean((q&&!row.dataset.keyword.includes(q))||(department&&row.dataset.department!==department)||(status&&row.dataset.status!==status)));
 }
 document.addEventListener('click',event=>{
  const tab=event.target.closest('[data-payroll-workspace]');if(tab){sessionStorage.setItem(tabKey,tab.dataset.payrollWorkspace);refresh();return}
  const edit=event.target.closest('[data-payroll-benefit-edit]');if(edit){openProfile(edit.dataset.payrollBenefitEdit);return}
  const history=event.target.closest('[data-payroll-annual-history]');if(history){window.BOMBHR_OPEN_ANNUAL_HISTORY?.(history.dataset.payrollAnnualHistory);return}
 },true);
 document.addEventListener('input',event=>{if(event.target.matches('#payrollBenefitSearch'))filterRows()});
 document.addEventListener('change',event=>{if(event.target.matches('#payrollBenefitDepartment,#payrollBenefitStatus'))filterRows()});
 if(location.hash==='#payroll')refresh();
})();

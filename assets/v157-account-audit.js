(function(){
 const descriptions={executive:'全公司最高權限',supervisor:'所屬部門的人事、出勤、排班與簽核',hradmin:'人事、薪資、福利、出勤、排班、簽核及報表'};
 function accountKey(){return typeof currentAccount==='function'?currentAccount():'executive'}
 function installSwitcher(){
  const button=document.getElementById('roleSwitchBtn');
  if(!button||button.dataset.accountSwitcher==='1')return;
  button.dataset.accountSwitcher='1';
  const profile=currentProfile();
  button.innerHTML='<i>⇄</i><span><small>目前帳號／權限</small><b>'+profile.name+'・'+profile.label+'</b></span>';
  button.onclick=()=>{
   const cards=Object.entries(roleProfiles).map(([key,p])=>{
    const active=key===accountKey();
    return '<button data-switch-account="'+key+'" class="'+(active?'active':'')+'"><span>'+p.name[0]+'</span><div><b>'+p.name+'・'+p.label+'</b><small>'+p.id+'・'+p.department+'</small><p>'+descriptions[p.role]+'</p></div><em>'+(active?'目前使用':'切換 →')+'</em></button>';
   }).join('');
   openModal('切換後台操作帳號','依實際主管切換；部門範圍、簽核人與稽核責任會套用該帳號','<div class="role-switch-grid">'+cards+'</div>','<button class="secondary-btn" data-modal-close>取消</button>');
   document.querySelectorAll('[data-switch-account]').forEach(item=>item.onclick=()=>{
    const account=item.dataset.switchAccount,p=roleProfiles[account];
    sessionStorage.setItem('bombhr-admin-account',account);
    sessionStorage.setItem('bombhr-admin-role',p.role);
    sessionStorage.setItem('bombhr-admin','1');
    location.hash='dashboard';
    location.reload();
   });
  };
 }
 function applyAccountScope(){
  const p=currentProfile(),content=document.getElementById('content');
  if(!content||p.role!=='supervisor')return;
  const head=content.querySelector('.page-head');
  if(head&&!document.getElementById('accountScopeBadge'))head.insertAdjacentHTML('afterend','<div id="accountScopeBadge" class="permission-locked"><b>'+p.name+'・'+p.id+'</b>｜目前僅顯示「'+p.department+'」部門資料；簽核與稽核將記錄此帳號。</div>');
  if(location.hash==='#organization')document.querySelectorAll('.org-department-v147').forEach(group=>group.hidden=!group.querySelector('summary')?.textContent.includes(p.department));
  if(location.hash==='#employees')document.querySelectorAll('#content tbody tr').forEach(row=>row.hidden=!row.textContent.includes(p.department));
  if(location.hash==='#approvals')document.querySelectorAll('#content tbody tr').forEach(row=>{
   const person=peopleForScope().find(item=>row.textContent.includes(item.name)||row.textContent.includes(item.employeeId));
   if(person)row.hidden=person.department!==p.department;
  });
 }
 function peopleForScope(){return window.BOMBHR_IMPORTED_PERSONNEL||[]}
 updateSharedApproval=function(id,status,statusText,rejectReason){
  const events=getSharedEvents(),item=events.find(e=>e.id===id||e.eventId===id),p=currentProfile();
  if(!item)return;
  Object.assign(item,{status,statusText,rejectReason:rejectReason||'',reviewedAt:new Date().toISOString(),reviewer:p.name,reviewerId:p.id,reviewerRole:p.label,reviewerDepartment:p.department});
  saveSharedEvents(events);
 };
 completeAdminApproval=function(index,status,note){
  const a=approvals[index],records=getAdminApprovalRecords(),p=currentProfile();
  records.unshift({id:'DEMO-'+index,title:a[1],employee:a[2],period:a[3],status,note:note||'',reviewer:p.name,reviewerId:p.id,role:p.label,department:p.department,completedAt:new Date().toLocaleString('zh-TW',{hour12:false})});
  localStorage.setItem('bombhr-admin-approval-records',JSON.stringify(records));
  updateNotificationIndicators();
  location.hash='approvals';
  window.dispatchEvent(new HashChangeEvent('hashchange'));
 };
 completedApprovalTable=function(){
  const shared=getSharedEvents().filter(e=>e.category==='approval'&&e.status!=='review').map(e=>({title:e.title,employee:e.employee,period:e.period,status:e.statusText,reviewer:(e.reviewer||'尚未記錄')+'・'+(e.reviewerId||'—'),role:e.reviewerRole||'主管',department:e.reviewerDepartment||'—',time:e.reviewedAt?new Date(e.reviewedAt).toLocaleString('zh-TW',{hour12:false}):'—'}));
  const fixed=getAdminApprovalRecords().map(r=>({title:r.title,employee:r.employee,period:r.period,status:r.status,reviewer:r.reviewer+'・'+r.reviewerId,role:r.role||'主管',department:r.department||'—',time:r.completedAt}));
  const rows=[...shared,...fixed],body=rows.length?rows.map(r=>'<tr><td>'+r.title+'</td><td>'+r.employee+'</td><td>'+r.period+'</td><td>'+badge(r.status)+'</td><td>'+r.reviewer+'<small style="display:block;color:var(--muted)">'+r.role+'・'+r.department+'</small></td><td>'+r.time+'</td></tr>').join(''):'<tr><td colspan="6" class="empty-state">尚無已完成簽核紀錄</td></tr>';
  return '<div class="table-wrap"><table><thead><tr><th>申請項目</th><th>申請人</th><th>日期／時段</th><th>結果</th><th>審核人／責任範圍</th><th>完成時間</th></tr></thead><tbody>'+body+'</tbody></table></div>';
 };
 let scopeQueued=false;
 new MutationObserver(()=>{installSwitcher();if(!scopeQueued){scopeQueued=true;setTimeout(()=>{scopeQueued=false;applyAccountScope()},0)}}).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('hashchange',()=>setTimeout(applyAccountScope,0));
 setTimeout(()=>{installSwitcher();applyAccountScope()},0);
})();

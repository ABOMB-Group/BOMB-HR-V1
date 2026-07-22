(function(){
 const roleKey='bombhr-role-designer-v147';
 const routes=['dashboard','organization','employees','attendance','scheduling','approvals','payroll','announcements','permissions','settings'];
 function readDesigner(){try{return JSON.parse(localStorage.getItem(roleKey)||'{}')}catch(e){return{}}}
 function profileKey(id){
  if(id==='AB00002')return'supervisor_ken';
  if(id==='AB00003')return'supervisor_ru';
  if(id==='AB00006')return'supervisor_rou';
  return'supervisor_'+id.toLowerCase();
 }
 function syncSupervisorProfiles(){
  const data=readDesigner().supervisor||{},fallback=['AB00002','AB00003','AB00006'],members=data.members||fallback,scopes=data.memberDepartments||{AB00002:['企劃'],AB00003:['企劃'],AB00006:['技術']};
  Object.keys(roleProfiles).forEach(key=>{if(roleProfiles[key].role==='supervisor')delete roleProfiles[key]});
  members.forEach(id=>{
   const person=(window.BOMBHR_IMPORTED_PERSONNEL||[]).find(item=>item.employeeId===id);
   if(!person)return;
   roleProfiles[profileKey(id)]={role:'supervisor',label:'部門主管',name:person.name,id:person.employeeId,department:(scopes[id]||[person.department])[0],routes:[...routes],payrollEdit:false};
  });
 }
 function scopeMembers(){
  const p=currentProfile();
  if(p.role!=='supervisor')return null;
  return (window.BOMBHR_IMPORTED_PERSONNEL||[]).filter(person=>person.department===p.department);
 }
 function filterOperationalRows(){
  const members=scopeMembers();
  if(!members)return;
  const routesToFilter=['attendance','scheduling','approvals','payroll'],route=location.hash.replace('#','');
  if(!routesToFilter.includes(route))return;
  document.querySelectorAll('#content tbody tr').forEach(row=>{
   const person=members.find(item=>row.textContent.includes(item.name)||row.textContent.includes(item.employeeId));
   const anyPerson=(window.BOMBHR_IMPORTED_PERSONNEL||[]).find(item=>row.textContent.includes(item.name)||row.textContent.includes(item.employeeId));
   if(anyPerson&&!person)row.hidden=true;
   if(row.dataset.department)row.hidden=row.dataset.department!==currentProfile().department;
  });
 }
 function updateDesignerLabels(){
  if(location.hash!=='#permissions')return;
  const active=document.querySelector('[data-designer-role="supervisor"].active');
  if(!active)return;
  document.querySelectorAll('[data-designer-tab]').forEach(button=>{if(button.dataset.designerTab==='assignment')button.textContent='人員與部門'});
  const tab=document.querySelector('[data-designer-tab="assignment"]');
  if(tab&&!tab.querySelector('small'))tab.insertAdjacentHTML('beforeend','<small class="linked-tab-note">連動後台帳號</small>');
 }
 syncSupervisorProfiles();
 let queued=false;
 const refresh=()=>{if(queued)return;queued=true;setTimeout(()=>{queued=false;filterOperationalRows();updateDesignerLabels()},0)};
 window.addEventListener('hashchange',refresh);
 new MutationObserver(refresh).observe(document.getElementById('content'),{childList:true,subtree:true});
 document.addEventListener('click',event=>{
  const payroll=event.target.closest('[data-payroll-person-detail]');
  if(payroll&&currentProfile().role==='supervisor'){
   const record=(window.BOMBHR_IMPORTED_PERSONNEL||[]).find(item=>item.employeeId===payroll.dataset.payrollPersonDetail);
   if(record&&record.department!==currentProfile().department){event.preventDefault();event.stopImmediatePropagation();toast('此員工不在目前主管的部門權限範圍內')}
  }
 },true);
 refresh();
})();

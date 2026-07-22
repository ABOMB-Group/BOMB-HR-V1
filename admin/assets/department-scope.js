(function(){
 'use strict';
 const aliases={'企劃':'企劃','營運企劃部':'企劃','營運－企劃部':'企劃','技術':'技術','資訊技術部':'技術','營運－技術部':'技術','產品設計部':'技術','財務/人事':'財務/人事','財務人事行政部':'財務/人事','財務人事行政':'財務/人事'};
 const normalize=value=>aliases[String(value||'').trim()]||String(value||'').trim();
 const read=(key,fallback={})=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(e){return fallback}};
 const profile=()=>typeof currentProfile==='function'?currentProfile():{role:'executive',department:'全公司'};
 function configuredDepartments(employeeId){
  const roles=read('bombhr-role-designer-v147',{}),departments=[];
  Object.values(roles).forEach(role=>{if(!(role?.members||[]).includes(employeeId))return;departments.push(...((role.memberDepartments||{})[employeeId]||[]),...(role.departments||[]))});
  return departments;
 }
 const allowedDepartments=()=>{const p=profile(),configured=configuredDepartments(p.id),accountScopes=read('bombhr-account-department-scopes',{})[p.id]||[],combined=[...(p.departments||[p.department]),...configured,...accountScopes];return [...new Set(combined.map(normalize).filter(Boolean))]};
 function permittedDepartment(department){const p=profile();return p.role!=='supervisor'||allowedDepartments().includes(normalize(department))}
 function allPersonnel(){
  const overrides=read('bombhr-employee-org-overrides',{}),custom=typeof getCustomEmployees==='function'?getCustomEmployees():[];
  return [...(window.BOMBHR_IMPORTED_PERSONNEL||[]),...custom].map(person=>({...person,...(overrides[person.employeeId]||{})}));
 }
 window.getEmployeeRows=function(){
  const rows=allPersonnel().map(person=>[person.name,person.employeeId,person.department,person.position,person.location,person.status]);
  return rows.filter(row=>permittedDepartment(row[2]));
 };
 window.getEmployeeRecord=function(id){const record=allPersonnel().find(person=>person.employeeId===id)||null;return record&&permittedDepartment(record.department)?record:null};
 window.bombhrCanAccessEmployee=function(id){const person=allPersonnel().find(item=>item.employeeId===id);return !!person&&permittedDepartment(person.department)};
 function rowEmployee(row){
  const trigger=row.querySelector('[data-view-employee],[data-edit-employee],[data-payroll-person-detail],[data-payroll-adjust]'),id=trigger&&(trigger.dataset.viewEmployee||trigger.dataset.editEmployee||trigger.dataset.payrollPersonDetail||trigger.dataset.payrollAdjust);
  return allPersonnel().find(person=>person.employeeId===id||row.textContent.includes(person.employeeId)||row.textContent.includes(person.name))||null;
 }
 function enforceRows(){
  const p=profile(),content=document.getElementById('content');if(!content||p.role!=='supervisor')return;
  const route=location.hash.slice(1)||'dashboard';if(!['organization','employees','attendance','scheduling','approvals','payroll'].includes(route))return;
  content.querySelectorAll('tbody tr').forEach(row=>{const person=rowEmployee(row);if(person&&!permittedDepartment(person.department))row.remove()});
  content.querySelectorAll('.org-department-v147').forEach(group=>{const department=group.querySelector('summary b')?.textContent;group.hidden=!permittedDepartment(department)});
  const subtitle=content.querySelector('.panel-head p');if(route==='employees'&&subtitle)subtitle.textContent='共 '+window.getEmployeeRows().length+' 位「'+allowedDepartments().join('、')+'」部門在職員工';
  const pageHead=content.querySelector('.page-head');if(pageHead&&!document.getElementById('liveDepartmentScope'))pageHead.insertAdjacentHTML('afterend','<div id="liveDepartmentScope" class="permission-locked"><b>'+p.name+'・'+p.id+'</b>｜目前實際套用部門：'+allowedDepartments().join('、')+'</div>');
 }
 document.addEventListener('click',event=>{
  const trigger=event.target.closest&&event.target.closest('[data-view-employee],[data-edit-employee],[data-payroll-person-detail],[data-payroll-adjust],[data-shared-approval]');if(!trigger||profile().role!=='supervisor')return;
  let id=trigger.dataset.viewEmployee||trigger.dataset.editEmployee||trigger.dataset.payrollPersonDetail||trigger.dataset.payrollAdjust||'';
  if(!id&&trigger.dataset.sharedApproval&&typeof getSharedEvents==='function'){const item=getSharedEvents().find(entry=>entry.id===trigger.dataset.sharedApproval||entry.eventId===trigger.dataset.sharedApproval);id=item?.employeeId||''}
  if(id&&window.bombhrCanAccessEmployee(id))return;
  event.preventDefault();event.stopImmediatePropagation();const p=profile();if(typeof addAudit==='function')addAudit('阻擋跨部門存取',(id||'未知員工')+'・'+p.name+'・'+p.id+'・'+p.label+'・責任部門 '+allowedDepartments().join('、'));if(typeof closeModal==='function')closeModal();if(typeof toast==='function')toast('權限不足：只能查看與處理責任部門員工資料')
 },true);
 let queued=false;const refresh=()=>{if(queued)return;queued=true;setTimeout(()=>{queued=false;enforceRows()},0)};
 window.addEventListener('hashchange',refresh);window.addEventListener('storage',event=>{if(event.key==='bombhr-role-designer-v147')location.reload()});new MutationObserver(refresh).observe(document.getElementById('content'),{childList:true,subtree:true});
 setTimeout(()=>{if(profile().role==='supervisor'){window.dispatchEvent(new HashChangeEvent('hashchange'));refresh()}},0);
})();

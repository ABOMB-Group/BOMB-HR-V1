(function(){
 'use strict';
 const ROLE_KEY='bombhr-role-designer-v147';
 const ROUTES=['dashboard','organization','employees','attendance','scheduling','approvals','payroll','announcements','permissions','settings'];
 const DEFAULT={AB00002:['企劃'],AB00003:['企劃'],AB00006:['技術']};
 const aliases={'企劃':'企劃','營運企劃部':'企劃','營運－企劃部':'企劃','技術':'技術','資訊技術部':'技術','營運－技術部':'技術','產品設計部':'技術','財務/人事':'財務/人事','財務人事行政部':'財務/人事','財務人事行政':'財務/人事'};
 const normalize=value=>aliases[String(value||'').trim()]||String(value||'').trim();
 const read=(key,fallback={})=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(e){return fallback}};
 function supervisorRoles(){
  const roles=read(ROLE_KEY,{}),result=[];
  Object.entries(roles).forEach(([id,role])=>{if(id!=='supervisor'&&(role.baseType==='supervisor'||role.scope==='managed'))result.push(role)});
  if(!result.length&&roles.supervisor)result.push(roles.supervisor);
  if(!result.length)result.push({members:['AB00002','AB00003','AB00006'],memberDepartments:DEFAULT});
  return result;
 }
 function assignment(employeeId){
  for(const role of supervisorRoles())if((role.members||[]).includes(employeeId))return (role.memberDepartments||{})[employeeId]||role.departments||[];
  return [];
 }
 function people(){
  const overrides=read('bombhr-employee-org-overrides',{}),custom=typeof getCustomEmployees==='function'?getCustomEmployees():[];
  return [...(window.BOMBHR_IMPORTED_PERSONNEL||[]),...custom].map(person=>({...person,...(overrides[person.employeeId]||{})}));
 }
 function rebuildProfiles(){
  if(typeof roleProfiles==='undefined')return;
  Object.keys(roleProfiles).forEach(key=>{if(roleProfiles[key].role==='supervisor')delete roleProfiles[key]});
  const ids=[...new Set(supervisorRoles().flatMap(role=>role.members||[]))];
  ids.forEach(id=>{const person=people().find(item=>item.employeeId===id),departments=assignment(id).map(normalize).filter(Boolean);if(!person||!departments.length)return;const key=id==='AB00002'?'supervisor_ken':id==='AB00003'?'supervisor_ru':id==='AB00006'?'supervisor_rou':'supervisor_'+id.toLowerCase();roleProfiles[key]={role:'supervisor',label:'部門主管',name:person.name,id,department:departments[0],departments,routes:[...ROUTES],payrollEdit:false}});
 }
 rebuildProfiles();
 function permitted(person){const profile=currentProfile();if(profile.role!=='supervisor')return true;return (profile.departments||[profile.department]).map(normalize).includes(normalize(person&&person.department))}
 window.bombhrCanAccessEmployee=id=>{const person=people().find(item=>item.employeeId===id);return !!person&&permitted(person)};
 window.bombhrAuthorizedPersonnel=()=>people().filter(permitted);
 function rowPerson(row){const button=row.querySelector('[data-view-employee],[data-edit-employee],[data-payroll-person-detail],[data-payroll-adjust]'),id=button&&(button.dataset.viewEmployee||button.dataset.editEmployee||button.dataset.payrollPersonDetail||button.dataset.payrollAdjust);return people().find(person=>person.employeeId===id||row.textContent.includes(person.employeeId)||row.textContent.includes(person.name))}
 function enforce(){const profile=currentProfile(),route=location.hash.slice(1)||'dashboard';if(profile.role!=='supervisor'||!['organization','employees','attendance','scheduling','approvals','payroll'].includes(route))return;document.querySelectorAll('#content tbody tr').forEach(row=>{const person=rowPerson(row);if(person&&!permitted(person))row.remove()});if(route==='organization')document.querySelectorAll('.org-department-v147').forEach(group=>group.hidden=!(profile.departments||[profile.department]).map(normalize).includes(normalize(group.querySelector('summary b')?.textContent)));document.querySelectorAll('[data-payroll-adjust],[data-payroll-export],[data-payroll-lock],[data-bank-master]').forEach(button=>button.disabled=true)}
 document.addEventListener('click',event=>{const trigger=event.target.closest('[data-view-employee],[data-edit-employee],[data-payroll-person-detail],[data-payroll-adjust],[data-shared-approval]');if(!trigger||currentProfile().role!=='supervisor')return;let id=trigger.dataset.viewEmployee||trigger.dataset.editEmployee||trigger.dataset.payrollPersonDetail||trigger.dataset.payrollAdjust||'';if(!id&&trigger.dataset.sharedApproval){const item=getSharedEvents().find(entry=>entry.id===trigger.dataset.sharedApproval||entry.eventId===trigger.dataset.sharedApproval);id=item&&item.employeeId||''}if(id&&window.bombhrCanAccessEmployee(id))return;event.preventDefault();event.stopImmediatePropagation();const p=currentProfile(),detail=`${id||'未知員工'}・${p.name}・${p.id}・${p.label}・責任部門 ${p.department}・${new Date().toLocaleString('zh-TW',{hour12:false})}`;if(typeof addAudit==='function')addAudit('阻擋跨部門存取',detail);if(typeof closeModal==='function')closeModal();toast('權限不足：主管只能查看與處理責任部門員工資料')},true);
 let queued=false;const refresh=()=>{if(queued)return;queued=true;setTimeout(()=>{queued=false;enforce()},0)};
 window.addEventListener('hashchange',refresh);window.addEventListener('storage',event=>{if(event.key===ROLE_KEY)location.reload()});new MutationObserver(refresh).observe(document.getElementById('content'),{childList:true,subtree:true});refresh();
})();

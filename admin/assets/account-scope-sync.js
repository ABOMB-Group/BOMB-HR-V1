(function(){
 'use strict';
 const roleKey='bombhr-role-designer-v147',uiKey='bombhr-role-designer-ui',scopeKey='bombhr-account-department-scopes';
 const read=(key,fallback={})=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(e){return fallback}};
 const roster=()=>window.BOMBHR_IMPORTED_PERSONNEL||[];
 function selectedRole(){const ui=readSession(),roles=read(roleKey,{}),role=roles[ui.role]||null;return{id:ui.role||'',role}}
 function readSession(){try{return JSON.parse(sessionStorage.getItem(uiKey)||'{}')}catch(e){return{}}}
 function targets(id,role){
  const result=[...(role?.members||[])],people=roster(),normalized=String(role?.name||'').toLowerCase();
  people.forEach(person=>{if(normalized&&normalized===String(person.name).toLowerCase())result.push(person.employeeId)});
  const known={supervisor_ken:'AB00002',supervisor_ru:'AB00003',supervisor_rou:'AB00006'};if(known[id])result.push(known[id]);
  return [...new Set(result)];
 }
 function visibleDepartments(){return [...document.querySelectorAll('[data-role-department]:checked')].map(input=>input.dataset.roleDepartment).filter(Boolean)}
 function persistVisibleScope(){
  if(location.hash!=='#permissions')return;const {id,role}=selectedRole();if(!role)return;
  const departments=visibleDepartments();
  const ids=targets(id,role);if(!ids.length)return;const scopes=read(scopeKey,{});ids.forEach(employeeId=>scopes[employeeId]=departments);localStorage.setItem(scopeKey,JSON.stringify(scopes));
 }
 function migrate(){
  const roles=read(roleKey,{}),scopes=read(scopeKey,{});Object.entries(roles).forEach(([id,role])=>{const departments=[...(role.departments||[])];targets(id,role).forEach(employeeId=>{if(Object.prototype.hasOwnProperty.call(scopes,employeeId))return;const personal=(role.memberDepartments||{})[employeeId]||[],effective=departments.length?departments:personal;if(effective.length)scopes[employeeId]=[...new Set(effective)]})});localStorage.setItem(scopeKey,JSON.stringify(scopes));
 }
 window.addEventListener('change',event=>{if(event.target.matches&&event.target.matches('[data-role-department]'))setTimeout(persistVisibleScope,0)},true);
 window.addEventListener('click',event=>{if(event.target.closest&&event.target.closest('[data-save-role],[data-v156-save],[data-v160-save]'))persistVisibleScope()},true);
 migrate();window.BOMBHR_ACCOUNT_DEPARTMENT_SCOPES=()=>read(scopeKey,{});
})();

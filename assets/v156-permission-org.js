(function(){
 const roleKey='bombhr-role-designer-v147',uiKey='bombhr-role-designer-ui',orgKey='bombhr-personnel-department-overrides';
 const orgRoles=['owner','manager','supervisor'],departments=['企劃','技術','財務/人事'];
 const currentRoleId=()=>{try{return JSON.parse(sessionStorage.getItem(uiKey)||'{}').role||'owner'}catch(e){return'owner'}};
 const readRoles=()=>{try{return JSON.parse(localStorage.getItem(roleKey)||'{}')}catch(e){return{}}};
 const people=()=>window.BOMBHR_IMPORTED_PERSONNEL||[];
 function enhance(){
  if(location.hash!=='#permissions')return;
  const roleId=currentRoleId();
  if(!orgRoles.includes(roleId))return;
  document.body.dataset.permissionRole=roleId;
  document.querySelectorAll('[data-designer-tab]').forEach(button=>{
   if(button.dataset.designerTab==='assignment')button.textContent='人員與部門';
  });
  if(!document.querySelector('[data-assignment-row]'))return;
  const data=readRoles()[roleId]||{},memberDepartments=data.memberDepartments||{};
  document.querySelectorAll('[data-assignment-row]').forEach(row=>{
   if(row.querySelector('[data-member-department]'))return;
   const member=row.querySelector('[data-member]');
   if(!member)return;
   if(roleId==='owner')member.disabled=false;
   const person=people().find(item=>item.employeeId===member.dataset.member);
   const selected=(memberDepartments[member.dataset.member]||[person&&person.department||'企劃'])[0];
   const select=document.createElement('select');
   select.dataset.memberDepartment=member.dataset.member;
   select.setAttribute('aria-label',(person?person.name:'人員')+'所屬或管理部門');
   select.innerHTML=departments.map(dept=>'<option value="'+dept+'"'+(dept===selected?' selected':'')+'>'+dept+'</option>').join('');
   select.disabled=!member.checked;
   row.classList.add('supervisor-person');
   row.insertBefore(select,member);
  });
  const actions=document.querySelector('.permission-actions');
  if(actions){
   const save=actions.querySelector('[data-save-role]');
   if(save){save.removeAttribute('data-save-role');save.dataset.v156Save='1'}
  }else if(roleId==='owner'){
   const pane=document.querySelector('.permission-pane');
   if(pane)pane.insertAdjacentHTML('beforeend','<div class="permission-actions"><small>調動後會記錄最高權限身份、時間及部門異動。</small><div><button class="primary-btn" data-v156-save="1">儲存人員與部門</button></div></div>');
  }
 }
 function saveAssignment(){
  const roleId=currentRoleId(),roles=readRoles(),role=roles[roleId]||(roles[roleId]={name:roleId==='owner'?'最高權限':roleId==='manager'?'副理／經理':'部門主管',members:[],memberDepartments:{}});
  const checked=[...document.querySelectorAll('[data-member]:checked')];
  role.members=checked.map(input=>input.dataset.member);
  role.memberDepartments={};
  let overrides={};
  try{overrides=JSON.parse(localStorage.getItem(orgKey)||'{}')}catch(e){}
  checked.forEach(input=>{
   const id=input.dataset.member,select=document.querySelector('[data-member-department="'+id+'"]'),department=select?select.value:'';
   role.memberDepartments[id]=department?[department]:[];
   if(department)overrides[id]=department;
  });
  localStorage.setItem(roleKey,JSON.stringify(roles));
  localStorage.setItem(orgKey,JSON.stringify(overrides));
  if(typeof addAudit==='function')addAudit('調動身份與部門',(role.name||roleId)+'・'+role.members.length+' 位人員');
  if(typeof toast==='function')toast('人員與部門已調整並留下異動紀錄');
  setTimeout(()=>location.reload(),450);
 }
 window.addEventListener('hashchange',()=>setTimeout(enhance,0));
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-designer-role],[data-designer-tab]'))setTimeout(enhance,0);
  if(event.target.closest('[data-v156-save]')){event.preventDefault();saveAssignment()}
 });
 document.addEventListener('change',event=>{
  if(!event.target.matches('[data-member]'))return;
  const select=document.querySelector('[data-member-department="'+event.target.dataset.member+'"]');
  if(select)select.disabled=!event.target.checked;
 });
 setTimeout(enhance,0);
})();

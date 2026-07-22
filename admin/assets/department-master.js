(function(){
 'use strict';
 const masterKey='bombhr-department-master-v171',resetKey='bombhr-department-master-v171-reset',roleKey='bombhr-role-designer-v147',uiKey='bombhr-role-designer-ui';
 const defaults=['營運管理部','技術部','企劃部','財務人事行政部'];
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(e){return fallback}};
 if(!localStorage.getItem(resetKey)){localStorage.setItem(masterKey,JSON.stringify(defaults));localStorage.setItem(resetKey,new Date().toISOString())}
 const departments=()=>read(masterKey,defaults),save=list=>localStorage.setItem(masterKey,JSON.stringify(list));
 function currentRole(){try{const id=JSON.parse(sessionStorage.getItem(uiKey)||'{}').role||'owner';return read(roleKey,{})[id]||{departments:[]}}catch(e){return{departments:[]}}}
 function render(){
  if(location.hash!=='#permissions')return;const grid=document.querySelector('.department-check-grid');if(!grid)return;
  const selected=new Set([...(currentRole().departments||[]),...[...grid.querySelectorAll('[data-role-department]:checked')].map(input=>input.dataset.roleDepartment)]),list=departments(),signature=JSON.stringify([list,[...selected].sort()]);
  if(grid.dataset.masterSignature!==signature){grid.innerHTML=list.map(name=>`<label><input type="checkbox" data-role-department="${name}" ${selected.has(name)?'checked':''}>${name}</label>`).join('');grid.dataset.masterSignature=signature}
  let actions=grid.parentElement.querySelector('.department-master-actions');if(!actions){actions=document.createElement('div');actions.className='department-master-actions';actions.innerHTML='<button type="button" class="department-add-btn" id="addDepartmentBtn">＋ 新增部門</button><button type="button" class="department-delete-btn" id="deleteDepartmentBtn">刪除部門</button>';grid.after(actions)}
 }
 function addDepartment(event){if(!event.target.closest('#addDepartmentBtn'))return;event.preventDefault();event.stopImmediatePropagation();openModal('新增管理部門','新增後可立即指派給身份與主管',`<label class="form-field">部門名稱<input id="newDepartmentName" class="form-control" placeholder="例如：法務部"></label><p id="departmentMasterError" class="form-error"></p>`,`<button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="confirmAddDepartment">建立部門</button>`)}
 function confirmAdd(event){if(!event.target.closest('#confirmAddDepartment'))return;event.preventDefault();event.stopImmediatePropagation();const input=document.getElementById('newDepartmentName'),name=(input?.value||'').trim(),box=document.getElementById('departmentMasterError'),list=departments();if(!name){box.textContent='請輸入部門名稱';return}if(list.includes(name)){box.textContent='此部門已存在';return}list.push(name);save(list);if(typeof addAudit==='function')addAudit('新增管理部門',name);closeModal();render();toast('已新增「'+name+'」')}
 function deleteDepartment(event){if(!event.target.closest('#deleteDepartmentBtn'))return;event.preventDefault();event.stopImmediatePropagation();const list=departments();openModal('刪除管理部門','已被身份或主管使用的部門必須先取消指派',`<label class="form-field">選擇部門<select id="deleteDepartmentSelect" class="form-control">${list.map(name=>`<option value="${name}">${name}</option>`).join('')}</select></label><p id="departmentDeleteError" class="form-error"></p>`,`<button class="secondary-btn" data-modal-close>取消</button><button class="danger-action-btn" id="confirmDeleteDepartment">確認刪除</button>`)}
 function confirmDelete(event){
  if(!event.target.closest('#confirmDeleteDepartment'))return;event.preventDefault();event.stopImmediatePropagation();const name=document.getElementById('deleteDepartmentSelect')?.value,roles=read(roleKey,{}),used=[];
  Object.values(roles).forEach(role=>{const direct=(role.departments||[]).includes(name),personal=Object.values(role.memberDepartments||{}).some(list=>(list||[]).includes(name));if(direct||personal)used.push(role.name||'未命名身份')});
  if(used.length){document.getElementById('departmentDeleteError').textContent='目前由「'+[...new Set(used)].join('、')+'」使用，請先取消指派';return}
  const list=departments().filter(item=>item!==name);if(!list.length){document.getElementById('departmentDeleteError').textContent='至少必須保留一個部門';return}save(list);if(typeof addAudit==='function')addAudit('刪除管理部門',name);closeModal();render();toast('已刪除「'+name+'」')
 }
 window.addEventListener('click',addDepartment,true);window.addEventListener('click',confirmAdd,true);window.addEventListener('click',deleteDepartment,true);window.addEventListener('click',confirmDelete,true);
 let queued=false;const refresh=()=>{if(queued)return;queued=true;setTimeout(()=>{queued=false;render()},0)};new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',refresh);refresh();
})();

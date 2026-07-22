(function(){
 'use strict';
 const roleKey='bombhr-role-designer-v147',uiKey='bombhr-role-designer-ui';
 const defaultRoles={owner:{name:'最高權限',protected:true,members:['AB00001']},manager:{name:'副理／經理',protected:false,members:[]},hradmin:{name:'財務人事行政',protected:false,members:['AB00010']},system:{name:'系統管理員',protected:false,members:['AB00001','AB00002','AB00003','AB00006']},employee:{name:'一般員工',protected:false,members:['AB00004','AB00005','AB00007','AB00008','AB00009']}};
 const read=()=>{try{return JSON.parse(localStorage.getItem(roleKey)||'{}')}catch(e){return{}}};
 const write=data=>localStorage.setItem(roleKey,JSON.stringify(data));
 function error(message){const box=document.getElementById('identityCreateError');if(box)box.textContent=message}
 function createIdentity(event){
  const button=event.target.closest&&event.target.closest('#confirmCreateIdentity');if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();
  const input=document.getElementById('customIdentityName'),name=(input?.value||'').trim();
  if(!name){error('請輸入身份顯示名稱');input?.focus();return}
  const data=read();
  if(Object.values(data).some(role=>role&&role.name===name)){error('此身份名稱已存在，請使用其他名稱');input?.focus();return}
  const selected=document.querySelector('input[name="identityTemplate"]:checked'),template=selected?.value||'custom',id=(template==='supervisor'?'supervisor-custom-':'custom-')+Date.now();
  const permissions={organization:'hidden',employees:'hidden',attendance:'hidden',scheduling:'hidden',approvals:'hidden',payroll:'hidden',permissions:'hidden',settings:'hidden'};
  const sensitive={salaryView:false,salaryEdit:false,salaryExport:false,bankMasked:false,bankFull:false,identity:false,address:false,insurance:false,medical:false,audit:false};
  data[id]=template==='supervisor'?{name,en:'Custom Department Supervisor',description:'自訂主管身份・依人員與部門設定管理範圍',baseType:'supervisor',protected:false,scope:'managed',departments:[],memberDepartments:{},includeChildren:true,includeActing:true,includeSupport:false,members:[],permissions:{...permissions,organization:'view',employees:'edit',attendance:'edit',scheduling:'manage',approvals:'manage',payroll:'view'},sensitive:{...sensitive,salaryView:true,medical:true}}:{name,en:'Custom Role',description:'由最高權限自訂資料範圍與功能',protected:false,scope:'self',members:[],permissions,sensitive};
  delete data.supervisor;write(data);
  const saved=read();if(!saved[id]){error('身份建立失敗，請重新整理頁面後再試一次');return}
  sessionStorage.setItem(uiKey,JSON.stringify({role:id,tab:'scope'}));
  if(typeof addAudit==='function')addAudit('新增身份群組',name+'・'+id);
  button.disabled=true;button.textContent='建立完成，正在開啟…';
  location.hash='permissions';location.reload();
 }
 function selectedRoleId(){const active=document.querySelector('[data-designer-role].active');if(active)return active.dataset.designerRole;try{return JSON.parse(sessionStorage.getItem(uiKey)||'{}').role||'owner'}catch(e){return'owner'}}
 function roleRecord(id){return read()[id]||defaultRoles[id]||null}
 function installActions(){
  if(location.hash!=='#permissions'||typeof currentRole==='function'&&currentRole()!=='executive')return;
  const header=document.querySelector('.identity-list-head'),add=document.getElementById('addIdentityBtn');if(!header||!add)return;
  document.querySelectorAll('[data-delete-identity]').forEach(button=>button.remove());
  let actions=header.querySelector('.identity-primary-actions');if(!actions){actions=document.createElement('div');actions.className='identity-primary-actions';header.append(actions);actions.append(add)}else if(add.parentElement!==actions)actions.prepend(add);
  let remove=document.getElementById('deleteIdentityBtn');if(!remove){remove=document.createElement('button');remove.id='deleteIdentityBtn';remove.type='button';remove.textContent='刪除身份';actions.append(remove)}
  const id=selectedRoleId(),role=roleRecord(id),blocked=!role||role.protected||id==='owner';remove.disabled=blocked;remove.dataset.roleId=id;remove.title=blocked?'最高權限為受保護身份，不能刪除':'刪除目前選取的身份';remove.className=blocked?'identity-delete-main disabled':'identity-delete-main';
 }
 function requestDelete(event){
  const button=event.target.closest&&event.target.closest('#deleteIdentityBtn');if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();if(button.disabled)return;
  const id=button.dataset.roleId||selectedRoleId(),role=roleRecord(id);if(!role||role.protected||id==='owner'){if(typeof toast==='function')toast('最高權限為受保護身份，不能刪除');return}
  const roster=window.BOMBHR_IMPORTED_PERSONNEL||[],assigned=(role.members||[]).map(employeeId=>roster.find(person=>person.employeeId===employeeId)||{name:'未知人員',employeeId});
  if(assigned.length){openModal('無法刪除身份','此身份仍有已指派人員，請先取消指派後再刪除',`<div class="permission-locked"><b>需先移除 ${assigned.length} 位人員</b><span>${assigned.map(person=>person.name+'・'+person.employeeId).join('、')}</span></div>`,`<button class="primary-btn" data-modal-close>我知道了</button>`);return}
  openModal('確認刪除身份','此動作無法復原，歷史稽核紀錄仍會保留',`<div class="danger-confirm"><b>${role.name}</b><span>目前沒有指派人員，可以安全刪除。</span></div>`,`<button class="secondary-btn" data-modal-close>取消</button><button class="danger-action-btn" id="confirmIdentityDelete" data-role-id="${id}">確認刪除</button>`)
 }
 function confirmDelete(event){
  const button=event.target.closest&&event.target.closest('#confirmIdentityDelete');if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();const id=button.dataset.roleId,role=roleRecord(id);if(!role||role.protected||id==='owner')return;
  const data=read();delete data[id];write(data);const removed=(()=>{try{return JSON.parse(localStorage.getItem('bombhr-deleted-role-ids')||'[]')}catch(e){return[]}})();if(!removed.includes(id))removed.push(id);localStorage.setItem('bombhr-deleted-role-ids',JSON.stringify(removed));if(typeof addAudit==='function')addAudit('刪除身份群組',role.name+'・'+id+'・未指派人員');sessionStorage.setItem(uiKey,JSON.stringify({role:'owner',tab:'scope'}));button.disabled=true;button.textContent='刪除完成…';location.hash='permissions';location.reload()
 }
 document.addEventListener('click',createIdentity,true);
 document.addEventListener('click',requestDelete,true);
 document.addEventListener('click',confirmDelete,true);
 document.addEventListener('click',event=>{if(event.target.closest&&event.target.closest('[data-designer-role]'))setTimeout(installActions,0)},true);
 new MutationObserver(()=>setTimeout(installActions,0)).observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',()=>setTimeout(installActions,0));setTimeout(installActions,0);
})();

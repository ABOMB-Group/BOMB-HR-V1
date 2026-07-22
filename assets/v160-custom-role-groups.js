(function(){
 'use strict';
 const key='bombhr-role-designer-v147',uiKey='bombhr-role-designer-ui';
 const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch(e){return{}}};
 const save=data=>localStorage.setItem(key,JSON.stringify(data));
 function enhance(){
  if(location.hash!=='#permissions')return;
  document.querySelector('[data-designer-role="supervisor"]')?.remove();
  const ui=(()=>{try{return JSON.parse(sessionStorage.getItem(uiKey)||'{}')}catch(e){return{}}})(),data=read(),active=data[ui.role];
  if(active?.baseType==='supervisor'){const assignmentTab=document.querySelector('[data-designer-tab="assignment"]');if(assignmentTab)assignmentTab.textContent='人員與部門'}
  if(active?.baseType==='supervisor'&&ui.tab==='assignment'){
   document.querySelectorAll('[data-assignment-row]').forEach(row=>{if(row.querySelector('[data-member-department]'))return;const member=row.querySelector('[data-member]'),person=(window.BOMBHR_IMPORTED_PERSONNEL||[]).find(item=>item.employeeId===member?.dataset.member);if(!member||!person)return;const selected=(active.memberDepartments||{})[person.employeeId]?.[0]||person.department,select=document.createElement('select');select.dataset.memberDepartment=person.employeeId;select.innerHTML=['企劃','技術','財務/人事'].map(dept=>'<option value="'+dept+'"'+(dept===selected?' selected':'')+'>'+dept+'</option>').join('');select.disabled=!member.checked;row.insertBefore(select,member)});
   const button=document.querySelector('[data-save-role]');if(button){button.removeAttribute('data-save-role');button.dataset.v160Save='1'}
  }
  const modal=document.getElementById('modal'),confirm=document.getElementById('confirmCreateIdentity');
  if(!modal?.classList.contains('open')||!confirm||confirm.dataset.customGroupReady)return;
  const replacement=confirm.cloneNode(true);replacement.dataset.customGroupReady='1';confirm.replaceWith(replacement);
  replacement.onclick=()=>{
   const template=document.querySelector('input[name="identityTemplate"]:checked')?.value||'custom';
   const name=document.getElementById('customIdentityName').value.trim();
   if(!name){document.getElementById('identityCreateError').textContent='請輸入身份群組名稱';return}
   const data=read(),id=(template==='supervisor'?'supervisor-custom-':'custom-')+Date.now();
   const modules=['organization','employees','attendance','scheduling','approvals','payroll','permissions','settings'];
   const role=template==='supervisor'?{name,en:'Custom Department Supervisor',description:'自訂主管身份・依人員與部門設定管理範圍',baseType:'supervisor',protected:false,scope:'managed',departments:[],memberDepartments:{},includeChildren:true,includeActing:true,includeSupport:false,members:[],permissions:{organization:'view',employees:'edit',attendance:'edit',scheduling:'manage',approvals:'manage',payroll:'view',permissions:'hidden',settings:'hidden'},sensitive:{salaryView:true,salaryEdit:false,salaryExport:false,bankMasked:false,bankFull:false,identity:false,address:false,insurance:false,medical:true,audit:false}}:{name,en:'Custom Role',description:'由最高權限自訂資料範圍與功能',protected:false,scope:'self',members:[],permissions:Object.fromEntries(modules.map(item=>[item,'hidden'])),sensitive:{salaryView:false,salaryEdit:false,salaryExport:false,bankMasked:false,bankFull:false,identity:false,address:false,insurance:false,medical:false,audit:false}};
   data[id]=role;delete data.supervisor;save(data);sessionStorage.setItem(uiKey,JSON.stringify({role:id,tab:'scope'}));if(typeof closeModal==='function')closeModal();location.hash='permissions';window.dispatchEvent(new HashChangeEvent('hashchange'));if(typeof addAudit==='function')addAudit('新增身份群組',name);toast('已建立「'+name+'」，請設定人員與部門')
 };
 }
 document.addEventListener('change',event=>{if(!event.target.matches('[data-member]'))return;const select=document.querySelector('[data-member-department="'+event.target.dataset.member+'"]');if(select)select.disabled=!event.target.checked});
 document.addEventListener('click',event=>{const button=event.target.closest('[data-v160-save]');if(!button)return;event.preventDefault();const ui=JSON.parse(sessionStorage.getItem(uiKey)||'{}'),data=read(),role=data[ui.role];if(!role)return;const checked=[...document.querySelectorAll('[data-member]:checked')];role.members=checked.map(item=>item.dataset.member);role.memberDepartments={};checked.forEach(item=>{const select=document.querySelector('[data-member-department="'+item.dataset.member+'"]');role.memberDepartments[item.dataset.member]=select?[select.value]:[]});save(data);if(typeof addAudit==='function')addAudit('調整主管人員與部門',role.name+'・'+role.members.length+' 位');toast('人員與部門已同步至後台帳號及所有資料範圍');setTimeout(()=>location.reload(),350)},true);
 new MutationObserver(()=>setTimeout(enhance,0)).observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',()=>setTimeout(enhance,0));setTimeout(enhance,0);
})();

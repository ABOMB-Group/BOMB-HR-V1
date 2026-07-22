(function(){
 'use strict';
 const roleKey='bombhr-role-designer-v147',uiKey='bombhr-role-designer-ui';
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
 document.addEventListener('click',createIdentity,true);
})();

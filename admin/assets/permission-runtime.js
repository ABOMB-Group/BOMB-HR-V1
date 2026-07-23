(function(){
 'use strict';
 const ROLE_KEY='bombhr-role-designer-v147';
 const labels={organization:'組織管理',employees:'員工人事',attendance:'出勤與裝置',scheduling:'排班月曆',approvals:'簽核中心',payroll:'薪資管理',eventlog:'事件紀錄',permissions:'角色與權限',settings:'企業設定'};
 const read=()=>{try{return JSON.parse(localStorage.getItem(ROLE_KEY)||'{}')}catch(e){return {}}};
 function roleForCurrentAccount(){
  const profile=typeof currentProfile==='function'?currentProfile():null;if(!profile)return null;
  const entries=Object.entries(read()).filter(([,role])=>(role.members||[]).includes(profile.id));
  if(!entries.length)return null;
  const match=entries.find(([,role])=>profile.role==='supervisor'&&(role.baseType==='supervisor'||role.scope==='managed'))
   ||entries.find(([,role])=>profile.role==='executive'&&role.protected)
   ||entries.find(([,role])=>profile.role==='hradmin'&&/人事|財務/.test(role.name||''))
   ||entries[0];
  return {id:match[0],...match[1]};
 }
 function level(route){
  if(route==='dashboard'||route==='announcements'||route==='reports')return 'view';
  const role=roleForCurrentAccount();
  if(role?.permissions&&Object.prototype.hasOwnProperty.call(role.permissions,route))return role.permissions[route]||'hidden';
  if(route==='eventlog'&&role)return role.sensitive?.audit?'view':'hidden';
  const profile=typeof currentProfile==='function'?currentProfile():null;
  return profile&&(profile.routes==='*'||profile.routes?.includes(route))?'view':'hidden';
 }
 const allowed=route=>level(route)!=='hidden';
 function cleanGroups(){
  const nav=document.getElementById('mainNav');if(!nav)return;
  [...nav.querySelectorAll('.nav-group')].forEach(group=>{
   let next=group.nextElementSibling,hasItem=false;
   while(next&&!next.classList.contains('nav-group')){if(next.matches('.nav-item:not([hidden])'))hasItem=true;next=next.nextElementSibling}
   group.hidden=!hasItem;
  });
 }
 function enforceNavigation(){
  const nav=document.getElementById('mainNav');if(!nav)return;
  nav.querySelectorAll('[data-route]').forEach(button=>{const show=allowed(button.dataset.route);button.hidden=!show;button.style.display=show?'':'none';button.setAttribute('aria-hidden',String(!show))});
  cleanGroups();
 }
 function guardRoute(){
  const route=location.hash.slice(1)||'dashboard';
  if(allowed(route))return true;
  if(typeof addAudit==='function'){const profile=currentProfile();addAudit('阻擋隱藏功能存取',`${labels[route]||route}・${profile.name}・${profile.id}・${profile.label}`)}
  history.replaceState(null,'','#dashboard');
  if(typeof toast==='function')toast(`此身份未開放「${labels[route]||route}」`);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  return false;
 }
 function apply(){enforceNavigation();guardRoute();document.body.dataset.permissionLevel=level(location.hash.slice(1)||'dashboard')}
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-route]');if(!button||allowed(button.dataset.route))return;
  event.preventDefault();event.stopImmediatePropagation();toast('此功能已設定為不顯示');
 },true);
 window.addEventListener('hashchange',()=>setTimeout(apply,0));
 window.addEventListener('storage',event=>{if(event.key===ROLE_KEY)setTimeout(apply,0)});
 new MutationObserver(()=>enforceNavigation()).observe(document.getElementById('mainNav'),{childList:true,subtree:true});
 setTimeout(apply,0);
 window.BOMBHR_PERMISSION_RUNTIME={roleForCurrentAccount,level,allowed,apply};
})();

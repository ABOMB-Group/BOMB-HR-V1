(function(){
 'use strict';
 const KEY='bombhr-app-modules-v196';
 const defaults={attendance:true,scheduling:true,requests:true,payroll:true,training:true,aiAssistant:false,benefits:true,announcements:true};
 function read(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}'),attendance:true}}catch(e){return {...defaults}}}
 function hide(el,value){el?.classList.toggle('module-hidden-by-company',value)}
 function apply(){
  const value=read();
  try{Object.assign(companyModules,value);initModules()}catch(e){}
  document.querySelectorAll('[data-module]').forEach(el=>hide(el,value[el.dataset.module]===false));
  const schedule=document.querySelector('#scheduleView');
  const calendar=schedule?.querySelector('.card');
  hide(calendar,value.scheduling===false);
  const applyGrid=schedule?.querySelector('.apply-grid');
  const applyHeading=applyGrid?.previousElementSibling;
  hide(applyGrid,value.requests===false);
  if(applyHeading?.classList.contains('section-line'))hide(applyHeading,value.requests===false);
 }
 window.addEventListener('storage',event=>{if(event.key===KEY)apply()});
 window.addEventListener('bombhr-app-modules-changed',apply);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply()});
 try{const channel=new BroadcastChannel('bombhr-enterprise-settings');channel.onmessage=event=>{if(event.data?.type==='modules')apply()}}catch(e){}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
 window.BOMBHR_APP_MODULE_SYNC={read,apply,key:KEY};
})();

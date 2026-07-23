(function(){
 'use strict';
 const SESSION='bombhr-app-session-v201';
 const defaults=[
  ['OG','AB00001','企劃','企劃-經理辦公室','AB00001','立即啟用'],
  ['KEN','AB00002','企劃','技術企劃','AB00001','立即啟用'],
  ['RU','AB00003','企劃','CS主管','AB00002','立即啟用'],
  ['弦','AB00004','企劃','CS組長','AB00003','立即啟用'],
  ['鬼','AB00005','企劃','CS組長','AB00003','立即啟用'],
  ['肉肉','AB00006','技術','技術長','AB00001','立即啟用'],
  ['晴','AB00007','技術','全端工程師','AB00006','立即啟用'],
  ['佑','AB00008','技術','前端工程師','AB00006','立即啟用'],
  ['津','AB00009','技術','設計師','AB00006','立即啟用'],
  ['魚','AB00010','財務/人事','主管','AB00001','立即啟用']
 ].map(([name,employeeId,department,position,managerId,accountStatus])=>({name,employeeId,department,position,managerId,accountStatus,status:'在職',location:'台中總公司'}));
 const parse=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch(e){return fallback}};
 const parseSession=(key,fallback)=>{try{return JSON.parse(sessionStorage.getItem(key)||'null')||fallback}catch(e){return fallback}};
 function roster(){
  const custom=[...parse('bombhr-custom-employees-v147',[]),...parse('bombhr-custom-employees',[])],overrides=parse('bombhr-employee-org-overrides',{});
  const unique=new Map([...defaults,...custom].map(person=>[person.employeeId,{...person,...(overrides[person.employeeId]||{})}]));
  return [...unique.values()].map(person=>({...person,manager:person.manager||unique.get(person.managerId)?.name||'無'}));
 }
 function active(person){return person&&!['離職','停用'].includes(person.status)&&!['停用','暫不啟用'].includes(person.accountStatus)}
 function apply(person){
  window.BOMBHR_APP_EMPLOYEE=person;
  document.body.classList.remove('app-auth-pending');
  const greeting=document.getElementById('dynamicGreeting');if(greeting)greeting.textContent=`您好，${person.name} 👋`;
  const fields={profileName:person.name,profileEmployeeId:person.employeeId,profileDepartment:person.department,profilePosition:person.position,profilePhone:person.phone,profileEmail:person.email,profileEmergency:person.emergencyContact||person.manager,profileEmergencyPhone:person.emergencyPhone};
  Object.entries(fields).forEach(([id,value])=>{const input=document.getElementById(id);if(input)input.value=value||''});
  const name=document.getElementById('profileName');
  const profile=name?.closest('.profile-card')||document.querySelector('.profile-card');
  if(profile){const title=profile.querySelector('h3'),copy=profile.querySelector('h3+p');if(title)title.textContent=person.name;if(copy)copy.textContent=`${person.department}・${person.position}・員工編號 ${person.employeeId}`}
  const initial=document.getElementById('avatarInitial');if(initial)initial.textContent=person.name[0];
  window.dispatchEvent(new CustomEvent('bombhr-app-employee-ready',{detail:person}));
 }
 function gate(){
  document.body.classList.add('app-auth-pending');
  const el=document.createElement('div');el.className='employee-login-gate';el.innerHTML=`<form class="employee-login-card" id="employeeLoginForm"><div class="employee-login-brand"><img src="../assets/bombhr-logo.png" alt="BOMB HR"><div><b>BOMB HR</b><small>EMPLOYEE APP</small></div></div><h1>員工登入</h1><p>請使用人事主檔建立的員工編號登入。停用或離職帳號無法進入。</p><label>員工編號<input id="appEmployeeId" autocomplete="username" placeholder="例如 AB00008" required></label><label>登入密碼<input id="appEmployeePassword" type="password" autocomplete="current-password" placeholder="Demo 密碼：bombhr" required></label><p class="employee-login-error" id="employeeLoginError"></p><button type="submit">登入 Employee App</button><div class="employee-login-demo">Demo：可使用 AB00001～AB00010，密碼皆為 bombhr。正式版將改由伺服器驗證密碼。</div></form>`;document.body.append(el);
  el.querySelector('form').onsubmit=event=>{event.preventDefault();const id=el.querySelector('#appEmployeeId').value.trim().toUpperCase(),password=el.querySelector('#appEmployeePassword').value,person=roster().find(item=>String(item.employeeId).toUpperCase()===id);if(!person||password!=='bombhr'){el.querySelector('#employeeLoginError').textContent='員工編號或密碼不正確。';return}if(!active(person)){el.querySelector('#employeeLoginError').textContent='此帳號已停用，請聯絡人事單位。';return}sessionStorage.setItem(SESSION,JSON.stringify({employeeId:person.employeeId,loginAt:new Date().toISOString()}));location.reload()};
 }
 const saved=parseSession(SESSION,null),person=saved&&roster().find(item=>item.employeeId===saved.employeeId);
 if(active(person))apply(person);else gate();
 function refreshCurrent(){const current=window.BOMBHR_APP_EMPLOYEE,next=current&&roster().find(item=>item.employeeId===current.employeeId);if(active(next))apply(next)}
 window.addEventListener('storage',event=>{if(['bombhr-custom-employees-v147','bombhr-custom-employees','bombhr-employee-org-overrides'].includes(event.key))refreshCurrent()});
 window.addEventListener('focus',refreshCurrent);
 window.BOMBHR_APP_AUTH={roster,current:()=>window.BOMBHR_APP_EMPLOYEE,logout:()=>{sessionStorage.removeItem(SESSION);location.reload()}};
})();

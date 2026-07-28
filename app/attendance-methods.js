(function(){
 'use strict';
 const KEY='bombhr-attendance-methods';
 const defaults={deviceLocation:true,wifi:true,qr:false,beacon:false,nfc:false};
 const methodKey={WiFi:'wifi','QR Code':'qr',NFC:'nfc',Beacon:'beacon',GPS:'deviceLocation'};
 function read(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}'),deviceLocation:true}}catch(e){return {...defaults}}}
 function allowed(method){return read()[methodKey[method]||'deviceLocation']!==false}
 function identify(){
  document.querySelectorAll('.method-card').forEach(card=>{
   const call=card.getAttribute('onclick')||'';
   const method=(call.match(/selectMethod\('([^']+)'/)||[])[1];
   if(method)card.dataset.attendanceMethod=methodKey[method]||'deviceLocation';
  });
 }
 function ensureBeacon(){
  const grid=document.querySelector('#punchView .method-grid');
  if(!grid||grid.querySelector('[data-attendance-method="beacon"]'))return;
  const gps=grid.querySelector('[data-attendance-method="deviceLocation"]');
  const button=document.createElement('button');
  button.className='method-card method-card-beacon';
  button.dataset.attendanceMethod='beacon';
  button.setAttribute('onclick',"selectMethod('Beacon',this)");
  button.innerHTML='<div class="method-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 4v16M9 7l3-3 3 3M9 17l3 3 3-3"></path><path class="method-icon-signal" d="M7.4 7.5a6.2 6.2 0 0 0 0 9M16.6 7.5a6.2 6.2 0 0 1 0 9"></path></svg></div><b>Beacon 藍牙</b><small>接近公司 Beacon 後完成驗證</small>';
  grid.insertBefore(button,gps||null);
 }
 function apply(){
  identify();ensureBeacon();
  const values=read();
  document.querySelectorAll('[data-attendance-method]').forEach(card=>{
   const enabled=values[card.dataset.attendanceMethod]!==false;
   card.hidden=!enabled;
   card.setAttribute('aria-hidden',String(!enabled));
  });
  const active=document.querySelector('.method-card.active');
  if(active?.hidden){
   const next=[...document.querySelectorAll('.method-card')].find(card=>!card.hidden);
   next?.click();
  }
 }
 const originalSelect=selectMethod;
 selectMethod=function(method,button){
  if(!allowed(method)){toast(`${method} 尚未由企業開啟`);return}
  originalSelect(method,button);
  if(method==='Beacon'){
   document.getElementById('methodPanelTitle').textContent='Beacon 藍牙驗證待命';
   document.getElementById('methodPanelText').textContent='請開啟藍牙並接近公司 Beacon 設備後完成驗證。';
   document.getElementById('activeMethodText').textContent='Beacon 藍牙';
  }
 };
 const originalPunch=punch;
 punch=function(){if(!allowed(activeMethod)){toast('目前打卡方式已由企業停用，請重新選擇');apply();return}originalPunch()};
 window.addEventListener('storage',event=>{if(event.key===KEY)apply()});
 window.addEventListener('bombhr-attendance-methods-changed',apply);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply()});
 try{const channel=new BroadcastChannel('bombhr-attendance-methods');channel.onmessage=apply}catch(e){}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
 window.BOMBHR_APP_ATTENDANCE_METHODS={key:KEY,read,apply,allowed};
})();

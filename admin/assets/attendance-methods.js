(function(){
 'use strict';
 const KEY='bombhr-attendance-methods';
 const defaults={deviceLocation:true,wifi:true,qr:false,beacon:false,nfc:false};
 const rows=[
  ['deviceLocation','裝置綁定＋位置','預設必要條件',true],
  ['wifi','指定 Wi-Fi','企業選用'],
  ['qr','QR Code','企業選用'],
  ['beacon','Beacon 藍牙','企業選用'],
  ['nfc','NFC 感應','特殊場域選用']
 ];
 function read(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}'),deviceLocation:true}}catch(e){return {...defaults}}}
 function write(value){
  value.deviceLocation=true;
  localStorage.setItem(KEY,JSON.stringify(value));
  try{new BroadcastChannel('bombhr-attendance-methods').postMessage(value)}catch(e){}
  window.dispatchEvent(new CustomEvent('bombhr-attendance-methods-changed',{detail:value}));
 }
 function row([key,name,note,locked],values){
  return `<div class="setting-row"><div><b>${name}</b><small>${note}</small></div><label class="switch"><input data-attendance-method="${key}" type="checkbox" ${values[key]?'checked':''} ${locked?'disabled':''}><span></span></label></div>`;
 }
 methodsTab=function(){
  const values=read();
  return panel('企業打卡方式','開關會立即儲存並同步至 Employee App',`<div class="settings-grid">${rows.map(item=>row(item,values)).join('')}</div><div class="policy-note" data-attendance-method-status>裝置綁定＋位置固定啟用；其他方式可依企業場域開放。</div>`);
 };
 function bind(){
  document.querySelectorAll('[data-attendance-method]').forEach(input=>{
   input.onchange=()=>{
    const value=read();
    value[input.dataset.attendanceMethod]=input.checked;
    write(value);
    const status=document.querySelector('[data-attendance-method-status]');
    if(status)status.textContent=`已儲存：${input.closest('.setting-row')?.querySelector('b')?.textContent||'打卡方式'}${input.checked?'已開啟':'已關閉'}，Employee App 將同步更新。`;
    if(typeof addAudit==='function')addAudit('調整企業打卡方式',`${input.dataset.attendanceMethod}・${input.checked?'啟用':'停用'}`);
    toast(`${input.checked?'已開啟':'已關閉'}並同步 Employee App`);
   };
  });
 }
 const priorBindView=bindView;
 bindView=function(route){priorBindView(route);if(route==='attendance'||route==='tab')setTimeout(bind,0)};
 const priorBindTabs=bindTabs;
 bindTabs=function(map){
  const isAttendance=map&&Object.prototype.hasOwnProperty.call(map,'records')&&Object.prototype.hasOwnProperty.call(map,'methods');
  priorBindTabs(isAttendance?{...map,methods:methodsTab}:map);
 };
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-tab="methods"]'))setTimeout(()=>{
   const content=document.getElementById('tabContent');
   if(content)content.innerHTML=methodsTab();
   bind();
  },0);
 });
 setTimeout(()=>{if(location.hash==='#attendance'&&document.querySelector('[data-tab="methods"].active')){document.getElementById('tabContent').innerHTML=methodsTab();bind()}},0);
 window.BOMBHR_ATTENDANCE_METHODS={key:KEY,read,write,bind};
})();

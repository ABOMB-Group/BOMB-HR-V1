(function(){
 'use strict';
 const MODULE_KEY='bombhr-app-modules-v196';
 const defaults={attendance:true,scheduling:true,requests:true,payroll:true,training:true,aiAssistant:false};
 const moduleRows=[
  ['attendance','打卡與出勤紀錄','核心功能，固定啟用','勤',true],
  ['scheduling','班表與營運月曆','顯示個人班表與排休意願','班'],
  ['requests','請假／加班／補卡','員工自助申請入口','申'],
  ['payroll','薪資表','查看薪資與扣款明細','薪'],
  ['training','教育訓練','課程與完成進度','學'],
  ['aiAssistant','AI 助理','企業智慧助理入口','AI']
 ];
 const read=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(MODULE_KEY)||'{}')}}catch(e){return {...defaults}}};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function switchMarkup(key,on,locked){return `<label class="switch" title="${locked?'核心功能不可關閉':'開啟或關閉'}"><input data-app-module="${key}" type="checkbox" ${on?'checked':''} ${locked?'disabled':''}><span></span></label>`}
 settingsApp=function(){
  const values=read();
  return panel('Employee App 功能開關','儲存後會同步套用至員工端；重新開啟頁面仍會保留設定',`<div class="enterprise-setting-intro"><i>APP</i><div><b>員工端顯示管理</b><small>依公司需求開放功能；打卡為必要核心功能。</small></div></div><div class="app-setting-grid">${moduleRows.map(([key,name,note,icon,locked])=>`<div class="app-setting-card"><span class="setting-symbol">${icon}</span><div class="setting-copy"><b>${name}</b><small>${note}</small></div>${locked?'<span class="setting-lock">固定啟用</span>':''}${switchMarkup(key,values[key],locked)}</div>`).join('')}</div>`)
 };
 leaveSettings=function(){
  const rules=window.BOMBHR_HR_LEDGER?.rules?.()||[];
  return panel('假別規則設定','清楚查看額度與期限；修改後按右上角「儲存變更」',`<div class="enterprise-setting-intro"><i>假</i><div><b>企業假別規則</b><small>旅遊假仍維持一次 7 天；婚假期限以月數控管。</small></div></div><div class="leave-setting-grid">${rules.map((r,i)=>`<div class="leave-setting-card" data-leave-card="${esc(r.id)}"><span class="setting-symbol">${esc(r.name.slice(0,1))}</span><div class="setting-copy"><b>${esc(r.name)}</b><small>${r.mode==='fixed'?`每次固定 ${esc(r.fixedDays||r.quota)} ${esc(r.unit)}`:`依剩餘額度扣除`}</small></div><label class="switch"><input data-leave-enabled type="checkbox" ${r.enabled!==false?'checked':''}><span></span></label><div class="leave-rule-fields"><label>可用額度<input data-leave-quota type="number" min="0" step="0.5" value="${esc(r.quota)}"></label><label>有效期限（月）<input data-leave-months type="number" min="0" step="1" value="${esc(r.validMonths||0)}"></label></div><input data-leave-json type="hidden" value="${encodeURIComponent(JSON.stringify(r))}"></div>`).join('')}</div>`)
 };
 function activeTab(){return document.querySelector('.tabs [data-tab].active')?.dataset.tab||'app'}
 function save(){
  const tab=activeTab();
  if(tab==='app'){
   const value=read();
   document.querySelectorAll('[data-app-module]').forEach(input=>value[input.dataset.appModule]=input.checked);
   value.attendance=true;
   localStorage.setItem(MODULE_KEY,JSON.stringify(value));
   try{new BroadcastChannel('bombhr-enterprise-settings').postMessage({type:'modules',value})}catch(e){}
   window.dispatchEvent(new CustomEvent('bombhr-app-modules-changed',{detail:value}));
   toast('Employee App 功能設定已儲存並同步');
  }else if(tab==='leave'){
   const rules=[...document.querySelectorAll('[data-leave-card]')].map(card=>{
    const base=JSON.parse(decodeURIComponent(card.querySelector('[data-leave-json]').value));
    base.enabled=card.querySelector('[data-leave-enabled]').checked;
    base.quota=Math.max(0,Number(card.querySelector('[data-leave-quota]').value)||0);
    base.validMonths=Math.max(0,Number(card.querySelector('[data-leave-months]').value)||0);
    if(base.mode==='fixed')base.fixedDays=base.quota;
    return base;
   });
   window.BOMBHR_HR_LEDGER?.saveRules?.(rules);
   toast('假別規則已儲存');
  }else toast('企業設定已儲存並留下稽核紀錄');
 }
 function bind(){
  if(location.hash!=='#settings')return;
  if(!document.querySelector('.tabs [data-tab]'))return;
  const button=document.querySelector('[data-save-settings]');
  if(button)button.onclick=save;
 }
 const priorTabs=bindTabs;
 bindTabs=function(map){
  const isSettings=map&&Object.prototype.hasOwnProperty.call(map,'app')&&Object.prototype.hasOwnProperty.call(map,'leave');
  priorTabs(isSettings?{...map,app:settingsApp,leave:leaveSettings}:map);
 };
 const priorBind=bindView;
 bindView=function(route){priorBind(route);if(route==='settings'||route==='tab')setTimeout(bind,0)};
 setTimeout(()=>{
  if(location.hash==='#settings'){
   const tab=activeTab(),content=document.getElementById('tabContent');
   if(content&&(tab==='app'||tab==='leave'))content.innerHTML=(tab==='leave'?leaveSettings:settingsApp)();
   bindTabs({app:settingsApp,leave:leaveSettings,notify:notifySettings,basic:basicSettings});
  }
  bind();
 },0);
 window.BOMBHR_ENTERPRISE_SETTINGS={read,save,key:MODULE_KEY};
})();

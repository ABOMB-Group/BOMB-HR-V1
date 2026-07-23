(function(){
 'use strict';
 const defaults={cellWidth:52,rowHeight:54,fontSize:11};
 const key=()=>`bombhr-schedule-table-view-v190-${currentProfile().id||'unknown'}`;
 const read=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(key())||'{}')}}catch(e){return {...defaults}}};
 const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
 const percent=value=>Math.round(value/defaults.cellWidth*100);
 function toolbar(){
   const value=read();
   return `<div class="schedule-table-tools"><strong>表格顯示</strong><div class="schedule-table-tool-group"><button type="button" data-table-size="-1" title="縮小表格">−</button><span id="scheduleTableSize">${percent(value.cellWidth)}%</span><button type="button" data-table-size="1" title="放大表格">＋</button></div><div class="schedule-table-tool-group"><button type="button" data-font-size="-1" title="縮小文字">A−</button><span id="scheduleFontSize">${value.fontSize}px</span><button type="button" data-font-size="1" title="放大文字">A＋</button></div><button type="button" class="schedule-table-reset" data-table-reset>恢復預設</button><small>像 Excel 一樣即時調整，依 ${currentProfile().name} 的登入習慣保存</small><div class="schedule-color-legend"><span><i class="rest"></i>休</span><span><i class="annual"></i>年</span><span><i class="travel"></i>旅</span><span><i class="bereavement"></i>喪</span><span><i class="marriage"></i>婚</span><span><i class="sick"></i>病</span><span><i class="personal"></i>事</span></div></div>`;
 }
 function apply(value=read(),save=false){
   const content=document.getElementById('content');if(!content)return;
   content.style.setProperty('--schedule-cell-width',`${value.cellWidth}px`);
   content.style.setProperty('--schedule-row-height',`${value.rowHeight}px`);
   content.style.setProperty('--schedule-font-size',`${value.fontSize}px`);
   content.style.setProperty('--schedule-person-width',`${Math.round(270*(value.cellWidth/defaults.cellWidth))}px`);
   const size=document.getElementById('scheduleTableSize'),font=document.getElementById('scheduleFontSize');
   if(size)size.textContent=`${percent(value.cellWidth)}%`;if(font)font.textContent=`${value.fontSize}px`;
   if(save)localStorage.setItem(key(),JSON.stringify(value));
 }
 function bind(){
   apply();
   document.querySelectorAll('.schedule-matrix-cell').forEach(cell=>cell.dataset.code=cell.textContent.trim().replace('⚠',''));
   document.querySelectorAll('[data-table-size]').forEach(button=>button.onclick=()=>{const value=read(),delta=Number(button.dataset.tableSize);value.cellWidth=clamp(value.cellWidth+delta*4,36,80);value.rowHeight=clamp(value.rowHeight+delta*4,42,82);apply(value,true)});
   document.querySelectorAll('[data-font-size]').forEach(button=>button.onclick=()=>{const value=read();value.fontSize=clamp(value.fontSize+Number(button.dataset.fontSize),9,18);apply(value,true)});
   document.querySelector('[data-table-reset]')?.addEventListener('click',()=>{localStorage.removeItem(key());apply(defaults);toast('班表大小與文字已恢復預設')});
 }
 const baseSchedulingView=schedulingView;
 schedulingView=function(){return baseSchedulingView().replace('<div class="calendar-scroll">',toolbar()+'<div class="calendar-scroll">')};
 const priorBind=bindView;
 bindView=function(route){priorBind(route);if(route==='scheduling')setTimeout(bind,0)};
 window.BOMBHR_SCHEDULE_TABLE_TOOLS={read,apply,bind,defaults};
})();

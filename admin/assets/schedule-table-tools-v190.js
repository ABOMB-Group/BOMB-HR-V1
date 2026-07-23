(function(){
 'use strict';
 const defaults={cellWidth:52,rowHeight:54,fontSize:11};
 const key=()=>`bombhr-schedule-table-view-v190-${currentProfile().id||'unknown'}`;
 const read=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(key())||'{}')}}catch(e){return {...defaults}}};
 const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
 const percent=value=>Math.round(value/defaults.cellWidth*100);
 function toolbar(){
   const value=read();
   return `<div class="schedule-table-tools"><strong>表格顯示</strong><div class="schedule-table-tool-group"><button type="button" data-table-size="-1" title="縮小表格">−</button><input id="scheduleTableSize" type="number" min="69" max="154" step="1" value="${percent(value.cellWidth)}" aria-label="表格比例"><span>%</span><button type="button" data-table-size="1" title="放大表格">＋</button></div><strong>文字大小</strong><div class="schedule-table-tool-group"><button type="button" data-font-size="-1" title="縮小文字">A−</button><input id="scheduleFontSize" type="number" min="9" max="18" step="1" value="${value.fontSize}" aria-label="文字大小"><span>px</span><button type="button" data-font-size="1" title="放大文字">A＋</button></div><button type="button" class="schedule-table-reset" data-table-reset>恢復預設</button></div>`;
 }
 function apply(value=read(),save=false){
   const content=document.getElementById('content');if(!content)return;
   content.style.setProperty('--schedule-cell-width',`${value.cellWidth}px`);
   content.style.setProperty('--schedule-row-height',`${value.rowHeight}px`);
   content.style.setProperty('--schedule-font-size',`${value.fontSize}px`);
   content.style.setProperty('--schedule-person-width',`${Math.round(270*(value.cellWidth/defaults.cellWidth))}px`);
   const size=document.getElementById('scheduleTableSize'),font=document.getElementById('scheduleFontSize');
   if(size&&document.activeElement!==size)size.value=percent(value.cellWidth);if(font&&document.activeElement!==font)font.value=value.fontSize;
   if(save)localStorage.setItem(key(),JSON.stringify(value));
 }
 function bind(){
   apply();
   document.querySelectorAll('.schedule-matrix-cell').forEach(cell=>cell.dataset.code=cell.textContent.trim().replace('⚠',''));
   document.querySelectorAll('[data-table-size]').forEach(button=>button.onclick=()=>{const value=read(),delta=Number(button.dataset.tableSize);value.cellWidth=clamp(value.cellWidth+delta*4,36,80);value.rowHeight=clamp(value.rowHeight+delta*4,42,82);apply(value,true)});
   document.querySelectorAll('[data-font-size]').forEach(button=>button.onclick=()=>{const value=read();value.fontSize=clamp(value.fontSize+Number(button.dataset.fontSize),9,18);apply(value,true)});
   const sizeInput=document.getElementById('scheduleTableSize'),fontInput=document.getElementById('scheduleFontSize');
   const applySizeInput=()=>{const value=read(),requested=clamp(Number(sizeInput.value)||100,69,154),ratio=requested/100;value.cellWidth=clamp(Math.round(defaults.cellWidth*ratio),36,80);value.rowHeight=clamp(Math.round(defaults.rowHeight*ratio),42,82);sizeInput.value=percent(value.cellWidth);apply(value,true)};
   const applyFontInput=()=>{const value=read();value.fontSize=clamp(Number(fontInput.value)||defaults.fontSize,9,18);fontInput.value=value.fontSize;apply(value,true)};
   sizeInput?.addEventListener('change',applySizeInput);fontInput?.addEventListener('change',applyFontInput);
   sizeInput?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();applySizeInput();sizeInput.blur()}});
   fontInput?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();applyFontInput();fontInput.blur()}});
   document.querySelector('[data-table-reset]')?.addEventListener('click',()=>{localStorage.removeItem(key());apply(defaults);toast('班表大小與文字已恢復預設')});
 }
 const baseSchedulingView=schedulingView;
 schedulingView=function(){return baseSchedulingView().replace('<div class="calendar-scroll">',toolbar()+'<div class="calendar-scroll">')};
 const priorBind=bindView;
 bindView=function(route){priorBind(route);if(route==='scheduling')setTimeout(bind,0)};
 window.BOMBHR_SCHEDULE_TABLE_TOOLS={read,apply,bind,defaults};
})();

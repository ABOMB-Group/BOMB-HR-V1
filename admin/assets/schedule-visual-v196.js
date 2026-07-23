(function(){
 'use strict';
 function decorate(){
   if(location.hash!=='#scheduling')return;
   document.querySelectorAll('.schedule-date-cell.holiday').forEach(cell=>{
     const name=cell.getAttribute('title')||cell.querySelector('em')?.textContent||'國定假日';
     cell.dataset.holiday=name;
     cell.setAttribute('aria-label',`${cell.querySelector('b')?.textContent||''} 日，${name}`);
   });
 }
 const priorBind=bindView;
 bindView=function(route){priorBind(route);if(route==='scheduling')setTimeout(decorate,0)};
 document.addEventListener('click',event=>{
   if(location.hash==='#scheduling'&&event.target.closest('.month-nav,[data-schedule-edit-start],[data-schedule-edit-save]'))setTimeout(decorate,0);
 });
 setTimeout(decorate,0);
 window.BOMBHR_SCHEDULE_VISUAL={decorate};
})();

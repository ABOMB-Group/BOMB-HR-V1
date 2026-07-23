(function(){
 'use strict';
 function arrange(){
   const content=document.getElementById('content');if(!content||location.hash!=='#scheduling')return;
   content.querySelector('.schedule-legend')?.remove();
   const monthNav=content.querySelector('.schedule-toolbar .month-nav'),tools=content.querySelector('.schedule-table-tools');
   if(monthNav&&tools&&!monthNav.contains(tools))monthNav.append(tools);
   const editButton=content.querySelector('[data-schedule-edit-start]'),download=content.querySelector('a[href*="BOMB-HR-每月班表範例"]');
   if(editButton&&download){
     editButton.classList.add('schedule-head-edit-button');
     download.parentNode.insertBefore(editButton,download);
     const oldToolbar=content.querySelector('.schedule-edit-toolbar:not(.editing)');
     if(oldToolbar)oldToolbar.classList.add('is-moved');
   }
   const scroll=content.querySelector('.calendar-scroll:has(.schedule-month-matrix)'),panel=scroll?.closest('.panel'),importNote=content.querySelector('.schedule-import-note'),preference=content.querySelector('.preference-admin-card');
   if(panel&&(importNote||preference)){
     let bottom=content.querySelector('.schedule-page-bottom-blocks');
     if(!bottom){bottom=document.createElement('div');bottom.className='schedule-page-bottom-blocks';panel.after(bottom)}
     if(importNote&&!bottom.contains(importNote))bottom.append(importNote);
     if(preference&&!bottom.contains(preference))bottom.append(preference);
   }
 }
 const priorBind=bindView;
 bindView=function(route){priorBind(route);if(route==='scheduling')setTimeout(arrange,0)};
 setTimeout(arrange,0);
 window.BOMBHR_SCHEDULE_PAGE_LAYOUT={arrange};
})();

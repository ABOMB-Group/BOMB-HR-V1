(function(){
 'use strict';
 const ORDER_KEY='bombhr-schedule-code-order-v193';
 let dragging=null;
 function rows(){return [...document.querySelectorAll('.schedule-code-master>div')]}
 function save(){
   const order=rows().map(row=>row.dataset.scheduleCode).filter(Boolean);
   localStorage.setItem(ORDER_KEY,JSON.stringify(order));
   if(typeof addAudit==='function')addAudit('調整排班代號順序',`${order.join(' → ')}・${currentProfile().name} ${currentProfile().id}`);
   toast('排班代號順序已儲存，排班下拉選單與整月輸入已同步');
 }
 function prepare(){
   const master=document.querySelector('.schedule-code-master');if(!master)return;
   if(!master.previousElementSibling?.classList.contains('schedule-code-drag-help')){
     const help=document.createElement('div');help.className='schedule-code-drag-help';help.innerHTML='<b>☷ 拖曳排序</b><span>按住任一代號卡片，拖到想要的位置後放開</span>';master.before(help);
   }
   rows().forEach(row=>{
     const code=row.querySelector('strong')?.textContent.trim();if(!code)return;
     row.draggable=true;row.dataset.scheduleCode=code;
     if(!row.querySelector('.schedule-code-drag-handle')){const handle=document.createElement('span');handle.className='schedule-code-drag-handle';handle.textContent='⠿';handle.title='按住拖曳排序';row.prepend(handle)}
   });
 }
 document.addEventListener('dragstart',event=>{
   const row=event.target.closest?.('.schedule-code-master>div[draggable="true"]');if(!row)return;
   dragging=row;row.classList.add('dragging');event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',row.dataset.scheduleCode);
 });
 document.addEventListener('dragover',event=>{
   const row=event.target.closest?.('.schedule-code-master>div[draggable="true"]');if(!row||!dragging||row===dragging)return;
   event.preventDefault();rows().forEach(item=>item.classList.remove('drag-over'));row.classList.add('drag-over');
   const rect=row.getBoundingClientRect(),after=event.clientY>rect.top+rect.height/2||Math.abs(event.clientY-(rect.top+rect.height/2))<rect.height/2&&event.clientX>rect.left+rect.width/2;
   row.parentNode.insertBefore(dragging,after?row.nextSibling:row);
 });
 document.addEventListener('drop',event=>{if(!dragging)return;event.preventDefault();save()});
 document.addEventListener('dragend',()=>{rows().forEach(row=>row.classList.remove('dragging','drag-over'));dragging=null});
 const observer=new MutationObserver(()=>prepare());observer.observe(document.getElementById('content'),{childList:true,subtree:true});
 prepare();
 window.BOMBHR_SCHEDULE_CODE_DRAG={prepare,save,rows};
})();

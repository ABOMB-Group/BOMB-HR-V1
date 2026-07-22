(function(){
 'use strict';
 const key='bombhr-sidebar-collapsed',sidebar=document.getElementById('sidebar'),menu=document.getElementById('menuBtn'),close=document.getElementById('closeNav');
 const mobile=()=>window.matchMedia('(max-width:820px)').matches;
 function applySaved(){if(!mobile()&&localStorage.getItem(key)==='1')document.body.classList.add('sidebar-collapsed');else if(mobile())document.body.classList.remove('sidebar-collapsed')}
 function toggle(){if(mobile()){sidebar.classList.toggle('open');menu.setAttribute('aria-expanded',sidebar.classList.contains('open')?'true':'false');return}document.body.classList.toggle('sidebar-collapsed');const collapsed=document.body.classList.contains('sidebar-collapsed');localStorage.setItem(key,collapsed?'1':'0');menu.setAttribute('aria-label',collapsed?'展開左側導覽':'收合左側導覽');menu.setAttribute('aria-expanded',collapsed?'false':'true')}
 function closeMobile(){sidebar.classList.remove('open');menu.setAttribute('aria-expanded','false')}
 if(menu){menu.onclick=toggle;menu.setAttribute('aria-controls','sidebar')}if(close)close.onclick=closeMobile;
 document.addEventListener('click',event=>{if(mobile()&&event.target.closest('[data-route]'))closeMobile()});window.addEventListener('resize',()=>{sidebar.classList.remove('open');applySaved()});applySaved();
})();

(function(){
 const originalRows=getEmployeeRows,originalRecord=getEmployeeRecord,aliases={企劃:['企劃','營運企劃部'],技術:['技術','資訊技術部','產品設計部'],'財務/人事':['財務/人事','財務人事行政部']};
 function allowedDepartment(department){
  const p=currentProfile();
  if(p.role!=='supervisor')return true;
  return (aliases[p.department]||[p.department]).includes(department);
 }
 window.bombhrCanAccessEmployee=function(id){
  const record=originalRecord(id);
  return !!record&&allowedDepartment(record.department);
 };
 getEmployeeRows=function(){
  return originalRows().filter(row=>allowedDepartment(row[2]));
 };
 getEmployeeRecord=function(id){
  const record=originalRecord(id);
  return record&&allowedDepartment(record.department)?record:null;
 };
 function guardRestrictedOpen(event){
  const trigger=event.target.closest('[data-view-employee],[data-edit-employee]');
  if(!trigger)return;
  const id=trigger.dataset.viewEmployee||trigger.dataset.editEmployee;
  if(window.bombhrCanAccessEmployee(id))return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if(typeof toast==='function')toast('此員工不在目前主管的部門權限範圍內');
 }
 document.addEventListener('click',guardRestrictedOpen,true);
 function verifyEmployeePage(){
  if(location.hash!=='#employees'||currentProfile().role!=='supervisor')return;
  const rows=[...document.querySelectorAll('#content [data-search-row]')],allowed=new Set(getEmployeeRows().map(row=>row[1]));
  rows.forEach(row=>{
   const id=row.querySelector('[data-view-employee],[data-edit-employee]')?.dataset.viewEmployee||row.querySelector('[data-edit-employee]')?.dataset.editEmployee;
   if(id&&!allowed.has(id))row.remove();
  });
  const subtitle=document.querySelector('#content .panel-head p');
  const text='共 '+getEmployeeRows().length+' 位「'+currentProfile().department+'」部門在職員工';
  if(subtitle&&subtitle.textContent!==text)subtitle.textContent=text;
 }
 window.addEventListener('hashchange',()=>setTimeout(verifyEmployeePage,0));
 new MutationObserver(()=>setTimeout(verifyEmployeePage,0)).observe(document.getElementById('content'),{childList:true,subtree:true});
 setTimeout(verifyEmployeePage,0);
})();

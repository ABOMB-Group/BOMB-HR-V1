(function(){
 const rows=[
  ['OG','AB00001','企劃','企劃-經理辦公室','', '最高權限',true,true,'2025-07-01','0900000000'],
  ['KEN','AB00002','企劃','技術企劃','AB00001','部門主管',false,true,'2025-07-01',''],
  ['RU','AB00003','企劃','CS主管','AB00002','部門主管',false,true,'2025-07-01',''],
  ['弦','AB00004','企劃','CS組長','AB00003','一般員工',false,false,'2025-07-01',''],
  ['鬼','AB00005','企劃','CS組長','AB00003','一般員工',false,false,'2025-07-01',''],
  ['肉肉','AB00006','技術','技術長','AB00001','部門主管',false,true,'2026-05-01',''],
  ['晴','AB00007','技術','全端工程師','AB00006','一般員工',false,false,'2026-05-01',''],
  ['佑','AB00008','技術','前端工程師','AB00006','一般員工',false,false,'2026-05-01',''],
  ['津','AB00009','技術','設計師','AB00006','一般員工',false,false,'2026-05-01',''],
  ['魚','AB00010','財務/人事','主管','AB00001','財務人事行政',false,false,'2025-07-01','']
 ];
 const byId=Object.fromEntries(rows.map(row=>[row[1],row[0]]));
 window.BOMBHR_IMPORTED_PERSONNEL=rows.map(([name,employeeId,department,position,managerId,roleGroup,highest,systemAdmin,hireDate,phone])=>({name,employeeId,company:'ABOMB',location:'台中總公司',department,position,managerId,manager:managerId?`${byId[managerId]}・${managerId}`:'無',status:'在職',employmentType:'正式任用',hireDate,probation:'不適用',email:'',phone,roleGroup,highest,systemAdmin,managedDepartments:department,includeChildren:true,includeActing:true,includeSupport:true,accountStatus:'立即啟用',source:'BOMB-HR 人事主檔匯入範本 V1.0'}));
 const migration='bombhr-personnel-v147-imported';
 if(!localStorage.getItem(migration)){
  ['bombhr-custom-employees','bombhr-custom-employees-v147','bombhr-employee-org-overrides','bombhr-admin-approval-records','bombhr-role-designer-v145','bombhr-role-designer-v147','bombhr-supervisor-contact-master','bombhr-payroll-adjustments-v123','bombhr-employee-salary-profiles-v124','bombhr-demo-events','bombhr-completed-tasks'].forEach(key=>localStorage.removeItem(key));
  localStorage.setItem('bombhr-supervisor-contact-master',JSON.stringify({name:'KEN',employeeId:'AB00002',role:'當班主管',department:'企劃',shift:'08:45–18:00',companyPhone:'04-2258-1688',privatePhone:'0912-345-678',line:'ABOMB KEN',lineId:'abomb.supervisor',lineUrl:'https://line.me/R/ti/p/@abomb-supervisor',lineQr:'',allowEmployeeView:true,verified:false,delegate:'RU・AB00003'}));
  localStorage.setItem(migration,new Date().toISOString());
 }
})();

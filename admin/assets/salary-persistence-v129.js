(function(){
 const storageKey='bombhr-employee-salary-profiles-v124';
 let activeEmployeeId='';
 const value=id=>document.getElementById(id)?.value??'';
 const number=id=>Number(value(id)||0);
 function readProfiles(){try{return JSON.parse(localStorage.getItem(storageKey)||'{}')}catch(error){return {}}}
 function saveCurrentEmployee(){
  const id=document.getElementById('modal')?.dataset.salaryEmployeeId||activeEmployeeId;
  if(!id){toast('找不到目前員工，請關閉視窗後重新點選查看');return false}
  const effectiveDate=value('employeeSalaryEffective');
  if(!effectiveDate){toast('請先設定薪資生效日');return false}
  const next={};
  document.querySelectorAll('[data-employee-salary]').forEach(input=>next[input.dataset.employeeSalary]=Number(input.value||0));
  Object.assign(next,{effectiveDate,benefitLevel:value('employeeBenefitLevel'),travelLeave:number('employeeTravelLeave'),annualLeave:number('employeeAnnualLeave'),laborGrade:number('employeeLaborGrade'),healthGrade:number('employeeHealthGrade'),dependents:number('employeeDependents'),occupationalRate:number('employeeOccupationalRate'),voluntaryPension:number('employeeVoluntaryPension'),updatedBy:`${currentProfile().name}・${currentProfile().id}`,updatedAt:new Date().toLocaleString('zh-TW',{hour12:false})});
  const calc=window.bombhrInsuranceCost?window.bombhrInsuranceCost(next):{};
  next.employeeInsuranceTotal=Number(next.laborInsurance||0)+Number(next.healthInsurance||0);
  next.employerInsuranceTotal=Number(calc.employerTotal||0);next.governmentInsuranceTotal=Number(calc.governmentTotal||0);
  const profiles=readProfiles();profiles[id]=next;
  try{localStorage.setItem(storageKey,JSON.stringify(profiles));const verified=readProfiles()[id];if(!verified||verified.laborGrade!==next.laborGrade||verified.healthGrade!==next.healthGrade)throw new Error('verification failed')}catch(error){toast('儲存失敗，瀏覽器無法寫入資料');return false}
  addAudit('修改員工薪資與勞健保',`${getEmployeeRecord(id)?.name||id}・勞保 ${next.laborGrade.toLocaleString()}・健保 ${next.healthGrade.toLocaleString()}`);
  let status=document.getElementById('salarySaveVerified');if(!status){status=document.createElement('div');status.id='salarySaveVerified';status.className='salary-save-verified';document.querySelector('.salary-page-actions')?.prepend(status)}
  status.textContent=`✓ 已儲存並核對｜勞保級距 ${next.laborGrade.toLocaleString()}｜健保級距 ${next.healthGrade.toLocaleString()}｜${next.updatedAt}`;
  const button=document.getElementById('saveEmployeeSalaryProfile');if(button){button.textContent='已儲存，可關閉後重新查看';button.classList.add('saved')}
  toast(`${getEmployeeRecord(id)?.name||id}的薪資、級距與扣款已確實儲存`);return true;
 }
 document.addEventListener('click',event=>{const trigger=event.target.closest('[data-view-employee],[data-edit-employee]');if(trigger)activeEmployeeId=trigger.dataset.viewEmployee||trigger.dataset.editEmployee||'';const button=event.target.closest('#saveEmployeeSalaryProfile');if(!button)return;event.preventDefault();event.stopImmediatePropagation();saveCurrentEmployee()},true);
 const previousEnhance=window.enhanceEmployeeSalaryPage;window.enhanceEmployeeSalaryPage=function(id){activeEmployeeId=id;document.getElementById('modal')?.setAttribute('data-salary-employee-id',id);return previousEnhance(id)};
 window.bombhrSaveEmployeeSalaryV129=saveCurrentEmployee;
})();

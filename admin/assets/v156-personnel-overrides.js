(function(){
 let overrides={};
 try{overrides=JSON.parse(localStorage.getItem('bombhr-personnel-department-overrides')||'{}')}catch(e){}
 (window.BOMBHR_IMPORTED_PERSONNEL||[]).forEach(person=>{
  if(overrides[person.employeeId]){
   person.department=overrides[person.employeeId];
   person.managedDepartments=overrides[person.employeeId];
  }
 });
})();

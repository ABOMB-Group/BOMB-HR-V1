(function(){
 const roster=window.BOMBHR_IMPORTED_PERSONNEL||[];
 if(!roster.length)return;
 const groups=[
  {id:'planning',name:'企劃',manager:'KEN',people:roster.filter(e=>e.department==='企劃')},
  {id:'tech',name:'技術',manager:'肉肉',people:roster.filter(e=>e.department==='技術')},
  {id:'hr',name:'財務/人事',manager:'魚',people:roster.filter(e=>e.department==='財務/人事')}
 ];
 const orgPeople=people=>people.map(person=>`<tr data-search-row><td><div class="person"><span class="avatar">${person.name[0]}</span><div><b>${person.name}</b><small>${person.employeeId}</small></div></div></td><td>${person.position}</td><td>${person.manager}</td><td>${badge(person.roleGroup)}</td><td>${person.systemAdmin?badge('系統管理員'):'—'}</td></tr>`).join('');
 views.organization=()=>head('公司、據點與組織管理','Organization','依人事主檔呈現部門、職務、主管與員工歸屬',`<button class="secondary-btn" data-add="department">新增部門</button><button class="primary-btn" data-route-go="employees">員工人事主檔</button>`)+`<div class="stat-grid">${stat('公司','ABOMB','台中總公司')}${stat('在職人數',String(roster.length),'全部立即啟用')}${stat('部門數',String(groups.length),'企劃、技術、財務/人事')}${stat('最高權限','OG・AB00001','完整管理與指派權')}</div>`+panel('ABOMB 組織架構','點開部門即可查看職務、員工與直屬主管',`<div class="tree-node active"><b>ABOMB｜台中總公司</b><span>${roster.length} 人</span></div>${groups.map(group=>`<details class="org-department-v147" open><summary><span><b>${group.name}</b><small>部門主管：${group.manager}</small></span><strong>${group.people.length} 人</strong></summary><div class="table-wrap"><table><thead><tr><th>員工</th><th>職位</th><th>直屬主管</th><th>身份</th><th>系統權限</th></tr></thead><tbody>${orgPeople(group.people)}</tbody></table></div></details>`).join('')}`)+panel('組織管理原則','本次人事主檔匯入結果',`<div class="policy-note"><b>最高權限可分配身份與資料範圍</b><span>OG 可在「身份與權限配置」選擇每位員工，設定可查看、編輯或管理的部門與功能。KEN 管理企劃、RU 管理 CS 人員、肉肉管理技術、魚負責財務／人事。</span></div>`);
 if(typeof payrollRoster!=='undefined'){
  payrollRoster.splice(0,payrollRoster.length,...roster.map((person,index)=>({name:person.name,id:person.employeeId,department:person.department,position:person.position,overtime:0,deduction:0,status:index<3?'待核對':'已確認'})));
 }
 if(typeof payrollDepartments!=='undefined'){
  const amounts={planning:50000,tech:52000,hr:50000};
  payrollDepartments.splice(0,payrollDepartments.length,...groups.map(group=>({id:group.id,name:group.name,manager:group.manager,count:group.people.length,total:group.people.length*amounts[group.id],pending:group.id==='planning'?1:0,exception:0,employees:group.people.map((person,index)=>[person.name,person.employeeId,person.position,amounts[group.id],0,amounts[group.id],amounts[group.id]-2642,index===0&&group.id==='planning'?'待核對':'已確認'])})));
 }
 const style=document.createElement('style');
 style.textContent='.org-department-v147{border:1px solid var(--line);border-radius:14px;margin:12px 0;overflow:hidden}.org-department-v147 summary{cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:16px 18px;background:var(--soft)}.org-department-v147 summary span{display:grid;gap:4px}.org-department-v147 summary small{color:var(--muted)}.org-department-v147 summary strong{color:var(--accent)}.org-department-v147 .table-wrap{margin:0;border:0;border-radius:0}';
 document.head.appendChild(style);
 window.dispatchEvent(new HashChangeEvent('hashchange'));
})();

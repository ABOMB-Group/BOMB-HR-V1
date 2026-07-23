
/* ===== permission-designer.js ===== */
(function(){
 const key='bombhr-role-designer-v147',uiKey='bombhr-role-designer-ui';
 const modules=[['organization','組織管理','部門、職務與人員歸屬'],['employees','員工人事','員工主檔與任用資料'],['attendance','出勤與裝置','出勤、裝置與安全紀錄'],['scheduling','排班管理','班別、排班與營運月曆'],['approvals','簽核中心','請假、加班、補卡與換機'],['payroll','薪資管理','薪資、勞健保與結算'],['eventlog','事件紀錄','敏感操作、權限異動與存取阻擋'],['permissions','角色與權限','身份、權限與人員指派'],['settings','企業設定','APP模組與企業安全政策']];
 const sensitive=[['salaryView','查看薪資','可查看員工薪資與結算'],['salaryEdit','編輯薪資','可修改薪資架構與扣款'],['salaryExport','匯出薪資','可產出薪資檔案'],['bankMasked','銀行帳號遮罩','僅查看遮罩後帳號'],['bankFull','完整銀行帳號','查看完整帳號並留下稽核'],['identity','身分證資料','查看法定身分資料'],['address','私人地址','查看員工私人地址'],['insurance','勞健保資料','查看投保級距與負擔'],['medical','請假醫療附件','查看醫療與請假證明'],['audit','系統稽核紀錄','查看敏感操作歷程']];
 const allManage=Object.fromEntries(modules.map(item=>[item[0],'manage'])),systemAccess={organization:'view',employees:'hidden',attendance:'manage',scheduling:'hidden',approvals:'hidden',payroll:'hidden',permissions:'manage',settings:'manage'};
 const defaults={owner:{name:'最高權限',en:'Enterprise Owner',description:'企業擁有者・所有功能與可查看的資料',protected:true,scope:'company',members:['AB00001'],permissions:allManage,sensitive:Object.fromEntries(sensitive.map(item=>[item[0],true]))},manager:{name:'副理／經理',en:'Deputy Manager / Manager',description:'查看全公司組織與營運資料，依授權管理人事及營運',protected:false,scope:'company',members:[],permissions:{organization:'manage',employees:'edit',attendance:'manage',scheduling:'manage',approvals:'manage',payroll:'view',permissions:'hidden',settings:'hidden'},sensitive:{salaryView:true,salaryEdit:false,salaryExport:false,bankMasked:false,bankFull:false,identity:false,address:false,insurance:false,medical:false,audit:false}},supervisor:{name:'部門主管',en:'Department Supervisor',description:'管理指定部門的人事非敏感資料、出勤、排班與簽核',protected:false,scope:'managed',departments:['營運企劃部'],includeChildren:true,includeActing:true,includeSupport:false,members:['AB00118'],permissions:{organization:'view',employees:'edit',attendance:'edit',scheduling:'manage',approvals:'manage',payroll:'hidden',permissions:'hidden',settings:'hidden'},sensitive:{salaryView:false,salaryEdit:false,salaryExport:false,bankMasked:false,bankFull:false,identity:false,address:false,insurance:false,medical:true,audit:false}},hradmin:{name:'財務人事行政',en:'HR / Finance / Administration',description:'管理全公司人事、薪資、福利、出勤、排班與報表',protected:false,scope:'company',members:['AB00026'],permissions:{organization:'manage',employees:'manage',attendance:'manage',scheduling:'manage',approvals:'manage',payroll:'manage',permissions:'view',settings:'edit'},sensitive:{salaryView:true,salaryEdit:true,salaryExport:true,bankMasked:true,bankFull:false,identity:true,address:true,insurance:true,medical:true,audit:true}},system:{name:'系統管理員',en:'System Administrator',description:'管理帳號、角色、裝置、安全與系統設定',protected:false,scope:'system',members:['AB00999'],permissions:systemAccess,sensitive:{salaryView:false,salaryEdit:false,salaryExport:false,bankMasked:false,bankFull:false,identity:false,address:false,insurance:false,medical:false,audit:true}},employee:{name:'一般員工',en:'Employee',description:'使用個人打卡、排班、申請及本人資料',protected:false,scope:'self',members:[],permissions:{organization:'view',employees:'view',attendance:'view',scheduling:'view',approvals:'edit',payroll:'view',permissions:'hidden',settings:'hidden'},sensitive:{salaryView:true,salaryEdit:false,salaryExport:false,bankMasked:true,bankFull:false,identity:false,address:false,insurance:true,medical:false,audit:false}}};
 const people=(window.BOMBHR_IMPORTED_PERSONNEL||[]).map(person=>[person.name,person.employeeId,person.department,person.position]);
 defaults.owner.members=['AB00001'];
 defaults.owner.memberDepartments={AB00001:['企劃']};
 defaults.manager.memberDepartments={};
 defaults.supervisor.members=['AB00002','AB00003','AB00006'];
 defaults.supervisor.departments=[];
 defaults.supervisor.memberDepartments={AB00002:['企劃'],AB00003:['企劃'],AB00006:['技術']};
 defaults.supervisor.includeSupport=true;
 defaults.hradmin.members=['AB00010'];
 defaults.system.members=['AB00001','AB00002','AB00003','AB00006'];
 defaults.employee.members=['AB00004','AB00005','AB00007','AB00008','AB00009'];
 delete defaults.supervisor;
 const read=()=>{const base=JSON.parse(JSON.stringify(defaults));try{const saved=JSON.parse(localStorage.getItem(key)||'{}'),removed=JSON.parse(localStorage.getItem('bombhr-deleted-role-ids')||'[]');delete saved.supervisor;const stored={...base,...saved};['supervisor',...removed].forEach(id=>delete stored[id]);['owner','manager'].forEach(id=>{if(stored[id]&&!stored[id].memberDepartments)stored[id].memberDepartments=JSON.parse(JSON.stringify(defaults[id].memberDepartments||{}))});return stored}catch(e){return base}},save=value=>localStorage.setItem(key,JSON.stringify(value));let ui={role:'owner',tab:'scope'};try{ui={...ui,...JSON.parse(sessionStorage.getItem(uiKey)||'{}')}}catch(e){}const setUi=next=>{ui={...ui,...next};sessionStorage.setItem(uiKey,JSON.stringify(ui));location.hash='permissions';window.dispatchEvent(new HashChangeEvent('hashchange'))};
 function canEdit(role){return currentRole()==='executive'&&role!=='owner'}
 function scopePane(role,data){const editable=canEdit(role),options=[['company','全公司','ABOMB所有部門、職務與員工'],['department','指定部門','由最高權限選擇一個或多個部門'],['self','僅本人資料','只允許查看自己的資料']],departments=['營運管理部','技術部','企劃部','財務人事行政部'];return `${!editable?`<div class="permission-locked">${role==='owner'?'最高權限為企業受保護身份，擁有全公司全部管理權限，不可在此降級或停用。':'目前身份只能查看；僅最高權限可以修改身份權限。'}</div>`:''}<h3>可查看的資料</h3><div class="scope-selector">${options.map(item=>`<label class="scope-option-card"><input type="radio" name="roleScope" value="${item[0]}" ${data.scope===item[0]?'checked':''} ${editable?'':'disabled'}><b>${item[1]}</b><small>${item[2]}</small></label>`).join('')}</div>${['department','managed','custom'].includes(data.scope)||role==='supervisor'?`<div class="department-scope-box"><div><b>管理部門</b><small>選擇此身份可以查看及管理的部門</small></div><div class="department-check-grid">${departments.map(name=>`<label><input type="checkbox" data-role-department="${name}" ${(data.departments||[]).includes(name)?'checked':''} ${editable?'':'disabled'}>${name}</label>`).join('')}</div><div class="scope-extra-grid"><label><input type="checkbox" data-scope-extra="includeChildren" ${data.includeChildren?'checked':''} ${editable?'':'disabled'}>包含下層部門</label><label><input type="checkbox" data-scope-extra="includeActing" ${data.includeActing?'checked':''} ${editable?'':'disabled'}>包含代理管理部門</label><label><input type="checkbox" data-scope-extra="includeSupport" ${data.includeSupport?'checked':''} ${editable?'':'disabled'}>包含跨部門支援員工</label></div></div>`:''}<h3>功能設定</h3><div class="permission-matrix"><table><thead><tr><th>功能模組</th><th>不顯示</th><th>只能查看</th><th>可以修改</th><th>完整管理</th></tr></thead><tbody>${modules.map(item=>{const selected=data.permissions[item[0]]||(item[0]==='eventlog'&&data.sensitive?.audit?'view':'hidden');return `<tr><td class="module-name"><b>${item[1]}</b><small>${item[2]}</small></td>${['hidden','view','edit','manage'].map(level=>`<td><input type="radio" name="permission-${item[0]}" value="${level}" ${selected===level?'checked':''} ${editable?'':'disabled'}></td>`).join('')}</tr>`}).join('')}</tbody></table></div>${actions(role,editable)}`}
 function sensitivePane(role,data){const editable=canEdit(role);return `${!editable?'<div class="permission-locked">敏感資料採獨立授權。系統管理員即使可以管理角色，也不會因此取得薪資、銀行或醫療資料。</div>':''}<h3>私人資料權限</h3><div class="sensitive-grid">${sensitive.map(item=>`<label class="sensitive-item"><span><b>${item[1]}</b><small>${item[2]}</small></span><input type="checkbox" data-sensitive="${item[0]}" ${data.sensitive[item[0]]?'checked':''} ${editable?'':'disabled'}></label>`).join('')}</div>${actions(role,editable)}`}
 function assignmentPane(role,data){const editable=canEdit(role),isSupervisor=role==='supervisor',departments=['企劃','技術','財務/人事'];return `${!editable?`<div class="permission-locked">${role==='owner'?'最高權限的移轉必須使用「企業擁有權移轉」流程及再次驗證，不能直接勾選指派。':'目前只能查看，只有最高權限可以變更指派。'}</div>`:''}${isSupervisor?'<div class="supervisor-assignment-help"><b>一人一範圍，直接在右側選部門</b><span>勾選主管後，再選擇他負責的部門。主管登入時只會看到該部門的員工與資料。</span></div>':''}<div class="assignment-search"><input id="assignmentSearch" placeholder="搜尋姓名、員編、部門或職務"></div><div class="assignment-list">${people.map(person=>{const assigned=data.members.includes(person[1]),selected=(data.memberDepartments||{})[person[1]]||[person[2]];return `<label class="assignment-person ${isSupervisor?'supervisor-person':''}" data-assignment-row><span>${person[0][0]}</span><div><b>${person[0]}・${person[1]}</b><small>${person[2]}・${person[3]}</small></div>${isSupervisor?`<select data-member-department="${person[1]}" ${assigned&&editable?'':'disabled'} aria-label="${person[0]}管理部門">${departments.map(dept=>`<option value="${dept}" ${selected.includes(dept)?'selected':''}>${dept}</option>`).join('')}</select>`:''}<input type="checkbox" data-member="${person[1]}" ${assigned?'checked':''} ${editable?'':'disabled'}></label>`}).join('')}</div>${actions(role,editable)}`}
 function summaryPane(role,data){const labels={hidden:'隱藏',view:'查看',edit:'編輯',manage:'管理'},enabled=Object.values(data.sensitive).filter(Boolean).length,memberScopes=role==='supervisor'?`<h3 style="margin-top:18px">主管管理範圍</h3><div class="supervisor-summary">${data.members.map(id=>{const person=people.find(item=>item[1]===id),dept=(data.memberDepartments||{})[id]||[];return person?`<div><b>${person[0]}・${person[1]}</b><span>${dept.join('、')||'尚未指定'}</span></div>`:''}).join('')}</div>`:'';return `<div class="permission-summary-grid"><div><small>可查看的資料</small><b>${data.scope==='company'?'全公司':data.scope==='system'?'全公司系統架構':role==='supervisor'?'依主管個別指定':'自訂範圍'}</b></div><div><small>已指派人員</small><b>${data.members.length} 人</b></div><div><small>敏感權限</small><b>${enabled}／${sensitive.length} 項</b></div></div>${memberScopes}<h3 style="margin-top:18px">功能摘要</h3><div class="table-wrap"><table><thead><tr><th>功能</th><th>權限</th></tr></thead><tbody>${modules.map(item=>`<tr><td>${item[1]}</td><td>${badge(labels[data.permissions[item[0]]]||'隱藏')}</td></tr>`).join('')}</tbody></table></div>`}
 function actions(role,editable){return editable?'<div class="permission-actions"><small>儲存後會記錄最高權限身份、時間及異動內容。</small><div><button class="secondary-btn" data-reset-role>還原預設</button><button class="primary-btn" data-save-role>儲存權限設定</button></div></div>':''}
 function identityIcon(id){return {owner:'王',manager:'經',supervisor:'主',hradmin:'人',system:'系',employee:'員'}[id]||'自'}
 window.permissionsView=function(){const data=read(),role=data[ui.role]||data.owner,current=data[ui.role]?ui.role:'owner',tabs=[['assignment',current==='supervisor'?'人員與部門':'人員指派'],['scope','功能設定'],['sensitive','敏感資料'],['summary','確認設定']],pane=ui.tab==='sensitive'?sensitivePane(current,role):ui.tab==='assignment'?assignmentPane(current,role):ui.tab==='summary'?summaryPane(current,role):scopePane(current,role);return head('身份與權限配置','Roles & Permissions','先選擇身份，再設定人員、部門與可以使用的功能')+`<div class="permission-layout"><aside class="identity-list"><div class="identity-list-head"><div><b>身份群組</b><small>選擇要設定的身份</small></div>${currentRole()==='executive'?'<button class="identity-add-btn" id="addIdentityBtn">＋ 新增身份</button>':''}</div>${Object.entries(data).map(([id,item])=>`<button class="identity-card ${id===current?'active':''} ${item.protected?'protected':''}" data-designer-role="${id}"><i>${identityIcon(id)}</i><div><b>${item.name}</b><small>${item.en}・${item.members.length} 人</small></div><em>${item.protected?'受保護':'可配置'}</em></button>`).join('')}</aside><section class="permission-workspace"><div class="permission-role-head"><div><h2>${role.name}</h2><p>${role.description}</p></div>${role.protected?'<span class="protected-pill">最高權限保護</span>':''}</div><div class="permission-tabs">${tabs.map(tab=>`<button data-designer-tab="${tab[0]}" class="${ui.tab===tab[0]?'active':''}">${tab[1]}</button>`).join('')}</div><div class="permission-pane">${pane}</div></section></div>`}
 function collectAndSave(){const data=read(),role=data[ui.role];if(!canEdit(ui.role)){toast('只有最高權限可以修改此身份');return}role.scope=document.querySelector('input[name="roleScope"]:checked')?.value||role.scope;modules.forEach(item=>role.permissions[item[0]]=document.querySelector(`input[name="permission-${item[0]}"]:checked`)?.value||'hidden');sensitive.forEach(item=>{const input=document.querySelector(`[data-sensitive="${item[0]}"]`);if(input)role.sensitive[item[0]]=input.checked});if(document.querySelector('[data-role-department]'))role.departments=[...document.querySelectorAll('[data-role-department]:checked')].map(input=>input.dataset.roleDepartment);document.querySelectorAll('[data-scope-extra]').forEach(input=>role[input.dataset.scopeExtra]=input.checked);const members=[...document.querySelectorAll('[data-member]:checked')].map(input=>input.dataset.member);if(document.querySelector('[data-member]'))role.members=members;if(ui.role==='supervisor'&&document.querySelector('[data-member-department]')){role.scope='managed';role.memberDepartments={};members.forEach(id=>{const select=document.querySelector(`[data-member-department="${id}"]`);role.memberDepartments[id]=select?[select.value]:[]})}save(data);addAudit('修改身份權限',`${role.name}・${role.members.length} 位成員`);toast('權限設定已儲存並留下稽核紀錄');setUi({tab:'summary'})}
 function createIdentityModal(){openModal('新增身份','選擇建議範本後，可再調整可查看的資料、功能設定與敏感資料',`<div class="identity-template-grid">${[['manager','副理／經理','全公司組織與營運管理'],['supervisor','部門主管','指定部門人事、出勤、排班及簽核'],['hradmin','財務人事行政','人事、薪資、福利與報表'],['system','系統管理員','帳號、權限、裝置與安全'],['employee','一般員工','本人打卡、排班、申請及薪資'],['custom','自訂身份','從安全的最低權限開始設定']].map((item,index)=>`<label class="identity-template-card"><input type="radio" name="identityTemplate" value="${item[0]}" ${index===0?'checked':''}><span><b>${item[1]}</b><small>${item[2]}</small></span></label>`).join('')}</div><label class="form-field" style="margin-top:14px">身份顯示名稱<input id="customIdentityName" class="form-control" placeholder="可保留範本名稱或輸入公司自訂名稱"></label><p id="identityCreateError" class="form-error"></p>`,`<button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="confirmCreateIdentity">建立並設定</button>`);document.getElementById('confirmCreateIdentity').onclick=()=>{const template=document.querySelector('input[name="identityTemplate"]:checked')?.value||'custom',data=read();if(template!=='custom'&&data[template]){closeModal();setUi({role:template,tab:'scope'});toast('此身份範本已存在，已開啟設定');return}const id=template==='custom'?'custom-'+Date.now():template,base=template==='custom'?{name:'自訂身份',en:'Custom Role',description:'由最高權限自訂可查看的資料與功能',protected:false,scope:'self',members:[],permissions:Object.fromEntries(modules.map(item=>[item[0],'hidden'])),sensitive:Object.fromEntries(sensitive.map(item=>[item[0],false]))}:JSON.parse(JSON.stringify(defaults[template])),name=document.getElementById('customIdentityName').value.trim();if(name)base.name=name;data[id]=base;save(data);closeModal();setUi({role:id,tab:'scope'});toast(`${base.name}已建立，請繼續設定權限`)}}
 document.addEventListener('click',event=>{const role=event.target.closest('[data-designer-role]'),tab=event.target.closest('[data-designer-tab]');if(role){setUi({role:role.dataset.designerRole,tab:'scope'});return}if(tab){setUi({tab:tab.dataset.designerTab});return}if(event.target.id==='addIdentityBtn'){createIdentityModal();return}if(event.target.closest('[data-save-role]'))collectAndSave();if(event.target.closest('[data-reset-role]')){const data=read(),reset=defaults[ui.role];if(reset)data[ui.role]=JSON.parse(JSON.stringify(reset));save(data);toast('身份已還原安全預設');setUi({tab:'summary'})}if(event.target.id==='selectAllAssignment'){document.querySelectorAll('[data-member]:not(:disabled)').forEach(input=>input.checked=true)}},true);
 document.addEventListener('change',event=>{if(!event.target.matches('[data-member]'))return;const select=document.querySelector(`[data-member-department="${event.target.dataset.member}"]`);if(select)select.disabled=!event.target.checked||!canEdit(ui.role)});
 document.addEventListener('click',event=>{const role=event.target.closest('[data-designer-role]');if(role)document.body.dataset.permissionRole=role.dataset.designerRole});
 document.body.dataset.permissionRole=ui.role;
 document.addEventListener('input',event=>{if(event.target.id!=='assignmentSearch')return;const q=event.target.value.toLowerCase();document.querySelectorAll('[data-assignment-row]').forEach(row=>row.hidden=!row.textContent.toLowerCase().includes(q))});if(location.hash==='#permissions')window.dispatchEvent(new HashChangeEvent('hashchange'));
})();

/* ===== v156-permission-org.js ===== */
(function(){
 const roleKey='bombhr-role-designer-v147',uiKey='bombhr-role-designer-ui',orgKey='bombhr-personnel-department-overrides';
 const orgRoles=['owner','manager','supervisor'],departments=['企劃','技術','財務/人事'];
 const currentRoleId=()=>{try{return JSON.parse(sessionStorage.getItem(uiKey)||'{}').role||'owner'}catch(e){return'owner'}};
 const readRoles=()=>{try{return JSON.parse(localStorage.getItem(roleKey)||'{}')}catch(e){return{}}};
 const people=()=>window.BOMBHR_IMPORTED_PERSONNEL||[];
 function enhance(){
  if(location.hash!=='#permissions')return;
  const roleId=currentRoleId();
  if(!orgRoles.includes(roleId))return;
  document.body.dataset.permissionRole=roleId;
  document.querySelectorAll('[data-designer-tab]').forEach(button=>{
   if(button.dataset.designerTab==='assignment')button.textContent='人員與部門';
  });
  if(!document.querySelector('[data-assignment-row]'))return;
  const data=readRoles()[roleId]||{},memberDepartments=data.memberDepartments||{};
  document.querySelectorAll('[data-assignment-row]').forEach(row=>{
   if(row.querySelector('[data-member-department]'))return;
   const member=row.querySelector('[data-member]');
   if(!member)return;
   if(roleId==='owner')member.disabled=false;
   const person=people().find(item=>item.employeeId===member.dataset.member);
   const selected=(memberDepartments[member.dataset.member]||[person&&person.department||'企劃'])[0];
   const select=document.createElement('select');
   select.dataset.memberDepartment=member.dataset.member;
   select.setAttribute('aria-label',(person?person.name:'人員')+'所屬或管理部門');
   select.innerHTML=departments.map(dept=>'<option value="'+dept+'"'+(dept===selected?' selected':'')+'>'+dept+'</option>').join('');
   select.disabled=!member.checked;
   row.classList.add('supervisor-person');
   row.insertBefore(select,member);
  });
  const actions=document.querySelector('.permission-actions');
  if(actions){
   const save=actions.querySelector('[data-save-role]');
   if(save){save.removeAttribute('data-save-role');save.dataset.v156Save='1'}
  }else if(roleId==='owner'){
   const pane=document.querySelector('.permission-pane');
   if(pane)pane.insertAdjacentHTML('beforeend','<div class="permission-actions"><small>調動後會記錄最高權限身份、時間及部門異動。</small><div><button class="primary-btn" data-v156-save="1">儲存人員與部門</button></div></div>');
  }
 }
 function saveAssignment(){
  const roleId=currentRoleId(),roles=readRoles(),role=roles[roleId]||(roles[roleId]={name:roleId==='owner'?'最高權限':roleId==='manager'?'副理／經理':'部門主管',members:[],memberDepartments:{}});
  const checked=[...document.querySelectorAll('[data-member]:checked')];
  role.members=checked.map(input=>input.dataset.member);
  role.memberDepartments={};
  let overrides={};
  try{overrides=JSON.parse(localStorage.getItem(orgKey)||'{}')}catch(e){}
  checked.forEach(input=>{
   const id=input.dataset.member,select=document.querySelector('[data-member-department="'+id+'"]'),department=select?select.value:'';
   role.memberDepartments[id]=department?[department]:[];
   if(department)overrides[id]=department;
  });
  localStorage.setItem(roleKey,JSON.stringify(roles));
  localStorage.setItem(orgKey,JSON.stringify(overrides));
  if(typeof addAudit==='function')addAudit('調動身份與部門',(role.name||roleId)+'・'+role.members.length+' 位人員');
  if(typeof toast==='function')toast('人員與部門已調整並留下異動紀錄');
  setTimeout(()=>location.reload(),450);
 }
 window.addEventListener('hashchange',()=>setTimeout(enhance,0));
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-designer-role],[data-designer-tab]'))setTimeout(enhance,0);
  if(event.target.closest('[data-v156-save]')){event.preventDefault();saveAssignment()}
 });
 document.addEventListener('change',event=>{
  if(!event.target.matches('[data-member]'))return;
  const select=document.querySelector('[data-member-department="'+event.target.dataset.member+'"]');
  if(select)select.disabled=!event.target.checked;
 });
 setTimeout(enhance,0);
})();

/* ===== personnel-structure-v147.js ===== */
(function(){
 const roster=window.BOMBHR_IMPORTED_PERSONNEL||[];
 if(!roster.length)return;
 const groups=[
  {id:'planning',name:'企劃',manager:'KEN',people:roster.filter(e=>e.department==='企劃')},
  {id:'tech',name:'技術',manager:'肉肉',people:roster.filter(e=>e.department==='技術')},
  {id:'hr',name:'財務/人事',manager:'魚',people:roster.filter(e=>e.department==='財務/人事')}
 ];
 const orgPeople=people=>people.map(person=>`<tr data-search-row><td><div class="person person-without-icon"><div><b>${person.name}</b><small>${person.employeeId}</small></div></div></td><td>${person.position}</td><td>${person.manager}</td><td>${badge(person.roleGroup)}</td><td>${person.systemAdmin?badge('系統管理員'):'—'}</td></tr>`).join('');
 views.organization=()=>head('公司、據點與組織管理','Organization','依人事主檔呈現部門、職務、主管與員工歸屬',`<button class="secondary-btn" data-add="department">新增部門</button><button class="primary-btn" data-route-go="employees">員工人事主檔</button>`)+`<div class="stat-grid">${stat('公司','ABOMB','台中總公司')}${stat('在職人數',String(roster.length),'全部立即啟用')}${stat('部門數',String(groups.length),'企劃、技術、財務/人事')}${stat('最高權限','OG・AB00001','完整管理與指派權')}</div>`+panel('ABOMB 組織架構','點開部門即可查看職務、員工與直屬主管',`<div class="tree-node active"><b>ABOMB｜台中總公司</b><span>${roster.length} 人</span></div>${groups.map(group=>`<details class="org-department-v147" open><summary><span><b>${group.name}</b><small>部門主管：${group.manager}</small></span><strong>${group.people.length} 人</strong></summary><div class="table-wrap"><table><thead><tr><th>員工</th><th>職位</th><th>直屬主管</th><th>身份</th><th>系統權限</th></tr></thead><tbody>${orgPeople(group.people)}</tbody></table></div></details>`).join('')}`)+panel('組織管理原則','本次人事主檔匯入結果',`<div class="policy-note"><b>最高權限可分配身份與可查看的資料</b><span>OG 可在「身份與權限配置」選擇每位員工，設定可查看、編輯或管理的部門與功能。KEN 管理企劃、RU 管理 CS 人員、肉肉管理技術、魚負責財務／人事。</span></div>`);
 views.employees=()=>head('員工人事主檔','Employees','員工生命週期、任職資料、健康文件與跨部門調整',`<button class="secondary-btn" data-export>匯出名冊</button><button class="primary-btn" data-add="employee">＋ 新增員工</button>`)+panel('員工名冊',`共 ${getEmployeeRows().length} 位在職員工`,toolbar('搜尋姓名、員編、部門',`<select class="filter-select" data-table-filter><option>全部狀態</option><option>在職</option><option>試用期</option><option>培訓中</option></select><select class="filter-select"><option>全部據點</option><option>台中總公司</option></select>`)+employeeTable());
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

/* ===== health-documents-v148.js ===== */
(function(){
 const key='bombhr-health-documents-v148';
 const types=window.BOMBHR_CERTIFICATE_TYPES||['健康檢查／體檢證明','CPR＋AED急救訓練證明','工作場所急救人員結業證書','資訊技術／資訊安全證照','設計軟體／視覺設計證照','專案管理證照','其他專業證照'];
 const canManage=()=>['executive','hradmin'].includes(currentRole());
 const canSeeStatus=()=>['executive','hradmin','supervisor'].includes(currentRole());
 const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch(e){return []}};
 const save=items=>localStorage.setItem(key,JSON.stringify(items));
 const statusOf=doc=>{if(doc.reviewStatus==='待補上傳'||doc.reviewStatus==='退回補件')return doc.reviewStatus;if(!doc.expiryDate)return doc.reviewStatus||'待確認';const days=Math.ceil((new Date(doc.expiryDate+'T23:59:59')-new Date())/86400000);return days<0?'已逾期':days<=30?'即將到期':doc.reviewStatus==='待確認'?'待確認':'有效'};
 const employee=id=>(window.BOMBHR_IMPORTED_PERSONNEL||[]).find(item=>item.employeeId===id)||getEmployeeRecord(id);
 const attachmentAccess=()=>['executive','hradmin'].includes(currentRole());
 function statusBadge(status){return badge(status)}
 function summaryRows(){const docs=read(),roster=window.BOMBHR_IMPORTED_PERSONNEL||[];return roster.map(person=>{const own=docs.filter(doc=>doc.employeeId===person.employeeId),latest=own.sort((a,b)=>(b.expiryDate||'').localeCompare(a.expiryDate||''))[0],status=latest?statusOf(latest):'尚無文件',privateValue=value=>canManage()?(value||'—'):'—';return `<tr data-search-row><td><div class="person"><span class="avatar">${person.name[0]}</span><div><b>${person.name}</b><small>${person.employeeId}</small></div></div></td><td>${person.department}・${person.position}</td><td>${privateValue(latest?.type)}</td><td>${privateValue(latest?.examDate)}</td><td>${privateValue(latest?.expiryDate)}</td><td>${statusBadge(status)}</td><td>${privateValue(latest?.paperLocation)}</td><td><button class="table-primary-btn" data-health-employee="${person.employeeId}">${canManage()?'管理文件':'查看狀態'}</button></td></tr>`}).join('')}
 function overview(){if(!canSeeStatus()){toast('此身份沒有健康文件存取權限');return}const docs=read(),states=docs.map(statusOf);openModal('證照／健康文件管理','健康與醫療資料採獨立權限；所有查看、下載與異動均保留紀錄',`<div class="health-kpis"><div><small>員工人數</small><b>${(window.BOMBHR_IMPORTED_PERSONNEL||[]).length}</b></div><div><small>有效文件</small><b>${states.filter(x=>x==='有效').length}</b></div><div><small>即將到期</small><b>${states.filter(x=>x==='即將到期').length}</b></div><div><small>逾期／缺件</small><b>${states.filter(x=>x==='已逾期').length}</b></div></div><div class="health-privacy-note"><b>${canManage()?'目前可管理完整文件':'主管僅可查看有效狀態'}</b><span>${canManage()?'最高權限與財務／人事可上傳、審核及查看原檔。':'檢查內容、醫療附件、文件編號與備註已隱藏。'}</span></div><div class="toolbar"><label class="search-field">⌕<input id="healthSearch" placeholder="搜尋姓名、員編、部門或職位"></label><select id="healthStatusFilter" class="filter-select"><option>全部狀態</option><option>有效</option><option>即將到期</option><option>已逾期</option><option>待確認</option><option>尚無文件</option></select></div><div class="table-wrap health-overview-table"><table><thead><tr><th>員工</th><th>部門／職位</th><th>文件類型</th><th>檢查日期</th><th>有效期限</th><th>狀態</th><th>紙本位置</th><th>操作</th></tr></thead><tbody>${summaryRows()}</tbody></table></div>`,`<button class="secondary-btn" data-modal-close>關閉</button>${canManage()?'<button class="primary-btn" id="healthAddFromOverview">＋ 新增文件</button>':''}`);bindOverview()}
 function bindOverview(){const apply=()=>{const q=($('#healthSearch')?.value||'').toLowerCase(),status=$('#healthStatusFilter')?.value||'全部狀態';$$('.health-overview-table tbody tr').forEach(row=>row.hidden=!row.textContent.toLowerCase().includes(q)||(status!=='全部狀態'&&!row.textContent.includes(status)))};$('#healthSearch')?.addEventListener('input',apply);$('#healthStatusFilter')?.addEventListener('change',apply);$$('[data-health-employee]').forEach(button=>button.onclick=()=>employeeDocuments(button.dataset.healthEmployee));$('#healthAddFromOverview')?.addEventListener('click',()=>chooseEmployee())}
 function chooseEmployee(){openModal('新增證照／健康文件','先選擇文件所屬員工',`<label class="form-field">員工<select id="healthEmployeeSelect" class="form-control">${(window.BOMBHR_IMPORTED_PERSONNEL||[]).map(person=>`<option value="${person.employeeId}">${person.name}・${person.employeeId}・${person.position}</option>`).join('')}</select></label>`,`<button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="healthChooseEmployee">下一步</button>`);$('#healthChooseEmployee').onclick=()=>editDocument($('#healthEmployeeSelect').value)}
 function employeeDocuments(employeeId){const person=employee(employeeId);if(!person||!canSeeStatus())return;const docs=read().filter(doc=>doc.employeeId===employeeId);openModal('證照與健康文件',`${person.name}・${person.employeeId}・${person.department}／${person.position}`,`<div class="health-privacy-note"><b>${canManage()?'完整文件管理權限':'僅顯示合規狀態'}</b><span>${canManage()?'可查看文件內容、紙本位置及附件。':'醫療內容與附件只開放最高權限及財務／人事。'}</span></div>${docs.length?`<div class="health-document-list">${docs.map(doc=>`<div class="health-document-card"><div><b>${doc.type}</b><small>${canManage()?`${doc.institution||'未填機構'}・文件編號 ${doc.documentNumber||'—'}`:'文件內容已隱藏'}</small></div><div><small>檢查／發證</small><b>${doc.examDate||'—'}</b></div><div><small>有效期限</small><b>${doc.expiryDate||'—'}</b></div>${statusBadge(statusOf(doc))}<div class="health-card-actions">${canManage()?`<button data-health-edit="${doc.id}">編輯</button>${doc.attachmentData?`<button data-health-download="${doc.id}">查看原檔</button>`:''}`:''}</div></div>`).join('')}</div>`:'<div class="empty-state">目前沒有證照或健康文件紀錄</div>'}`,`<button class="secondary-btn" data-modal-close>關閉</button>${canManage()?`<button class="primary-btn" data-health-add="${employeeId}">＋ 新增文件</button>`:''}`);$$('[data-health-edit]').forEach(button=>button.onclick=()=>editDocument(employeeId,button.dataset.healthEdit));$$('[data-health-download]').forEach(button=>button.onclick=()=>viewAttachment(button.dataset.healthDownload));$('[data-health-add]')?.addEventListener('click',event=>editDocument(event.target.dataset.healthAdd))}
 function editDocument(employeeId,id=''){const person=employee(employeeId),existing=read().find(doc=>doc.id===id)||{};let attachmentData=existing.attachmentData||'',attachmentName=existing.attachmentName||'';openModal(existing.id?'編輯證照／健康文件':'新增證照／健康文件',`${person.name}・${person.employeeId}・健康資料屬敏感個資`,`<div class="form-grid"><label class="form-field">文件類型<select id="healthType" class="form-control">${types.map(type=>`<option ${existing.type===type?'selected':''}>${type}</option>`).join('')}</select></label><label class="form-field">檢查／發證機構<input id="healthInstitution" class="form-control" value="${existing.institution||''}" placeholder="例如：○○醫院"></label><label class="form-field">檢查／發證日期<input id="healthExamDate" type="date" class="form-control" value="${existing.examDate||''}"></label><label class="form-field">有效期限<input id="healthExpiryDate" type="date" class="form-control" value="${existing.expiryDate||''}"></label><label class="form-field">文件編號<input id="healthDocumentNumber" class="form-control" value="${existing.documentNumber||''}"></label><label class="form-field">紙本正本位置<input id="healthPaperLocation" class="form-control" value="${existing.paperLocation||''}" placeholder="例如：台中店資料櫃 A-3"></label><label class="form-field">審核狀態<select id="healthReviewStatus" class="form-control">${['待確認','有效','退回補件'].map(item=>`<option ${existing.reviewStatus===item?'selected':''}>${item}</option>`).join('')}</select></label><label class="form-field">員工本人可查看<select id="healthEmployeeView" class="form-control"><option value="yes" ${existing.employeeCanView!==false?'selected':''}>可以</option><option value="no" ${existing.employeeCanView===false?'selected':''}>不可以</option></select></label><label class="form-field full">人事備註<textarea id="healthNotes" class="form-control" rows="3">${existing.notes||''}</textarea></label></div><label class="health-upload">上傳掃描檔或照片<small>PDF、JPG、PNG、WEBP；Demo 上限 1.2 MB</small><input id="healthAttachment" type="file" accept="application/pdf,image/jpeg,image/png,image/webp"></label><div id="healthAttachmentPreview" class="health-attachment-preview">${attachmentName?`<b>${attachmentName}</b><small>已保存附件</small>`:'<small>尚未選擇附件；紙本仍應依公司規則保存</small>'}</div><p id="healthFormError" class="form-error"></p>`,`<button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="saveHealthDocument">儲存文件</button>`);$('#healthAttachment').onchange=event=>{const file=event.target.files[0];if(!file)return;if(file.size>1258291){$('#healthFormError').textContent='附件超過 1.2 MB，請壓縮後重新上傳。';event.target.value='';return}const reader=new FileReader();reader.onload=()=>{attachmentData=reader.result;attachmentName=file.name;$('#healthAttachmentPreview').innerHTML=`<b>${file.name}</b><small>${Math.ceil(file.size/1024)} KB・已準備儲存</small>`};reader.readAsDataURL(file)};$('#saveHealthDocument').onclick=()=>{const examDate=$('#healthExamDate').value;if(!examDate){$('#healthFormError').textContent='請填寫檢查或發證日期。';return}const all=read(),record={id:existing.id||`HD-${Date.now()}`,employeeId,type:$('#healthType').value,institution:$('#healthInstitution').value.trim(),examDate,expiryDate:$('#healthExpiryDate').value,documentNumber:$('#healthDocumentNumber').value.trim(),paperLocation:$('#healthPaperLocation').value.trim(),reviewStatus:$('#healthReviewStatus').value,employeeCanView:$('#healthEmployeeView').value==='yes',notes:$('#healthNotes').value.trim(),attachmentData,attachmentName,updatedBy:`${currentProfile().name}・${currentProfile().id}`,updatedAt:new Date().toISOString()};const index=all.findIndex(item=>item.id===record.id);if(index>=0)all[index]=record;else all.unshift(record);save(all);addAudit(existing.id?'編輯健康文件':'新增健康文件',`${person.name}・${person.employeeId}・${record.type}`);employeeDocuments(employeeId);toast('證照／健康文件已儲存並留下稽核紀錄')}}
 function viewAttachment(id){const doc=read().find(item=>item.id===id);if(!doc?.attachmentData||!attachmentAccess())return;addAudit('查看健康文件原檔',`${doc.employeeId}・${doc.type}`);if(doc.attachmentData.startsWith('data:application/pdf')){const link=document.createElement('a');link.href=doc.attachmentData;link.target='_blank';link.rel='noopener';link.click()}else openModal('健康文件原檔',`${doc.type}・查看行為已寫入稽核紀錄`,`<div class="health-image-preview"><img src="${doc.attachmentData}" alt="${doc.type}"></div>`,`<button class="secondary-btn" data-modal-close>關閉</button>`)}
 function addEntry(){if(location.hash!=='#employees'||!canSeeStatus())return;const actions=$('.page-actions');if(actions&&!$('#healthDocumentsBtn')){const button=document.createElement('button');button.id='healthDocumentsBtn';button.className='secondary-btn';button.textContent='證照／健康文件';button.onclick=overview;actions.prepend(button)}}
 const employeePage=views.employees;
 views.employees=()=>employeePage();
 document.addEventListener('click',event=>{const target=event.target.closest('[data-view-employee],[data-edit-employee]');if(!target)return;const employeeId=target.dataset.viewEmployee||target.dataset.editEmployee;setTimeout(()=>{if(canSeeStatus()&&!$('#employeeHealthDocumentsBtn'))$('#modalActions').insertAdjacentHTML('afterbegin',`<button class="secondary-btn" id="employeeHealthDocumentsBtn">證照與健康文件</button>`);$('#employeeHealthDocumentsBtn')?.addEventListener('click',()=>employeeDocuments(employeeId));if(target.dataset.viewEmployee&&canManage()&&!$('#employeeEditProfileBtn'))$('#modalActions').insertAdjacentHTML('afterbegin','<button class="primary-btn" id="employeeEditProfileBtn">編輯人事資料</button>');$('#employeeEditProfileBtn')?.addEventListener('click',()=>{employeeModal(employeeId,true);enhanceEmployeeSalaryPage(employeeId)})},0)},true);
 document.addEventListener('click',event=>{if(event.target.closest('[data-health-overview]'))overview();const rowButton=event.target.closest('[data-health-row]');if(rowButton)employeeDocuments(rowButton.dataset.healthRow)},true);
 window.addEventListener('hashchange',()=>setTimeout(addEntry,0));new MutationObserver(addEntry).observe(document.body,{childList:true,subtree:true});setTimeout(addEntry,0);
 const oldPermissions=window.permissionsView;window.permissionsView=function(){return oldPermissions()+`<section class="panel permission-level-help"><div class="panel-head"><div><h3>權限層級說明</h3><p>設定身份時可隨時查看，敏感資料仍須另外授權</p></div></div><div class="permission-level-grid"><div><b>查看</b><span>僅能瀏覽資料與明細。</span></div><div><b>編輯</b><span>可修改既有資料，但不能新增、刪除或調整制度。</span></div><div><b>管理</b><span>包含查看、編輯、新增、停用、批次操作及規則設定。</span></div><div><b>敏感資料</b><span>薪資、銀行、身分與醫療文件必須另外授權。</span></div></div></section>`};
 if(location.hash==='#employees')window.dispatchEvent(new HashChangeEvent('hashchange'));
})();

/* ===== employee-master-edit-v150.js ===== */
(function(){
 const allowed=()=>['executive','hradmin','supervisor'].includes(currentRole());
 const sensitive=()=>['executive','hradmin'].includes(currentRole());
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const option=(value,current)=>`<option ${value===current?'selected':''}>${value}</option>`;
 function saveEmployeeMaster(id,changes){let overrides={};try{overrides=JSON.parse(localStorage.getItem('bombhr-employee-org-overrides')||'{}')}catch(e){}overrides[id]={...(overrides[id]||{}),...changes};localStorage.setItem('bombhr-employee-org-overrides',JSON.stringify(overrides))}
 function detail(label,value,privateField=false){return `<div class="detail-box ${privateField?'sensitive-detail':''}"><small>${label}</small><b>${esc(value||'—')}</b></div>`}
 function masterView(e){return `<div class="employee-profile-banner"><div class="avatar">${esc(e.name?.[0]||'員')}</div><div><b>${esc(e.name)}</b><small>${esc(e.englishName||'尚未填寫英文姓名')}・${esc(e.position)}・${esc(e.department)}</small></div>${badge(e.status||'在職')}</div><div class="employee-master-section"><div class="section-heading"><div><b>基本身分資料</b><small>姓名與員工編號建立後不可重複或任意變更</small></div></div><div class="detail-grid">${detail('中文姓名',e.name)}${detail('英文姓名',e.englishName)}${detail('員工編號',e.employeeId)}${detail('出生年月日',e.birthDate)}${detail('身分證／居留證號',sensitive()?e.identityNumber:'••••••••••',true)}${detail('性別',e.gender)}</div></div><div class="employee-master-section"><div class="section-heading"><div><b>聯絡資料</b><small>供公司聯絡與緊急通知使用</small></div></div><div class="detail-grid">${detail('公司 Email',e.email)}${detail('私人 Email',e.personalEmail)}${detail('聯絡電話',e.phone)}${detail('緊急聯絡人',e.emergencyContact)}${detail('緊急聯絡電話',e.emergencyPhone)}${detail('戶籍／通訊地址',sensitive()?e.address:'已依權限隱藏',true)}</div></div><div class="employee-master-section"><div class="section-heading"><div><b>任用與組織資料</b><small>公司、據點、部門、職位及直屬主管</small></div></div><div class="detail-grid">${detail('公司／據點',`${e.company||'ABOMB'}・${e.location||'台中總公司'}`)}${detail('部門／職位',`${e.department||'—'}・${e.position||'—'}`)}${detail('直屬主管',e.manager)}${detail('到職日',e.hireDate)}${detail('任用類型／試用期間',`${e.employmentType||'—'}・${e.probation||'—'}`)}${detail('身份範本／帳號',`${e.roleGroup||'一般員工'}・${e.accountStatus||'啟用'}`)}</div></div>${e.notes?`<div class="policy-note"><b>人事備註</b><span>${esc(e.notes)}</span></div>`:''}`}
 function masterForm(e){const full=sensitive(),lock=full?'':'disabled';return `<div class="employee-master-access"><b>${full?'完整人事主檔編輯':'部門主管人事編輯'}</b><span>${full?'最高權限與財務／人事可維護完整欄位。':'可維護基本、聯絡、任用與組織資料；證號及地址由財務／人事維護。'}</span></div><div class="employee-master-section"><div class="section-heading"><div><b>基本身分資料</b><small>中文姓名及員工編號不可修改</small></div></div><div class="form-grid"><label class="form-field">中文姓名<input class="form-control" value="${esc(e.name)}" readonly></label><label class="form-field">英文姓名<input id="masterEnglishName" class="form-control" value="${esc(e.englishName)}" placeholder="例如：KEN CHEN"></label><label class="form-field">員工編號<input class="form-control" value="${esc(e.employeeId)}" readonly></label><label class="form-field">出生年月日<input id="masterBirthDate" type="date" class="form-control" value="${esc(e.birthDate)}"></label><label class="form-field">身分證／居留證號<input id="masterIdentityNumber" class="form-control" value="${esc(full?e.identityNumber:'')}" ${lock} placeholder="${full?'請輸入證號':'僅最高權限與財務／人事可編輯'}"></label><label class="form-field">性別<select id="masterGender" class="form-control"><option value="">未設定</option>${['女性','男性','非二元／其他','不提供'].map(value=>option(value,e.gender)).join('')}</select></label></div></div><div class="employee-master-section"><div class="section-heading"><div><b>聯絡與緊急聯絡資料</b><small>未填寫的欄位可以直接補建</small></div></div><div class="form-grid"><label class="form-field">公司 Email<input id="masterEmail" type="email" class="form-control" value="${esc(e.email)}"></label><label class="form-field">私人 Email<input id="masterPersonalEmail" type="email" class="form-control" value="${esc(e.personalEmail)}"></label><label class="form-field">聯絡電話<input id="masterPhone" class="form-control" value="${esc(e.phone)}"></label><label class="form-field">緊急聯絡人<input id="masterEmergencyContact" class="form-control" value="${esc(e.emergencyContact)}"></label><label class="form-field">緊急聯絡電話<input id="masterEmergencyPhone" class="form-control" value="${esc(e.emergencyPhone)}"></label><label class="form-field">戶籍／通訊地址<input id="masterAddress" class="form-control" value="${esc(full?e.address:'')}" ${lock} placeholder="${full?'請輸入地址':'僅最高權限與財務／人事可編輯'}"></label></div></div><div class="employee-master-section"><div class="section-heading"><div><b>任用與組織資料</b><small>修改後會保留操作人與時間</small></div></div><div class="form-grid"><label class="form-field">公司<select id="masterCompany" class="form-control"><option>ABOMB</option></select></label><label class="form-field">工作據點<select id="masterLocation" class="form-control"><option>台中總公司</option></select></label><label class="form-field">部門<select id="masterDepartment" class="form-control">${['企劃','技術','財務/人事'].map(value=>option(value,e.department)).join('')}</select></label><label class="form-field">職位<input id="masterPosition" class="form-control" value="${esc(e.position)}"></label><label class="form-field">直屬主管<select id="masterManager" class="form-control"><option value="無">無</option>${(window.BOMBHR_IMPORTED_PERSONNEL||[]).filter(person=>person.employeeId!==e.employeeId).map(person=>option(`${person.name}・${person.employeeId}`,e.manager)).join('')}</select></label><label class="form-field">到職日<input id="masterHireDate" type="date" class="form-control" value="${esc(e.hireDate)}"></label><label class="form-field">任用類型<select id="masterEmploymentType" class="form-control">${['正式任用','試用期','培訓新人','定期契約'].map(value=>option(value,e.employmentType)).join('')}</select></label><label class="form-field">試用／培訓期間<select id="masterProbation" class="form-control">${['不適用','1 個月','2 個月','3 個月','6 個月','自訂'].map(value=>option(value,e.probation)).join('')}</select><input id="masterProbationCustom" class="form-control compact-followup" value="${esc(e.probationCustom)}" placeholder="自訂期間說明"></label><label class="form-field">身份範本<select id="masterRoleGroup" class="form-control">${['最高權限','部門主管','財務人事行政','系統管理員','一般員工'].map(value=>option(value,e.roleGroup)).join('')}</select></label><label class="form-field">帳號狀態<select id="masterAccountStatus" class="form-control">${['立即啟用','到職日啟用','暫不啟用','停用'].map(value=>option(value,e.accountStatus)).join('')}</select></label><label class="form-field">任職狀態<select id="masterStatus" class="form-control">${['在職','試用期','培訓中','留職停薪','離職','停用'].map(value=>option(value,e.status)).join('')}</select></label><label class="form-field full">人事備註<textarea id="masterNotes" class="form-control" rows="3" placeholder="輸入人事建檔或異動備註">${esc(e.notes)}</textarea></label></div></div><p id="employeeMasterError" class="form-error"></p>`}
 window.employeeModal=function(id,edit){const e=getEmployeeRecord(id);if(!e)return;const editable=edit&&allowed();openModal(edit?'編輯員工人事主檔':'員工人事主檔',`${e.name}・${e.employeeId}`,editable?masterForm(e):masterView(e),edit?`<button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="saveEmployeeMaster">儲存人事主檔</button>`:'');if(edit&&!editable){$('#modalBody').insertAdjacentHTML('afterbegin','<div class="permission-banner">目前身份沒有員工人事編輯權限。</div>');return}if(!editable)return;$('#saveEmployeeMaster').onclick=()=>{const birthDate=$('#masterBirthDate').value,email=$('#masterEmail').value.trim(),phone=$('#masterPhone').value.trim();if(email&&!/^\S+@\S+\.\S+$/.test(email)){$('#employeeMasterError').textContent='公司 Email 格式不正確。';return}const changes={englishName:$('#masterEnglishName').value.trim(),birthDate,gender:$('#masterGender').value,email,personalEmail:$('#masterPersonalEmail').value.trim(),phone,emergencyContact:$('#masterEmergencyContact').value.trim(),emergencyPhone:$('#masterEmergencyPhone').value.trim(),company:$('#masterCompany').value,location:$('#masterLocation').value,department:$('#masterDepartment').value,position:$('#masterPosition').value.trim(),manager:$('#masterManager').value,hireDate:$('#masterHireDate').value,employmentType:$('#masterEmploymentType').value,probation:$('#masterProbation').value,probationCustom:$('#masterProbationCustom').value.trim(),roleGroup:$('#masterRoleGroup').value,accountStatus:$('#masterAccountStatus').value,status:$('#masterStatus').value,notes:$('#masterNotes').value.trim(),updatedBy:`${currentProfile().name}・${currentProfile().id}`,updatedAt:new Date().toISOString()};if(sensitive()){changes.identityNumber=$('#masterIdentityNumber').value.trim();changes.address=$('#masterAddress').value.trim()}const changed=Object.entries(changes).filter(([field,value])=>!['updatedBy','updatedAt'].includes(field)&&String(e[field]??'')!==String(value??'')).map(([field])=>field);saveEmployeeMaster(id,changes);addAudit('編輯員工人事主檔',`${e.name}・${id}・異動 ${changed.length} 個欄位`);closeModal();location.hash='employees';window.dispatchEvent(new HashChangeEvent('hashchange'));toast(`${e.name}的人事主檔已儲存`)} };
})();

/* ===== certificate-settings-v151.js ===== */
(function(){
 const config=window.BOMBHR_CERTIFICATE_REQUIREMENTS;
 if(!config)return;
 const canConfigure=()=>['executive','system'].includes(currentRole());
 const positions=['前端工程師','全端工程師','專員','美編設計師','企劃-經理辦公室','技術企劃','CS主管','CS組長','技術長','設計師','主管'];
 function syncPlaceholders(){const roster=window.BOMBHR_IMPORTED_PERSONNEL||[],assigned=new Set(),documentKey='bombhr-health-documents-v148';let docs=[];try{docs=JSON.parse(localStorage.getItem(documentKey)||'[]')}catch(e){}roster.forEach(person=>{const rule=config.forPosition(person.position);rule.required.forEach(type=>{const token=`${person.employeeId}|${type}`;assigned.add(token);const existing=docs.find(doc=>doc.employeeId===person.employeeId&&doc.type===type);if(existing){existing.requirementLevel='required';return}docs.push({id:`REQ-${person.employeeId}-${type}`,employeeId:person.employeeId,type,requirementLevel:'required',placeholder:true,institution:'',examDate:'',expiryDate:'',documentNumber:'',paperLocation:'',reviewStatus:'待補上傳',employeeCanView:true,notes:'公司依職位指派的必備文件',attachmentData:'',attachmentName:'',updatedAt:new Date().toISOString()})})});docs=docs.filter(doc=>!doc.placeholder||doc.attachmentData||assigned.has(`${doc.employeeId}|${doc.type}`));localStorage.setItem(documentKey,JSON.stringify(docs))}
  function openSettings(){if(!canConfigure()){toast('只有最高權限或系統管理員可以設定證照選項');return}let data=config.read(),current=positions[0];const draw=()=>{const rule=data[current]||{required:['健康檢查／體檢證明'],recommended:[]};openModal('證照需求設定','系統管理員只設定選項與職位規則，不會取得員工健康附件',`<div class="certificate-settings-layout"><aside>${positions.map(position=>`<button data-certificate-position="${position}" class="${position===current?'active':''}">${position}</button>`).join('')}</aside><section><div class="health-privacy-note"><b>${current}</b><span>必備項目會列入缺件；建議項目只供員工選擇，不影響合規狀態。</span></div><div class="certificate-rule-list">${window.BOMBHR_CERTIFICATE_TYPES.map(type=>{const level=rule.required.includes(type)?'required':rule.recommended.includes(type)?'recommended':'off';return `<div><span><b>${type}</b><small>${type==='健康檢查／體檢證明'?'全員基本人事文件':'依職務需求選填'}</small></span><select data-certificate-type="${type}" ${type==='健康檢查／體檢證明'?'disabled':''}><option value="off" ${level==='off'?'selected':''}>不適用</option><option value="recommended" ${level==='recommended'?'selected':''}>建議補充</option><option value="required" ${level==='required'?'selected':''}>必備</option></select></div>`}).join('')}</div></section></div>`,`<button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="saveCertificateSettings">儲存證照需求</button>`);$$('[data-certificate-position]').forEach(button=>button.onclick=()=>{readCurrent();current=button.dataset.certificatePosition;draw()});$('#saveCertificateSettings').onclick=()=>{readCurrent();config.save(data);syncPlaceholders();addAudit('修改證照需求設定',`${current}・必備 ${data[current].required.length} 項・建議 ${data[current].recommended.length} 項`);closeModal();toast('證照需求已儲存，後台與 Employee App 將同步套用')};function readCurrent(){const selects=$$('[data-certificate-type]');if(!selects.length)return;data[current]={required:selects.filter(item=>item.value==='required').map(item=>item.dataset.certificateType),recommended:selects.filter(item=>item.value==='recommended').map(item=>item.dataset.certificateType)};if(!data[current].required.includes('健康檢查／體檢證明'))data[current].required.unshift('健康檢查／體檢證明')}};draw()}
 function addEntry(){if(location.hash!=='#settings'||!canConfigure()||$('#certificateSettingsBtn'))return;const actions=$('.page-actions');if(!actions)return;const button=document.createElement('button');button.id='certificateSettingsBtn';button.className='secondary-btn';button.textContent='證照需求設定';button.onclick=openSettings;actions.prepend(button)}
 syncPlaceholders();window.addEventListener('hashchange',()=>setTimeout(addEntry,0));new MutationObserver(addEntry).observe(document.body,{childList:true,subtree:true});setTimeout(addEntry,0);window.openCertificateRequirementSettings=openSettings;
})();

/* ===== v154-certificate-cleanup.js ===== */
(function(){
 const key='bombhr-health-documents-v148';
 let documents=[];
 try{documents=JSON.parse(localStorage.getItem(key)||'[]')}catch(e){}
 const before=documents.length;
 documents=documents.filter(document=>{
  const isEmptyCpr=document.type==='CPR＋AED急救訓練證明'&&!document.attachmentData&&!document.attachmentName;
  const isAutomatic=document.placeholder||document.reviewStatus==='待補上傳'||String(document.id||'').startsWith('REQ-');
  return !(isEmptyCpr&&isAutomatic);
 });
 if(documents.length!==before)localStorage.setItem(key,JSON.stringify(documents));
 localStorage.setItem('bombhr-v154-cpr-cleanup',new Date().toISOString());
 if(location.hash==='#employees')window.dispatchEvent(new HashChangeEvent('hashchange'));
})();

/* ===== v159-role-linkage.js ===== */
(function(){
 const roleKey='bombhr-role-designer-v147';
 const routes=['dashboard','organization','employees','attendance','scheduling','approvals','payroll','announcements','permissions','settings'];
 function readDesigner(){try{return JSON.parse(localStorage.getItem(roleKey)||'{}')}catch(e){return{}}}
 function profileKey(id){
  if(id==='AB00002')return'supervisor_ken';
  if(id==='AB00003')return'supervisor_ru';
  if(id==='AB00006')return'supervisor_rou';
  return'supervisor_'+id.toLowerCase();
 }
 function syncSupervisorProfiles(){
  const data=readDesigner().supervisor||{},fallback=['AB00002','AB00003','AB00006'],members=data.members||fallback,scopes=data.memberDepartments||{AB00002:['企劃'],AB00003:['企劃'],AB00006:['技術']};
  Object.keys(roleProfiles).forEach(key=>{if(roleProfiles[key].role==='supervisor')delete roleProfiles[key]});
  members.forEach(id=>{
   const person=(window.BOMBHR_IMPORTED_PERSONNEL||[]).find(item=>item.employeeId===id);
   if(!person)return;
   roleProfiles[profileKey(id)]={role:'supervisor',label:'部門主管',name:person.name,id:person.employeeId,department:(scopes[id]||[person.department])[0],routes:[...routes],payrollEdit:false};
  });
 }
 function scopeMembers(){
  const p=currentProfile();
  if(p.role!=='supervisor')return null;
  return (window.BOMBHR_IMPORTED_PERSONNEL||[]).filter(person=>person.department===p.department);
 }
 function filterOperationalRows(){
  const members=scopeMembers();
  if(!members)return;
  const routesToFilter=['attendance','scheduling','approvals','payroll'],route=location.hash.replace('#','');
  if(!routesToFilter.includes(route))return;
  document.querySelectorAll('#content tbody tr').forEach(row=>{
   const person=members.find(item=>row.textContent.includes(item.name)||row.textContent.includes(item.employeeId));
   const anyPerson=(window.BOMBHR_IMPORTED_PERSONNEL||[]).find(item=>row.textContent.includes(item.name)||row.textContent.includes(item.employeeId));
   if(anyPerson&&!person)row.hidden=true;
   if(row.dataset.department)row.hidden=row.dataset.department!==currentProfile().department;
  });
 }
 function updateDesignerLabels(){
  if(location.hash!=='#permissions')return;
  const active=document.querySelector('[data-designer-role="supervisor"].active');
  if(!active)return;
  document.querySelectorAll('[data-designer-tab]').forEach(button=>{if(button.dataset.designerTab==='assignment')button.textContent='人員與部門'});
  const tab=document.querySelector('[data-designer-tab="assignment"]');
  if(tab&&!tab.querySelector('small'))tab.insertAdjacentHTML('beforeend','<small class="linked-tab-note">連動後台帳號</small>');
 }
 syncSupervisorProfiles();
 let queued=false;
 const refresh=()=>{if(queued)return;queued=true;setTimeout(()=>{queued=false;filterOperationalRows();updateDesignerLabels()},0)};
 window.addEventListener('hashchange',refresh);
 new MutationObserver(refresh).observe(document.getElementById('content'),{childList:true,subtree:true});
 document.addEventListener('click',event=>{
  const payroll=event.target.closest('[data-payroll-person-detail]');
  if(payroll&&currentProfile().role==='supervisor'){
   const record=(window.BOMBHR_IMPORTED_PERSONNEL||[]).find(item=>item.employeeId===payroll.dataset.payrollPersonDetail);
   if(record&&record.department!==currentProfile().department){event.preventDefault();event.stopImmediatePropagation();toast('此員工不在目前主管的部門權限範圍內')}
  }
 },true);
 refresh();
})();

/* ===== v157-account-audit.js ===== */
(function(){
 const descriptions={executive:'全公司最高權限',supervisor:'所屬部門的人事、出勤、排班與簽核',hradmin:'人事、薪資、福利、出勤、排班、簽核及報表'};
 function accountKey(){return typeof currentAccount==='function'?currentAccount():'executive'}
 function installSwitcher(){
  const button=document.getElementById('roleSwitchBtn');
  if(!button||button.dataset.accountSwitcher==='1')return;
  button.dataset.accountSwitcher='1';
  const profile=currentProfile();
  button.innerHTML='<i>⇄</i><span><small>目前帳號／權限</small><b>'+profile.name+'・'+profile.label+'</b></span>';
  button.onclick=()=>{
   const cards=Object.entries(roleProfiles).map(([key,p])=>{
    const active=key===accountKey();
    return '<button data-switch-account="'+key+'" class="'+(active?'active':'')+'"><span>'+p.name[0]+'</span><div><b>'+p.name+'・'+p.label+'</b><small>'+p.id+'・'+p.department+'</small><p>'+descriptions[p.role]+'</p></div><em>'+(active?'目前使用':'切換 →')+'</em></button>';
   }).join('');
   openModal('切換後台操作帳號','依實際主管切換；部門範圍、簽核人與稽核責任會套用該帳號','<div class="role-switch-grid">'+cards+'</div>','<button class="secondary-btn" data-modal-close>取消</button>');
   document.querySelectorAll('[data-switch-account]').forEach(item=>item.onclick=()=>{
    const account=item.dataset.switchAccount,p=roleProfiles[account];
    sessionStorage.setItem('bombhr-admin-account',account);
    sessionStorage.setItem('bombhr-admin-role',p.role);
    sessionStorage.setItem('bombhr-admin','1');
    location.hash='dashboard';
    location.reload();
   });
  };
 }
 function applyAccountScope(){
  const p=currentProfile(),content=document.getElementById('content');
  if(!content||p.role!=='supervisor')return;
  const head=content.querySelector('.page-head');
  if(head&&!document.getElementById('accountScopeBadge'))head.insertAdjacentHTML('afterend','<div id="accountScopeBadge" class="permission-locked"><b>'+p.name+'・'+p.id+'</b>｜目前僅顯示「'+p.department+'」部門資料；簽核與稽核將記錄此帳號。</div>');
  if(location.hash==='#organization')document.querySelectorAll('.org-department-v147').forEach(group=>group.hidden=!group.querySelector('summary')?.textContent.includes(p.department));
  if(location.hash==='#employees')document.querySelectorAll('#content tbody tr').forEach(row=>row.hidden=!row.textContent.includes(p.department));
  if(location.hash==='#approvals')document.querySelectorAll('#content tbody tr').forEach(row=>{
   const person=peopleForScope().find(item=>row.textContent.includes(item.name)||row.textContent.includes(item.employeeId));
   if(person)row.hidden=person.department!==p.department;
  });
 }
 function peopleForScope(){return window.BOMBHR_IMPORTED_PERSONNEL||[]}
 updateSharedApproval=function(id,status,statusText,rejectReason){
  const events=getSharedEvents(),item=events.find(e=>e.id===id||e.eventId===id),p=currentProfile();
  if(!item)return;
  Object.assign(item,{status,statusText,rejectReason:rejectReason||'',reviewedAt:new Date().toISOString(),reviewer:p.name,reviewerId:p.id,reviewerRole:p.label,reviewerDepartment:p.department});
  saveSharedEvents(events);
 };
 completeAdminApproval=function(index,status,note){
  const a=approvals[index],records=getAdminApprovalRecords(),p=currentProfile();
  records.unshift({id:'DEMO-'+index,title:a[1],employee:a[2],period:a[3],status,note:note||'',reviewer:p.name,reviewerId:p.id,role:p.label,department:p.department,completedAt:new Date().toLocaleString('zh-TW',{hour12:false})});
  localStorage.setItem('bombhr-admin-approval-records',JSON.stringify(records));
  updateNotificationIndicators();
  location.hash='approvals';
  window.dispatchEvent(new HashChangeEvent('hashchange'));
 };
 completedApprovalTable=function(){
  const shared=getSharedEvents().filter(e=>e.category==='approval'&&e.status!=='review').map(e=>({title:e.title,employee:e.employee,period:e.period,status:e.statusText,reviewer:(e.reviewer||'尚未記錄')+'・'+(e.reviewerId||'—'),role:e.reviewerRole||'主管',department:e.reviewerDepartment||'—',time:e.reviewedAt?new Date(e.reviewedAt).toLocaleString('zh-TW',{hour12:false}):'—'}));
  const fixed=getAdminApprovalRecords().map(r=>({title:r.title,employee:r.employee,period:r.period,status:r.status,reviewer:r.reviewer+'・'+r.reviewerId,role:r.role||'主管',department:r.department||'—',time:r.completedAt}));
  const rows=[...shared,...fixed],body=rows.length?rows.map(r=>'<tr><td>'+r.title+'</td><td>'+r.employee+'</td><td>'+r.period+'</td><td>'+badge(r.status)+'</td><td>'+r.reviewer+'<small style="display:block;color:var(--muted)">'+r.role+'・'+r.department+'</small></td><td>'+r.time+'</td></tr>').join(''):'<tr><td colspan="6" class="empty-state">尚無已完成簽核紀錄</td></tr>';
  return '<div class="table-wrap"><table><thead><tr><th>申請項目</th><th>申請人</th><th>日期／時段</th><th>結果</th><th>審核人／責任範圍</th><th>完成時間</th></tr></thead><tbody>'+body+'</tbody></table></div>';
 };
 let scopeQueued=false;
 new MutationObserver(()=>{installSwitcher();if(!scopeQueued){scopeQueued=true;setTimeout(()=>{scopeQueued=false;applyAccountScope()},0)}}).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('hashchange',()=>setTimeout(applyAccountScope,0));
 setTimeout(()=>{installSwitcher();applyAccountScope()},0);
})();

/* ===== v158-hard-scope.js ===== */
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

/* ===== v160-custom-role-groups.js ===== */
(function(){
 'use strict';
 const key='bombhr-role-designer-v147',uiKey='bombhr-role-designer-ui';
 const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch(e){return{}}};
 const save=data=>localStorage.setItem(key,JSON.stringify(data));
 function enhance(){
  if(location.hash!=='#permissions')return;
  document.querySelector('[data-designer-role="supervisor"]')?.remove();
  const ui=(()=>{try{return JSON.parse(sessionStorage.getItem(uiKey)||'{}')}catch(e){return{}}})(),data=read(),active=data[ui.role];
  if(active?.baseType==='supervisor'){const assignmentTab=document.querySelector('[data-designer-tab="assignment"]');if(assignmentTab)assignmentTab.textContent='人員與部門'}
  if(active?.baseType==='supervisor'&&ui.tab==='assignment'){
   document.querySelectorAll('[data-assignment-row]').forEach(row=>{if(row.querySelector('[data-member-department]'))return;const member=row.querySelector('[data-member]'),person=(window.BOMBHR_IMPORTED_PERSONNEL||[]).find(item=>item.employeeId===member?.dataset.member);if(!member||!person)return;const selected=(active.memberDepartments||{})[person.employeeId]?.[0]||person.department,select=document.createElement('select');select.dataset.memberDepartment=person.employeeId;select.innerHTML=['企劃','技術','財務/人事'].map(dept=>'<option value="'+dept+'"'+(dept===selected?' selected':'')+'>'+dept+'</option>').join('');select.disabled=!member.checked;row.insertBefore(select,member)});
   const button=document.querySelector('[data-save-role]');if(button){button.removeAttribute('data-save-role');button.dataset.v160Save='1'}
  }
  const modal=document.getElementById('modal'),confirm=document.getElementById('confirmCreateIdentity');
  if(!modal?.classList.contains('open')||!confirm||confirm.dataset.customGroupReady)return;
  const replacement=confirm.cloneNode(true);replacement.dataset.customGroupReady='1';confirm.replaceWith(replacement);
  replacement.onclick=()=>{
   const template=document.querySelector('input[name="identityTemplate"]:checked')?.value||'custom';
   const name=document.getElementById('customIdentityName').value.trim();
   if(!name){document.getElementById('identityCreateError').textContent='請輸入身份群組名稱';return}
   const data=read(),id=(template==='supervisor'?'supervisor-custom-':'custom-')+Date.now();
   const modules=['organization','employees','attendance','scheduling','approvals','payroll','eventlog','permissions','settings'];
   const role=template==='supervisor'?{name,en:'Custom Department Supervisor',description:'自訂主管身份・依人員與部門設定管理範圍',baseType:'supervisor',protected:false,scope:'managed',departments:[],memberDepartments:{},includeChildren:true,includeActing:true,includeSupport:false,members:[],permissions:{organization:'view',employees:'edit',attendance:'edit',scheduling:'manage',approvals:'manage',payroll:'view',permissions:'hidden',settings:'hidden'},sensitive:{salaryView:true,salaryEdit:false,salaryExport:false,bankMasked:false,bankFull:false,identity:false,address:false,insurance:false,medical:true,audit:false}}:{name,en:'Custom Role',description:'由最高權限自訂可查看的資料與功能',protected:false,scope:'self',members:[],permissions:Object.fromEntries(modules.map(item=>[item,'hidden'])),sensitive:{salaryView:false,salaryEdit:false,salaryExport:false,bankMasked:false,bankFull:false,identity:false,address:false,insurance:false,medical:false,audit:false}};
   data[id]=role;delete data.supervisor;save(data);sessionStorage.setItem(uiKey,JSON.stringify({role:id,tab:'scope'}));if(typeof closeModal==='function')closeModal();location.hash='permissions';window.dispatchEvent(new HashChangeEvent('hashchange'));if(typeof addAudit==='function')addAudit('新增身份群組',name);toast('已建立「'+name+'」，請設定人員與部門')
 };
 }
 function createIdentityDirect(event){
  const button=event.target.closest('#confirmCreateIdentity');if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();
  const name=document.getElementById('customIdentityName')?.value.trim()||'',error=document.getElementById('identityCreateError');
  if(!name){if(error)error.textContent='請輸入身份顯示名稱';return}
  const data=read();if(Object.values(data).some(role=>role.name===name)){if(error)error.textContent='此身份名稱已存在，請使用其他名稱';return}
  const template=document.querySelector('input[name="identityTemplate"]:checked')?.value||'custom',id=(template==='supervisor'?'supervisor-custom-':'custom-')+Date.now(),modules=['organization','employees','attendance','scheduling','approvals','payroll','permissions','settings'];
  const role=template==='supervisor'?{name,en:'Custom Department Supervisor',description:'自訂主管身份・依人員與部門設定管理範圍',baseType:'supervisor',protected:false,scope:'managed',departments:[],memberDepartments:{},includeChildren:true,includeActing:true,includeSupport:false,members:[],permissions:{organization:'view',employees:'edit',attendance:'edit',scheduling:'manage',approvals:'manage',payroll:'view',permissions:'hidden',settings:'hidden'},sensitive:{salaryView:true,salaryEdit:false,salaryExport:false,bankMasked:false,bankFull:false,identity:false,address:false,insurance:false,medical:true,audit:false}}:{name,en:'Custom Role',description:'由最高權限自訂可查看的資料與功能',protected:false,scope:'self',members:[],permissions:Object.fromEntries(modules.map(item=>[item,'hidden'])),sensitive:{salaryView:false,salaryEdit:false,salaryExport:false,bankMasked:false,bankFull:false,identity:false,address:false,insurance:false,medical:false,audit:false}};
  data[id]=role;delete data.supervisor;save(data);sessionStorage.setItem(uiKey,JSON.stringify({role:id,tab:'scope'}));if(typeof addAudit==='function')addAudit('新增身份群組',name+'・'+id);closeModal();location.hash='permissions';window.dispatchEvent(new HashChangeEvent('hashchange'));toast('已建立「'+name+'」，請繼續設定權限')
 }
 document.addEventListener('change',event=>{if(!event.target.matches('[data-member]'))return;const select=document.querySelector('[data-member-department="'+event.target.dataset.member+'"]');if(select)select.disabled=!event.target.checked});
 document.addEventListener('click',event=>{const button=event.target.closest('[data-delete-identity]');if(!button)return;event.preventDefault();if(currentRole()!=='executive'){toast('只有最高權限可以刪除身份群組');return}const data=read(),id=button.dataset.deleteIdentity,role=data[id];if(!role||role.protected){toast('此身份為系統受保護身份，無法刪除');return}const people=window.BOMBHR_IMPORTED_PERSONNEL||[],assigned=(role.members||[]).map(employeeId=>people.find(person=>person.employeeId===employeeId)||{name:'未知人員',employeeId});if(assigned.length){openModal('無法刪除身份群組','此身份仍有已指派人員，請先到「人員指派／人員與部門」取消指派',`<div class="permission-locked"><b>尚有 ${assigned.length} 位人員</b><span>${assigned.map(person=>person.name+'・'+person.employeeId).join('、')}</span></div>`,`<button class="primary-btn" data-modal-close>我知道了</button>`);return}openModal('確認刪除身份群組','刪除後無法復原，既有稽核紀錄仍會保留',`<div class="danger-confirm"><b>${role.name}</b><span>目前未指派任何人員，可以安全刪除。</span></div>`,`<button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" data-confirm-delete-identity="${id}">確認刪除</button>`)},true);
 document.addEventListener('click',event=>{const button=event.target.closest('[data-confirm-delete-identity]');if(!button)return;event.preventDefault();if(currentRole()!=='executive'){toast('只有最高權限可以刪除身份群組');return}const data=read(),id=button.dataset.confirmDeleteIdentity,role=data[id];if(!role||role.protected)return;delete data[id];save(data);const removed=JSON.parse(localStorage.getItem('bombhr-deleted-role-ids')||'[]');if(!removed.includes(id))removed.push(id);localStorage.setItem('bombhr-deleted-role-ids',JSON.stringify(removed));if(typeof addAudit==='function')addAudit('刪除身份群組',`${role.name}・${id}・未指派人員`);sessionStorage.setItem(uiKey,JSON.stringify({role:'owner',tab:'scope'}));closeModal();location.hash='permissions';window.dispatchEvent(new HashChangeEvent('hashchange'));toast('身份群組已刪除並留下稽核紀錄')},true);
 document.addEventListener('click',event=>{const button=event.target.closest('[data-v160-save]');if(!button)return;event.preventDefault();const ui=JSON.parse(sessionStorage.getItem(uiKey)||'{}'),data=read(),role=data[ui.role];if(!role)return;const checked=[...document.querySelectorAll('[data-member]:checked')];role.members=checked.map(item=>item.dataset.member);role.memberDepartments={};checked.forEach(item=>{const select=document.querySelector('[data-member-department="'+item.dataset.member+'"]');role.memberDepartments[item.dataset.member]=select?[select.value]:[]});save(data);if(typeof addAudit==='function')addAudit('調整主管人員與部門',role.name+'・'+role.members.length+' 位');toast('人員與部門已同步至後台帳號及所有可查看的資料');setTimeout(()=>location.reload(),350)},true);
 new MutationObserver(()=>setTimeout(enhance,0)).observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',()=>setTimeout(enhance,0));setTimeout(enhance,0);
})();

/* ===== v160-authoritative-scope.js ===== */
(function(){
 'use strict';
 const ROLE_KEY='bombhr-role-designer-v147';
 const ROUTES=['dashboard','organization','employees','attendance','scheduling','approvals','payroll','announcements','permissions','settings'];
 const DEFAULT={AB00002:['企劃'],AB00003:['企劃'],AB00006:['技術']};
 const aliases={'企劃':'企劃','營運企劃部':'企劃','營運－企劃部':'企劃','技術':'技術','資訊技術部':'技術','營運－技術部':'技術','產品設計部':'技術','財務/人事':'財務/人事','財務人事行政部':'財務/人事','財務人事行政':'財務/人事'};
 const normalize=value=>aliases[String(value||'').trim()]||String(value||'').trim();
 const read=(key,fallback={})=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(e){return fallback}};
 function supervisorRoles(){
  const roles=read(ROLE_KEY,{}),result=[];
  Object.entries(roles).forEach(([id,role])=>{if(id!=='supervisor'&&(role.baseType==='supervisor'||role.scope==='managed'))result.push(role)});
  if(!result.length&&roles.supervisor)result.push(roles.supervisor);
  if(!result.length)result.push({members:['AB00002','AB00003','AB00006'],memberDepartments:DEFAULT});
  return result;
 }
 function assignment(employeeId){
  for(const role of supervisorRoles())if((role.members||[]).includes(employeeId))return (role.memberDepartments||{})[employeeId]||role.departments||[];
  return [];
 }
 function people(){
  const overrides=read('bombhr-employee-org-overrides',{}),custom=typeof getCustomEmployees==='function'?getCustomEmployees():[];
  return [...(window.BOMBHR_IMPORTED_PERSONNEL||[]),...custom].map(person=>({...person,...(overrides[person.employeeId]||{})}));
 }
 function rebuildProfiles(){
  if(typeof roleProfiles==='undefined')return;
  Object.keys(roleProfiles).forEach(key=>{if(roleProfiles[key].role==='supervisor')delete roleProfiles[key]});
  const ids=[...new Set(supervisorRoles().flatMap(role=>role.members||[]))];
  ids.forEach(id=>{const person=people().find(item=>item.employeeId===id),departments=assignment(id).map(normalize).filter(Boolean);if(!person||!departments.length)return;const key=id==='AB00002'?'supervisor_ken':id==='AB00003'?'supervisor_ru':id==='AB00006'?'supervisor_rou':'supervisor_'+id.toLowerCase();roleProfiles[key]={role:'supervisor',label:'部門主管',name:person.name,id,department:departments[0],departments,routes:[...ROUTES],payrollEdit:false}});
 }
 rebuildProfiles();
 function permitted(person){const profile=currentProfile();if(profile.role!=='supervisor')return true;return (profile.departments||[profile.department]).map(normalize).includes(normalize(person&&person.department))}
 window.bombhrCanAccessEmployee=id=>{const person=people().find(item=>item.employeeId===id);return !!person&&permitted(person)};
 window.bombhrAuthorizedPersonnel=()=>people().filter(permitted);
 function rowPerson(row){const button=row.querySelector('[data-view-employee],[data-edit-employee],[data-payroll-person-detail],[data-payroll-adjust]'),id=button&&(button.dataset.viewEmployee||button.dataset.editEmployee||button.dataset.payrollPersonDetail||button.dataset.payrollAdjust);return people().find(person=>person.employeeId===id||row.textContent.includes(person.employeeId)||row.textContent.includes(person.name))}
 function enforce(){const profile=currentProfile(),route=location.hash.slice(1)||'dashboard';if(profile.role!=='supervisor'||!['organization','employees','attendance','scheduling','approvals','payroll'].includes(route))return;document.querySelectorAll('#content tbody tr').forEach(row=>{const person=rowPerson(row);if(person&&!permitted(person))row.remove()});if(route==='organization')document.querySelectorAll('.org-department-v147').forEach(group=>group.hidden=!(profile.departments||[profile.department]).map(normalize).includes(normalize(group.querySelector('summary b')?.textContent)));document.querySelectorAll('[data-payroll-adjust],[data-payroll-export],[data-payroll-lock],[data-bank-master]').forEach(button=>button.disabled=true)}
 document.addEventListener('click',event=>{const trigger=event.target.closest('[data-view-employee],[data-edit-employee],[data-payroll-person-detail],[data-payroll-adjust],[data-shared-approval]');if(!trigger||currentProfile().role!=='supervisor')return;let id=trigger.dataset.viewEmployee||trigger.dataset.editEmployee||trigger.dataset.payrollPersonDetail||trigger.dataset.payrollAdjust||'';if(!id&&trigger.dataset.sharedApproval){const item=getSharedEvents().find(entry=>entry.id===trigger.dataset.sharedApproval||entry.eventId===trigger.dataset.sharedApproval);id=item&&item.employeeId||''}if(id&&window.bombhrCanAccessEmployee(id))return;event.preventDefault();event.stopImmediatePropagation();const p=currentProfile(),detail=`${id||'未知員工'}・${p.name}・${p.id}・${p.label}・責任部門 ${p.department}・${new Date().toLocaleString('zh-TW',{hour12:false})}`;if(typeof addAudit==='function')addAudit('阻擋跨部門存取',detail);if(typeof closeModal==='function')closeModal();toast('權限不足：主管只能查看與處理責任部門員工資料')},true);
 let queued=false;const refresh=()=>{if(queued)return;queued=true;setTimeout(()=>{queued=false;enforce()},0)};
 window.addEventListener('hashchange',refresh);window.addEventListener('storage',event=>{if(event.key===ROLE_KEY)location.reload()});new MutationObserver(refresh).observe(document.getElementById('content'),{childList:true,subtree:true});refresh();
})();

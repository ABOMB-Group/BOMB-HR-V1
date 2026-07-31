/* ===== Consolidated from scheduling-import.js ===== */
(function(){
 const KEY='bombhr-schedules-v176',CODE_KEY='bombhr-schedule-codes-v182',CODE_ORDER_KEY='bombhr-schedule-code-order-v193',COMPANY_LAYOUT_KEY='bombhr-schedule-company-layout-v184';let pending=[],editMode=false,draft=null,editBaseline=null,selectedShift='09:00-18:00',selectedCode='1';
 const SCHEDULE_RESET_KEY='bombhr-schedule-full-reset-v2060';
 if(!localStorage.getItem(SCHEDULE_RESET_KEY)){
  localStorage.setItem(KEY,'[]');
  localStorage.setItem('bombhr-schedule-participants-v195','{}');
  localStorage.setItem('bombhr-schedule-preferences-v188','[]');
  localStorage.setItem('bombhr-employee-leave-ledger-v175','{}');
  try{
   const events=JSON.parse(localStorage.getItem('bombhr-demo-events')||'[]');
   localStorage.setItem('bombhr-demo-events',JSON.stringify(events.filter(event=>event?.subtype!=='leave')));
  }catch(e){localStorage.setItem('bombhr-demo-events','[]')}
  try{
   const payroll=JSON.parse(localStorage.getItem('bombhr-payroll-adjustments-v123')||'{}');
   Object.keys(payroll).forEach(employeeId=>payroll[employeeId]=Array.isArray(payroll[employeeId])?payroll[employeeId].filter(item=>!String(item?.eventId||'').startsWith('LEAVE-')):[]);
   localStorage.setItem('bombhr-payroll-adjustments-v123',JSON.stringify(payroll));
  }catch(e){}
  localStorage.setItem(SCHEDULE_RESET_KEY,new Date().toISOString());
 }
 const HOLIDAYS={
  '2025-12-25':'行憲紀念日',
  '2026-01-01':'元旦','2026-02-16':'除夕','2026-02-17':'春節','2026-02-18':'春節','2026-02-19':'春節','2026-02-20':'春節補假','2026-02-27':'和平紀念日補假','2026-02-28':'和平紀念日','2026-04-03':'兒童節補假','2026-04-04':'兒童節','2026-04-05':'清明節','2026-04-06':'清明節補假','2026-05-01':'勞動節','2026-06-19':'端午節','2026-09-25':'中秋節','2026-09-28':'教師節','2026-10-09':'國慶日補假','2026-10-10':'國慶日','2026-10-25':'臺灣光復節','2026-10-26':'臺灣光復節補假','2026-12-25':'行憲紀念日',
  '2027-01-01':'元旦','2027-02-05':'除夕','2027-02-06':'春節','2027-02-07':'春節','2027-02-08':'春節','2027-02-09':'春節補假','2027-02-10':'春節補假','2027-02-28':'和平紀念日','2027-03-01':'和平紀念日補假','2027-04-04':'兒童節','2027-04-05':'清明節','2027-04-06':'兒童節補假','2027-04-30':'勞動節補假','2027-05-01':'勞動節','2027-06-09':'端午節','2027-09-15':'中秋節','2027-09-28':'教師節','2027-10-10':'國慶日','2027-10-11':'國慶日補假','2027-10-25':'臺灣光復節','2027-12-24':'行憲紀念日補假','2027-12-25':'行憲紀念日','2027-12-31':'次年元旦補假'
 };
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return []}};
 const save=v=>localStorage.setItem(KEY,JSON.stringify(v));
 const refreshView=()=>{const pageY=window.scrollY,scroll=document.querySelector('.calendar-scroll'),left=scroll?.scrollLeft||0,top=scroll?.scrollTop||0;window.dispatchEvent(new HashChangeEvent('hashchange'));requestAnimationFrame(()=>requestAnimationFrame(()=>{window.scrollTo({top:pageY,left:0,behavior:'auto'});const next=document.querySelector('.calendar-scroll');if(next){next.scrollLeft=left;next.scrollTop=top}}))};
 const visibleRows=()=>editMode&&draft?draft:read();
 const role=()=>typeof currentRole==='function'?currentRole():'';
 const canEdit=()=>['executive','hradmin','supervisor'].includes(role());
 const isHistorical=()=>scheduleCursor<new Date(scheduleToday.getFullYear(),scheduleToday.getMonth(),1);
 const canEditHistory=()=>['executive','hradmin','supervisor'].includes(role());
 const canEditMonth=()=>canEdit()&&(!isHistorical()||canEditHistory());
 const defaultCodes=()=>[{code:'1',name:'上班'},{code:'休',name:'休假'},{code:'年',name:'年假'},{code:'旅',name:'旅遊假'},{code:'喪',name:'喪假'},{code:'婚',name:'婚假'},{code:'病',name:'病假'}];
 const scheduleCodes=()=>{try{const custom=JSON.parse(localStorage.getItem(CODE_KEY)||'[]'),merged=[...defaultCodes(),...custom].filter((x,i,a)=>x?.code&&a.findIndex(y=>y.code===x.code)===i),order=JSON.parse(localStorage.getItem(CODE_ORDER_KEY)||'[]');return merged.sort((a,b)=>{const ai=order.indexOf(a.code),bi=order.indexOf(b.code);return (ai<0?999:ai)-(bi<0?999:bi)})}catch(e){return defaultCodes()}};
 const codeOptions=()=>scheduleCodes().map(x=>`<option value="${esc(x.code)}" ${selectedCode===x.code?'selected':''}>${esc(x.code)}｜${esc(x.name)}</option>`).join('');
 const defaultLayout=()=>({order:['code','add','shift','cancel','save'],compactCodes:true,weekendBands:false,showLegend:true,showImportNote:true,showWeek:true,showStaff:true});
 const userLayoutKey=()=>`bombhr-schedule-user-layout-v184-${currentProfile().id||'unknown'}-${role()||'role'}`;
 const readLayout=key=>{try{return {...defaultLayout(),...JSON.parse(localStorage.getItem(key)||'{}')}}catch(e){return defaultLayout()}};
 const companyLayout=()=>readLayout(COMPANY_LAYOUT_KEY);
 const scheduleLayout=()=>{const company=companyLayout();try{return {...company,...JSON.parse(localStorage.getItem(userLayoutKey())||'{}')}}catch(e){return company}};
 const saveLayout=(key,value)=>localStorage.setItem(key,JSON.stringify({...defaultLayout(),...value}));
 const holidayName=date=>HOLIDAYS[date]||'';
 const monthlyRestQuota=(year,month)=>{const days=new Date(year,month,0).getDate(),off=new Set();for(let day=1;day<=days;day++){const date=new Date(year,month-1,day),key=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;if(date.getDay()===0||date.getDay()===6||holidayName(key))off.add(day)}return off.size};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const month=d=>String(d||'').slice(0,7);
 function leaveFor(row){return approvedLeaveEvents().find(e=>e.employeeId===row.employeeId&&(Array.isArray(e.dates)&&e.dates.length?e.dates.includes(row.date):String(e.period||'').split('–')[0]<=row.date&&String(e.period||'').split('–')[1]>=row.date))}
 function editControls(){const controls={code:`<label data-layout-item="code">排班代號<select id="scheduleQuickCode">${codeOptions()}</select></label>`,add:'<button class="secondary-btn" data-layout-item="add" data-schedule-code-manage>＋ 新增代號</button>',shift:`<label data-layout-item="shift" class="${selectedCode==='1'?'':'shift-disabled'}">上班班別<select id="scheduleQuickShift" ${selectedCode==='1'?'':'disabled'}><option value="09:00-18:00" ${selectedShift==='09:00-18:00'?'selected':''}>日班 09:00–18:00</option><option value="08:30-17:30" ${selectedShift==='08:30-17:30'?'selected':''}>早班 08:30–17:30</option><option value="13:00-22:00" ${selectedShift==='13:00-22:00'?'selected':''}>晚班 13:00–22:00</option><option value="19:00-07:00" ${selectedShift==='19:00-07:00'?'selected':''}>夜班 19:00–07:00</option></select></label>`,cancel:'<button class="secondary-btn" data-layout-item="cancel" data-schedule-edit-cancel>取消</button>',save:'<button class="primary-btn" data-layout-item="save" data-schedule-edit-save>儲存修改</button>'};return scheduleLayout().order.map(x=>controls[x]||'').join('')}
 function editToolbar(){if(!canEdit())return '<div class="schedule-view-only"><b>唯讀模式</b><span>目前身份沒有排班修改權限</span></div>';if(!canEditMonth())return '<div class="schedule-view-only"><b>歷史班表唯讀</b><span>歷史班表可由最高權限、財務人事行政或授權部門主管修正</span></div>';return `<div class="schedule-edit-toolbar ${editMode?'editing':''}"><div><b>${editMode?'正在修改班表':'班表快速修改'}</b><small>${editMode?'選擇排班代號後點日期格；完成後按儲存':isHistorical()?'歷史修正將記錄實際操作人、身份、責任部門與時間':'依目前身份權限，可直接在月班表修改'}</small></div>${editMode?editControls():'<button class="primary-btn" data-schedule-edit-start>直接修改班表</button>'}</div>`}
 const baseSchedulingView=schedulingView;schedulingView=function(){const layout=scheduleLayout();let view=baseSchedulingView();if(isHistorical()&&canEditHistory())view=view.replace('歷史班表為唯讀模式；所有原始班別與異動紀錄永久保留。','歷史班表修正模式：最高權限、財務人事行政與授權部門主管可修改；所有異動永久保留稽核紀錄。').replace('歷史唯讀・ABOMB','可稽核修正・ABOMB');if(!layout.showWeek)view=view.replace('<button data-schedule-view="week"','<button hidden data-schedule-view="week"');if(!layout.showStaff)view=view.replace('<button data-schedule-view="staff"','<button hidden data-schedule-view="staff"');const importNote=layout.showImportNote?'<div class="schedule-import-note"><b>排班匯入流程</b><small>下載橫向每月班表 → 每位員工一列填寫 1～31 日 → 上傳預覽 → 確認後才套用。核准請假若撞班，會自動顯示「排班衝突／需補人」。</small></div>':'';return view.replace('<button class="secondary-btn" data-copy-month','<a class="secondary-btn" href="assets/BOMB-HR-每月班表範例.xlsx" download>下載每月班表範例</a><button class="secondary-btn" data-schedule-import>上傳排班表</button><button class="secondary-btn" data-copy-month').replace('<div class="schedule-toolbar">',importNote+editToolbar()+'<div class="schedule-toolbar">')};
 function roster(){const imported=window.BOMBHR_IMPORTED_PERSONNEL||[],rows=visibleRows().filter(x=>month(x.date)===monthKey(scheduleCursor)),extra=rows.filter(x=>!imported.some(p=>p.employeeId===x.employeeId)).map(x=>({employeeId:x.employeeId,name:x.employeeName,department:x.department||'未分類',position:''}));return [...imported,...extra].filter((person,index,list)=>list.findIndex(item=>item.employeeId===person.employeeId)===index).filter(person=>typeof window.bombhrCanAccessEmployee!=='function'||window.bombhrCanAccessEmployee(person.employeeId)).filter(person=>window.BOMBHR_SCHEDULE_PARTICIPATION?.isIncluded(person,monthKey(scheduleCursor))!==false)}
 function leaveOn(employeeId,date){return approvedLeaveEvents().find(e=>e.employeeId===employeeId&&(Array.isArray(e.dates)&&e.dates.length?e.dates.includes(date):String(e.period||'').split('–')[0]<=date&&String(e.period||'').split('–')[1]>=date))}
 function shortLeave(e){const type=e?.leaveType||String(e?.title||'假').replace(/申請$/,'');return type.includes('年假')?'年':type.includes('旅遊')?'旅':type.includes('喪')?'喪':type.includes('病')?'病':type.includes('事')?'事':type.includes('婚')?'婚':'假'}
 scheduleCalendarDays=function(){const y=scheduleCursor.getFullYear(),m=scheduleCursor.getMonth()+1,days=new Date(y,m,0).getDate(),monthValue=`${y}-${String(m).padStart(2,'0')}`,rows=visibleRows().filter(x=>month(x.date)===monthValue&&(typeof window.bombhrCanAccessEmployee!=='function'||window.bombhrCanAccessEmployee(x.employeeId))),people=roster(),dateKey=d=>`${monthValue}-${String(d).padStart(2,'0')}`,header=Array.from({length:days},(_,i)=>{const d=i+1,key=dateKey(d),date=new Date(y,m-1,d),week=new Intl.DateTimeFormat('zh-TW',{weekday:'short'}).format(date),dayType=date.getDay()===6?'saturday':date.getDay()===0?'sunday':'',holiday=holidayName(key),today=date.toDateString()===scheduleToday.toDateString();return `<div class="schedule-date-cell ${dayType} ${holiday?'holiday':''} ${today?'today':''}" title="${esc(holiday||week)}"><b>${d}</b><small>${week}</small>${holiday?`<em>${esc(holiday)}</em>`:''}</div>`}).join(''),body=people.map(p=>{const own=rows.filter(x=>x.employeeId===p.employeeId),sample=own.find(x=>(x.code||'1')==='1'),shift=sample&&sample.start&&sample.end?`${sample.start}–${sample.end}`:'';return `<div class="schedule-month-row"><button type="button" class="schedule-person-cell schedule-person-button ${canEditMonth()?'quick-leave-enabled':''}" data-schedule-person data-employee-id="${esc(p.employeeId)}" data-employee-name="${esc(p.name)}" data-employee-department="${esc(p.department||'')}"><b>${esc(p.name)}</b><small>${esc(p.employeeId)}・${esc(p.department||'—')}／${esc(p.position||'—')}</small><em class="${shift?'':'schedule-shift-empty'}">${shift}</em></button>${Array.from({length:days},(_,i)=>{const d=i+1,key=dateKey(d),item=own.find(x=>x.date===key),leave=leaveOn(p.employeeId,key),date=new Date(y,m-1,d),dayType=date.getDay()===6?'saturday':date.getDay()===0?'sunday':'',holiday=holidayName(key),code=item?.code??window.BOMBHR_SCHEDULE_PARTICIPATION?.defaultCode?.(p,key,holiday)??'',manualLeave=Boolean(code)&&code!=='1',isWork=code==='1',state=leave?(item&&isWork?'conflict':'leave'):(manualLeave?'leave':isWork?'work':'empty'),label=leave?(item&&isWork?`⚠${shortLeave(leave)}`:shortLeave(leave)):(manualLeave?code:isWork?'1':''),title=leave?(item&&isWork?`${leave.leaveType||leave.title}已核准，與排班衝突／需補人`:`${leave.leaveType||leave.title}已核准`):(manualLeave?(scheduleCodes().find(x=>x.code===code)?.name||code):isWork?(item?.start&&item?.end?`${item.start}–${item.end}`:'預設上班・尚未設定班別'):holiday||'未排班');return `<button class="schedule-matrix-cell ${state} ${dayType} ${holiday?'holiday':''} ${editMode&&canEditMonth()?'editable':''}" data-schedule-cell data-employee-id="${esc(p.employeeId)}" data-employee-name="${esc(p.name)}" data-date="${key}" data-start="${esc(item?.start||'')}" data-end="${esc(item?.end||'')}" title="${esc(title)}">${esc(label)}</button>`}).join('')}</div>`}).join(''),totals=Array.from({length:days},(_,i)=>{const key=dateKey(i+1),count=people.filter(p=>{const row=rows.find(x=>x.date===key&&x.employeeId===p.employeeId);return row?(row.code||'1')==='1':window.BOMBHR_SCHEDULE_PARTICIPATION?.defaultCode?.(p,key,holidayName(key))==='1'}).length,conflicts=rows.filter(x=>x.date===key&&(x.code||'1')==='1'&&leaveOn(x.employeeId,key)).length;return `<div class="schedule-total-cell ${conflicts?'has-conflict':''}"><b>${count}</b>${conflicts?`<small>${conflicts} 缺口</small>`:''}</div>`}).join('');return `<div class="schedule-legend" ${scheduleLayout().showLegend?'':'hidden'}><span><i class="sat"></i>週六</span><span><i class="sun"></i>週日</span><span><i class="holiday"></i>國定假日</span><span><i class="leave"></i>核准請假</span><span><i class="conflict"></i>排班衝突</span></div><div class="schedule-month-matrix ${scheduleLayout().compactCodes?'compact-codes':''} ${scheduleLayout().weekendBands?'weekend-bands':''}" style="--days:${days}"><div class="schedule-month-row header"><div class="schedule-person-cell"><b>${y} 年 ${m} 月</b><small>員工／部門／班別</small></div>${header}</div>${body}<div class="schedule-month-row totals"><div class="schedule-person-cell"><b>每日上班人力</b><small>紅色數字代表請假撞班缺口</small></div>${totals}</div></div>`};
 weekSchedule=function(){const rows=read().filter(x=>month(x.date)===monthKey(scheduleCursor)&&(typeof window.bombhrCanAccessEmployee!=='function'||window.bombhrCanAccessEmployee(x.employeeId)));if(!rows.length)return '<div class="empty-state">目前權限部門本月尚未匯入排班。</div>';return `<div class="table-wrap"><table><thead><tr><th>日期</th><th>員工</th><th>班別</th><th>據點</th><th>狀態</th></tr></thead><tbody>${rows.sort((a,b)=>a.date.localeCompare(b.date)).map(x=>{const leave=leaveFor(x);return `<tr><td>${x.date}</td><td>${esc(x.employeeName)}<small class="table-subline">${esc(x.employeeId)}</small></td><td>${(x.code||'1')==='1'?`${esc(x.start)}–${esc(x.end)}`:esc(scheduleCodes().find(c=>c.code===x.code)?.name||x.code)}</td><td>${esc(x.site||'—')}</td><td>${(x.code||'1')!=='1'?badge('休假／未排班'):leave?badge('排班衝突／需補人'):badge('已排班')}</td></tr>`}).join('')}</tbody></table></div>`};
 staffSchedule=function(){const rows=read().filter(x=>month(x.date)===monthKey(scheduleCursor)&&(typeof window.bombhrCanAccessEmployee!=='function'||window.bombhrCanAccessEmployee(x.employeeId))),people=[...new Map(rows.map(x=>[x.employeeId,x])).values()];if(!people.length)return '<div class="empty-state">目前權限部門本月尚未匯入排班。</div>';return `<div class="table-wrap"><table><thead><tr><th>員工</th><th>本月班數</th><th>衝突班數</th><th>狀態</th></tr></thead><tbody>${people.map(p=>{const mine=rows.filter(x=>x.employeeId===p.employeeId&&(x.code||'1')==='1'),bad=mine.filter(leaveFor).length;return `<tr><td>${esc(p.employeeName)}<small class="table-subline">${esc(p.employeeId)}</small></td><td>${mine.length}</td><td>${bad}</td><td>${badge(bad?'需處理':'正常')}</td></tr>`}).join('')}</tbody></table></div>`};
 function parseRows(rows){const headerIndex=rows.findIndex(r=>String(r?.[0]||'').trim()==='日期');if(headerIndex<0)throw Error('找不到「日期」標題列，請使用系統下載的 Excel 範例');const head=rows[headerIndex].map(x=>String(x??'').trim()),need=['日期','員工編號','員工姓名','班別開始','班別結束'],idx=Object.fromEntries(head.map((x,i)=>[x,i]));need.forEach(x=>{if(idx[x]===undefined)throw Error(`缺少欄位：${x}`)});return rows.slice(headerIndex+1).filter(r=>r.some(x=>String(x??'').trim())).map((c,i)=>{const row={date:String(c[idx['日期']]??'').trim(),employeeId:String(c[idx['員工編號']]??'').trim(),employeeName:String(c[idx['員工姓名']]??'').trim(),start:String(c[idx['班別開始']]??'').trim(),end:String(c[idx['班別結束']]??'').trim(),site:String(c[idx['據點']]??'').trim(),note:String(c[idx['備註']]??'').trim()};if(!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||!row.employeeId||!row.employeeName||!/^\d{2}:\d{2}$/.test(row.start)||!/^\d{2}:\d{2}$/.test(row.end))throw Error(`資料第 ${i+1} 列格式不正確`);return row})}
 function parseCSV(text){const split=line=>{const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&line[i+1]==='"'){cur+='"';i++}else if(c==='"')q=!q;else if(c===','&&!q){out.push(cur.trim());cur=''}else cur+=c}out.push(cur.trim());return out};return parseRows(text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.trim()).map(split))}
 function parseMatrixRows(rows){const header=rows.findIndex(r=>r.some(x=>String(x??'').trim()==='員工編號')&&r.some(x=>String(x??'').trim()==='員工姓名'));if(header<0)return null;const labels=rows[header].map(x=>String(x??'').trim()),idCol=labels.indexOf('員工編號'),nameCol=labels.indexOf('員工姓名'),shiftCol=labels.indexOf('班別時段'),departmentCol=labels.indexOf('部門／職位');const monthRow=rows.find(r=>String(r?.[0]||'').trim()==='排班月份'),monthText=String(monthRow?.[1]||'').trim().replace('/','-');if(!/^\d{4}-\d{2}$/.test(monthText))throw Error('排班月份格式不正確，請使用 yyyy-mm');const dayRow=rows.slice(0,header).reverse().find(r=>r.filter(x=>/^([1-9]|[12]\d|3[01])$/.test(String(x).trim())).length>=28);if(!dayRow)throw Error('找不到 1～31 日的日期欄');const [year,mon]=monthText.split('-').map(Number),maxDay=new Date(year,mon,0).getDate(),dayCols=dayRow.map((x,i)=>({day:Number(x),i})).filter(x=>x.day>=1&&x.day<=maxDay),result=[];for(let r=header+1;r<rows.length;r++){const line=rows[r],first=String(line?.[0]||'').trim();if(first==='每日上班人力'||first.includes('上班人力'))break;const employeeId=String(line?.[idCol]||'').trim(),employeeName=String(line?.[nameCol]||'').trim();if(!employeeId&&!employeeName)continue;if(!employeeId||!employeeName)throw Error(`員工資料第 ${r-header} 列缺少員編或姓名`);const shift=String(line?.[shiftCol]||'').trim(),times=shift.match(/(\d{1,2}:\d{2})\s*[-–~]\s*(\d{1,2}:\d{2})/);if(!times)throw Error(`${employeeName} 的班別時段格式不正確，請使用 09:00-18:00`);for(const d of dayCols){const code=String(line?.[d.i]??'').trim();if(!code)continue;const normalizedCode=['1','班','早','晚'].includes(code)?'1':code;result.push({code:normalizedCode,date:`${year}-${String(mon).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`,employeeId,employeeName,start:normalizedCode==='1'?times[1].padStart(5,'0'):'',end:normalizedCode==='1'?times[2].padStart(5,'0'):'',site:'台中總公司',note:String(line?.[labels.indexOf('備註')]||'').trim(),department:String(line?.[departmentCol]||'').trim()})}}if(!result.length)throw Error('班表中沒有找到可匯入的排班代號');return result}
 async function parseFile(file){if(/\.csv$/i.test(file.name))return parseCSV(await file.text());if(!window.XLSX)throw Error('Excel 讀取元件未載入，請重新整理後再試');const workbook=XLSX.read(await file.arrayBuffer(),{type:'array'}),sheet=workbook.Sheets[workbook.SheetNames[0]],rows=XLSX.utils.sheet_to_json(sheet,{header:1,raw:false,defval:''});return parseMatrixRows(rows)||parseRows(rows)}
 function preview(){const conflicts=pending.filter(leaveFor).length;$('#scheduleImportPreview').innerHTML=`<div class="import-summary"><span>${pending.length} 筆排班</span><span>${new Set(pending.map(x=>x.employeeId)).size} 位員工</span><span>${conflicts} 筆請假衝突</span></div><div class="table-wrap import-preview"><table><thead><tr><th>日期</th><th>員工</th><th>班別</th><th>檢查</th></tr></thead><tbody>${pending.map(x=>`<tr><td>${x.date}</td><td>${esc(x.employeeName)}・${esc(x.employeeId)}</td><td>${esc(x.start)}–${esc(x.end)}</td><td>${leaveFor(x)?'<span class="schedule-conflict">與已核准請假衝突</span>':'可套用'}</td></tr>`).join('')}</tbody></table></div>`;$('#confirmScheduleImport').disabled=false}
 function importModal(){pending=[];openModal('上傳排班表','支援 Excel（.xlsx）及 UTF-8 CSV；確認前不會修改目前班表',`<label class="form-field">選擇排班表<input id="scheduleFile" type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" class="form-control"></label><p id="scheduleImportError" class="form-error"></p><div id="scheduleImportPreview" class="empty-state">請先選擇依範例格式填寫的 Excel 表格</div>`,`<button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="confirmScheduleImport" disabled>確認並套用</button>`);$('#scheduleFile').onchange=async e=>{try{pending=await parseFile(e.target.files[0]);preview()}catch(err){pending=[];$('#scheduleImportError').textContent=err.message;$('#confirmScheduleImport').disabled=true}};$('#confirmScheduleImport').onclick=()=>{const incomingKeys=new Set(pending.map(x=>x.employeeId+'|'+x.date)),kept=read().filter(x=>!incomingKeys.has(x.employeeId+'|'+x.date));save([...kept,...pending]);closeModal();toast(`已套用 ${pending.length} 筆排班；請假衝突已自動標記`);window.dispatchEvent(new HashChangeEvent('hashchange'))}}
 const leaveCode=r=>({annual:'年',travel:'旅',marriage:'婚',sick:'病',personal:'事',bereavement:'喪'}[r.id]||String(r.name||'假').slice(0,1));
 const isoDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 function datesBetween(start,end,skipWeekends){const out=[],cursor=new Date(`${start}T12:00:00`),last=new Date(`${end}T12:00:00`);while(cursor<=last){if(!skipWeekends||![0,6].includes(cursor.getDay()))out.push(isoDate(cursor));cursor.setDate(cursor.getDate()+1)}return out}
 function quickLeaveModal(button){if(!canEditMonth())return;const ledger=window.BOMBHR_HR_LEDGER;if(!ledger){toast('假勤額度模組尚未載入，請重新整理後再試');return}const employeeId=button.dataset.employeeId,employeeName=button.dataset.employeeName,department=button.dataset.employeeDepartment||'—',rules=ledger.rules().filter(x=>x.enabled!==false),monthValue=monthKey(scheduleCursor),todayValue=monthKey(scheduleToday)===monthValue?isoDate(scheduleToday):`${monthValue}-01`;openModal('快速建立休假並套用班表',`${employeeName}・${employeeId}・${department}`,`<div class="quick-leave-balance">${ledger.summary(employeeId).map(x=>`<span><b>${esc(leaveCode(x.rule))}</b>${esc(x.rule.name)}<strong>${x.remaining} 天</strong></span>`).join('')}</div><div class="form-grid quick-leave-form"><label class="form-field">假別<select id="quickLeaveType" class="form-control">${rules.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}（剩餘 ${ledger.remaining(employeeId,x.name)} 天）</option>`).join('')}</select></label><label class="form-field">使用方式<select id="quickLeavePortion" class="form-control"><option value="full">整天</option><option value="half">半天</option><option value="hours">時數</option></select></label><label class="form-field">開始日期<input id="quickLeaveStart" class="form-control" type="date" value="${todayValue}"></label><label class="form-field">結束日期<input id="quickLeaveEnd" class="form-control" type="date" value="${todayValue}"></label><label class="form-field" id="quickLeaveHoursField" hidden>請假時數<input id="quickLeaveHours" class="form-control" type="number" min="1" max="8" step="0.5" value="1"></label><label class="form-field" id="quickLeaveEntitlementField">資格日／結婚登記日<input id="quickLeaveEntitlement" class="form-control" type="date"><small>婚假必填；其他有使用期限的假別可填</small></label><label class="form-field full quick-leave-check"><span><input id="quickLeaveSkipWeekend" type="checkbox" checked> 自動略過週六、週日</span></label><label class="form-field full">備註<textarea id="quickLeaveReason" class="form-control" rows="2" placeholder="例：主管依員工申請協助排入班表"></textarea></label></div><div id="quickLeavePreview" class="quick-leave-preview"></div><p id="quickLeaveError" class="form-error"></p>`,`<button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="applyQuickLeave">建立請假並套用班表</button>`);const calculate=()=>{const start=$('#quickLeaveStart').value,end=$('#quickLeaveEnd').value,portion=$('#quickLeavePortion').value,hours=Number($('#quickLeaveHours').value||0),dates=start&&end&&end>=start?datesBetween(start,end,$('#quickLeaveSkipWeekend').checked):[],days=portion==='hours'?hours/8:dates.length*(portion==='half'?.5:1);$('#quickLeaveHoursField').hidden=portion!=='hours';if(portion==='hours'&&start&&end&&start!==end){$('#quickLeavePreview').innerHTML='<b>時數假一次只能選擇同一天</b>';return {dates,days,invalid:'時數假一次只能選擇同一天'}}const rule=rules.find(x=>x.id===$('#quickLeaveType').value),left=ledger.remaining(employeeId,rule?.name);$('#quickLeavePreview').innerHTML=`<span>將標記 <b>${dates.length}</b> 個日期</span><span>扣除 <b>${Number(days.toFixed(2))}</b> 天</span><span>目前剩餘 <b>${left}</b> 天</span>`;return {dates,days,rule,start,end}};['quickLeaveType','quickLeavePortion','quickLeaveStart','quickLeaveEnd','quickLeaveHours','quickLeaveSkipWeekend'].forEach(id=>$(`#${id}`).onchange=calculate);calculate();$('#applyQuickLeave').onclick=()=>{const result=calculate(),error=$('#quickLeaveError');error.textContent='';if(result.invalid){error.textContent=result.invalid;return}if(!result.start||!result.end||result.end<result.start||!result.dates.length||result.days<=0){error.textContent='請選擇有效日期與請假時間';return}const type=result.rule.name,entitlementDate=$('#quickLeaveEntitlement').value,eventId=`ADMIN-LEAVE-${Date.now()}`,event={id:eventId,eventId,category:'approval',subtype:'leave',title:`${type}申請`,employee:employeeName,employeeId,department,leaveType:type,period:`${result.start}–${result.end}`,duration:`${Number(result.days.toFixed(2))} 天`,leaveDays:Number(result.days.toFixed(2)),status:'approved',statusText:'已核准',source:'admin-schedule',reason:$('#quickLeaveReason').value.trim()||'由排班頁快速建立',entitlementDate,reviewer:currentProfile().name,reviewerId:currentProfile().id,reviewerRole:currentProfile().label||role(),reviewerDepartment:currentProfile().department||'—',reviewedAt:new Date().toISOString(),submitted:new Date().toLocaleString('zh-TW',{hour12:false})},check=ledger.validate(employeeId,type,event.leaveDays,result.start,entitlementDate);if(!check.ok){error.textContent=check.message;return}const approved=ledger.approve(event);if(!approved.ok){error.textContent=approved.message;return}const events=getSharedEvents();events.unshift(event);saveSharedEvents(events);const code=leaveCode(result.rule),existing=read().filter(x=>!(x.employeeId===employeeId&&result.dates.includes(x.date))),leaveRows=result.dates.map(date=>({date,employeeId,employeeName,department,start:'',end:'',code,site:'台中總公司',note:`${type}・排班快速建立・${eventId}`}));save([...existing,...leaveRows]);if(!scheduleCodes().some(x=>x.code===code)){const custom=JSON.parse(localStorage.getItem(CODE_KEY)||'[]');custom.push({code,name:type});localStorage.setItem(CODE_KEY,JSON.stringify(custom))}if(typeof addAudit==='function')addAudit('快速建立員工休假並套用班表',`${employeeName}・${employeeId}・${type} ${event.leaveDays} 天・${event.period}・${currentProfile().name} ${currentProfile().id}`);closeModal();toast(`${employeeName}的${type}已扣除額度並套用班表，剩餘 ${approved.remaining} 天`);window.dispatchEvent(new HashChangeEvent('hashchange'))}}
 function toggleCell(button){if(!canEditMonth()||!editMode||!draft)return;const id=button.dataset.employeeId,date=button.dataset.date,index=draft.findIndex(x=>x.employeeId===id&&x.date===date),leave=leaveOn(id,date);if(index>=0)draft.splice(index,1);const [start,end]=selectedShift.split('-');draft.push({date,employeeId:id,employeeName:button.dataset.employeeName,start:selectedCode==='1'?start:'',end:selectedCode==='1'?end:'',code:selectedCode,site:'台中總公司',note:selectedCode==='1'?'手動臨時調班':`手動排班代號：${selectedCode}`});toast(selectedCode==='休'?'已暫改為休':selectedCode==='1'&&leave?'已暫排班，但與核准請假衝突':`已暫套用「${selectedCode}」`);refreshView()}
 function manageCodes(){openModal('新增排班代號','新增後會立即出現在下拉選單；內建代號不會被覆蓋',`<div class="form-grid"><label class="form-field">代號（建議 1 個中文字）<input id="newScheduleCode" class="form-control" maxlength="4" placeholder="例：生"></label><label class="form-field">假別／狀態名稱<input id="newScheduleCodeName" class="form-control" maxlength="20" placeholder="例：生日假"></label></div><p class="form-hint">內建：1 上班、休、年、旅、喪、婚、病。您新增的代號會保存在此瀏覽器。</p><p id="scheduleCodeError" class="form-error"></p>`,`<button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="saveScheduleCode">新增代號</button>`);$('#saveScheduleCode').onclick=()=>{const code=$('#newScheduleCode').value.trim(),name=$('#newScheduleCodeName').value.trim();if(!code||!name){$('#scheduleCodeError').textContent='請輸入代號及名稱';return}if(scheduleCodes().some(x=>x.code===code)){$('#scheduleCodeError').textContent='此代號已存在';return}const custom=JSON.parse(localStorage.getItem(CODE_KEY)||'[]');custom.push({code,name});localStorage.setItem(CODE_KEY,JSON.stringify(custom));selectedCode=code;const returnToLayout=location.hash==='#settings'&&document.querySelector('[data-tab="schedule-layout"].active');closeModal();toast(`已新增排班代號：${code}｜${name}`);window.dispatchEvent(new HashChangeEvent('hashchange'));if(returnToLayout)setTimeout(openScheduleLayoutTab,0)}}
 function startEdit(){if(!canEditMonth())return;editMode=true;editBaseline=JSON.parse(JSON.stringify(read()));draft=JSON.parse(JSON.stringify(editBaseline));refreshView()}
 function cancelEdit(){editMode=false;draft=null;editBaseline=null;toast('已取消，班表未變更');refreshView()}
 function saveEdit(){if(!canEditMonth()||!draft)return;const profile=currentProfile(),targetMonth=monthKey(scheduleCursor),reasonRequired=targetMonth<=new Date().toISOString().slice(0,7),perform=reason=>{save(draft);const action=isHistorical()?'修正歷史月班表':'修改月班表',before=(editBaseline||[]).filter(row=>month(row.date)===targetMonth),after=draft.filter(row=>month(row.date)===targetMonth);if(typeof addAudit==='function')addAudit(action,`${profile.name}・${profile.id||'—'}・${profile.roleLabel||role()}・${profile.department||'—'}・${targetMonth}・修改前 ${before.length} 筆・修改後 ${after.length} 筆・原因 ${reason||'未公布班表正常調整'}・${new Date().toLocaleString('zh-TW')}`);editMode=false;draft=null;editBaseline=null;toast('班表修改已儲存並留下稽核紀錄');refreshView()};if(!reasonRequired){perform('');return}openModal(isHistorical()?'修正歷史班表':'確認當月班表異動',`${targetMonth}・${profile.name}・${profile.label||role()}・所有操作保留稽核紀錄`,`<label class="form-field">修改原因<textarea id="directScheduleReason" class="form-control" rows="4" placeholder="請說明調班、改假或補登原因"></textarea></label><div class="policy-note">部門主管只能修改授權管理的人員與部門；本次修改會記錄操作人、身份、部門、時間及修改前後筆數。</div><p id="directScheduleReasonError" class="form-error"></p>`,`<button class="secondary-btn" data-modal-close>返回班表</button><button class="primary-btn" id="confirmDirectScheduleSave">確認儲存</button>`);document.getElementById('confirmDirectScheduleSave').onclick=()=>{const reason=document.getElementById('directScheduleReason').value.trim();if(!reason){document.getElementById('directScheduleReasonError').textContent='請填寫修改原因';return}closeModal();perform(reason)}}
 const layoutLabels={code:'排班代號選擇器',add:'新增代號按鈕',shift:'班別時間選擇器',cancel:'取消修改按鈕',save:'儲存修改按鈕'};
 function layoutEditor(scope,data,locked=false){return `<section class="layout-setting-card" data-layout-editor="${scope}"><div class="layout-setting-head"><div><b>${scope==='company'?'公司共用操作列':'我的操作列偏好'}</b><small>${scope==='company'?'設定所有尚未自訂使用者的預設按鈕順序':'只調整目前帳號看到的按鈕順序，不影響其他人'}</small></div>${locked?'<span class="layout-lock">僅最高權限可修改</span>':''}</div><div class="layout-order-help"><b>班表工具列排列</b><span>${locked?'目前身份僅能查看公司共用順序。':'按住項目前方的拖曳把手，直接拉到想要的位置。'}</span></div><div class="layout-order-list">${data.order.map(key=>`<div class="layout-order-item ${locked?'is-locked':''}" data-layout-key="${key}" draggable="${locked?'false':'true'}"><i class="layout-drag-handle" title="${locked?'不可調整':'按住拖曳'}"><span>⋮</span><span>⋮</span></i><b>${layoutLabels[key]}</b></div>`).join('')}</div><div class="layout-option-grid">${[['compactCodes','使用小型排班代號','降低色塊與文字尺寸'],['weekendBands','顯示週末整欄底色','關閉時只標示日期表頭'],['showLegend','顯示假別圖例','可隱藏表格上方圖例'],['showImportNote','顯示排班匯入說明','熟悉操作後可隱藏'],['showWeek','顯示「週」檢視','控制班表頁的週檢視按鈕'],['showStaff','顯示「人員」檢視','控制班表頁的人員檢視按鈕']].map(x=>`<label><input type="checkbox" data-layout-option="${x[0]}" ${data[x[0]]?'checked':''} ${locked?'disabled':''}><span><b>${x[1]}</b><small>${x[2]}</small></span></label>`).join('')}</div><div class="layout-setting-actions">${scope==='company'?`<button class="primary-btn" data-save-company-layout ${locked?'disabled':''}>儲存公司共用順序</button>`:'<button class="secondary-btn" data-reset-user-layout>恢復公司預設</button><button class="primary-btn" data-save-user-layout>儲存我的偏好</button>'}</div></section>`}
 function scheduleCodeMasterView(){const custom=scheduleCodes().filter(x=>!defaultCodes().some(y=>y.code===x.code));return `<section class="schedule-code-page"><div class="schedule-code-page-head"><div><span>SCHEDULE CODES</span><h2>排班代號設定</h2><p>管理月班表可使用的上班、休假與自訂狀態代號。</p></div><button class="primary-btn" data-settings-add-code>＋ 新增排班代號</button></div><div class="schedule-code-master">${scheduleCodes().map(x=>`<div><strong>${esc(x.code)}</strong><span><b>${esc(x.name)}</b><small>${defaultCodes().some(y=>y.code===x.code)?'系統內建代號':'公司自訂代號'}</small></span>${custom.some(y=>y.code===x.code)?`<button data-delete-schedule-code="${esc(x.code)}">刪除</button>`:'<em>固定保留</em>'}</div>`).join('')}</div></section>`}
 function scheduleLayoutSettings(){return `<div class="layout-settings-intro"><div><b>版面與個人偏好</b><span>${esc(currentProfile().name)}・${esc(currentProfile().id)}・${esc(currentProfile().label||role())}</span></div><p>這裡只調整班表工具列順序與顯示方式；排班代號已移至「班表 → 排班代號設定」。</p></div>${layoutEditor('company',companyLayout(),role()!=='executive')}${layoutEditor('user',scheduleLayout())}`}
 function readLayoutEditor(scope){const root=$(`[data-layout-editor="${scope}"]`);return {...defaultLayout(),order:$$('[data-layout-key]',root).map(x=>x.dataset.layoutKey),...Object.fromEntries($$('[data-layout-option]',root).map(x=>[x.dataset.layoutOption,x.checked]))}}
 function openScheduleLayoutTab(){$$('.tabs button').forEach(x=>x.classList.toggle('active',x.dataset.tab==='schedule-layout'));$('#tabContent').innerHTML=scheduleLayoutSettings();bindLayoutSettings()}
 function bindLayoutSettings(){$$('[data-layout-editor]').forEach(editor=>{let dragging=null;$$('[data-layout-key]',editor).forEach(row=>{if(row.draggable!==true)return;row.ondragstart=event=>{dragging=row;row.classList.add('is-dragging');event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',row.dataset.layoutKey)};row.ondragover=event=>{event.preventDefault();if(!dragging||dragging===row)return;const rect=row.getBoundingClientRect(),after=event.clientX>rect.left+rect.width/2;row.parentNode.insertBefore(dragging,after?row.nextSibling:row)};row.ondrop=event=>event.preventDefault();row.ondragend=()=>{row.classList.remove('is-dragging');dragging=null}})});$('[data-save-company-layout]')?.addEventListener('click',()=>{if(role()!=='executive')return;saveLayout(COMPANY_LAYOUT_KEY,readLayoutEditor('company'));if(typeof addAudit==='function')addAudit('修改排班公司預設版面',`${currentProfile().name}・${currentProfile().id}`);toast('公司預設版面已儲存')});$('[data-save-user-layout]')?.addEventListener('click',()=>{saveLayout(userLayoutKey(),readLayoutEditor('user'));toast(`${currentProfile().name} 的個人排班版面已儲存`)});$('[data-reset-user-layout]')?.addEventListener('click',()=>{localStorage.removeItem(userLayoutKey());openScheduleLayoutTab();toast('已恢復公司預設版面')})}
 function bindCodeMaster(){$('[data-settings-add-code]')?.addEventListener('click',manageCodes);$$('[data-delete-schedule-code]').forEach(button=>button.onclick=()=>{const custom=JSON.parse(localStorage.getItem(CODE_KEY)||'[]').filter(x=>x.code!==button.dataset.deleteScheduleCode);localStorage.setItem(CODE_KEY,JSON.stringify(custom));window.dispatchEvent(new HashChangeEvent('hashchange'));toast('自訂排班代號已刪除')})}
 const priorBind=bindView;bindView=function(route){priorBind(route);if(route==='settings'||route==='tab')setTimeout(()=>{if($('[data-tab="schedule-layout"].active'))bindLayoutSettings()},0);if(route==='scheduling')setTimeout(()=>{$('[data-schedule-import]')?.addEventListener('click',importModal);$('[data-schedule-edit-start]')?.addEventListener('click',startEdit);$('[data-schedule-edit-cancel]')?.addEventListener('click',cancelEdit);$('[data-schedule-edit-save]')?.addEventListener('click',saveEdit);$('[data-schedule-code-manage]')?.addEventListener('click',manageCodes);$('#scheduleQuickCode')?.addEventListener('change',e=>{selectedCode=e.target.value;refreshView()});$('#scheduleQuickShift')?.addEventListener('change',e=>selectedShift=e.target.value);$$('[data-schedule-cell]').forEach(b=>b.onclick=()=>toggleCell(b));$$('[data-schedule-person]').forEach(b=>b.onclick=()=>quickLeaveModal(b))},0)};
 window.BOMBHR_SCHEDULING={read,parseCSV,parseRows,parseMatrixRows,parseFile,leaveFor,leaveOn,shortLeave,holidayName,monthlyRestQuota,canEdit,canEditHistory,canEditMonth,isHistorical,scheduleCodes,scheduleLayout,companyLayout,userLayoutKey,scheduleLayoutSettings,bindLayoutSettings,scheduleCodeMasterView,bindCodeMaster,datesBetween,leaveCode,quickLeaveModal};
 setTimeout(()=>{if(location.hash==='#scheduling')window.dispatchEvent(new HashChangeEvent('hashchange'))},0);
})();

/* ===== Consolidated from monthly-person-schedule-v187.js ===== */
(function(){
 'use strict';
 const SCHEDULE_KEY='bombhr-schedules-v176',EVENT_KEY='bombhr-demo-events';
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const isQuickRow=row=>row?.source==='quick-monthly'||/^快速排班|^整月快速輸入/.test(String(row?.note||''));
 const refreshBehind=()=>{const pageY=window.scrollY,scroll=document.querySelector('.calendar-scroll'),left=scroll?.scrollLeft||0,top=scroll?.scrollTop||0;window.dispatchEvent(new HashChangeEvent('hashchange'));requestAnimationFrame(()=>requestAnimationFrame(()=>{window.scrollTo({top:pageY,left:0,behavior:'auto'});const next=document.querySelector('.calendar-scroll');if(next){next.scrollLeft=left;next.scrollTop=top}}))};
 const iso=(year,month,day)=>`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(e){return fallback}};
 const parseDays=(value,max)=>{
   const raw=String(value||'').trim();
   if(!raw)return {days:[],invalid:[]};
   const tokens=raw.split(/[.,、，\s;；]+/).filter(Boolean),invalid=[],days=[];
   tokens.forEach(token=>{const day=Number(token);if(!Number.isInteger(day)||day<1||day>max)invalid.push(token);else if(!days.includes(day))days.push(day)});
   return {days:days.sort((a,b)=>a-b),invalid};
 };
 const ruleByCode=(ledger,code)=>{
   const map={年:'annual',旅:'travel',喪:'bereavement',婚:'marriage',病:'sick',事:'personal'};
   return ledger?.rules().find(rule=>rule.id===map[code]);
 };
 const buildMonthRows=(year,month,max,employee,occupied,codeNames)=>Array.from({length:max},(_,index)=>{
   const day=index+1,code=occupied.get(day)||'1',work=code==='1';
   return {date:iso(year,month,day),employeeId:employee.id,employeeName:employee.name,department:employee.department,start:work?'09:00':'',end:work?'18:00':'',code,site:'台中總公司',note:work?'整月快速輸入：正常上班':`整月快速輸入：${codeNames.get(code)||code}`};
 });
 const currentMonth=()=>{
   const cursor=typeof scheduleCursor!=='undefined'?scheduleCursor:new Date();
   return {year:cursor.getFullYear(),month:cursor.getMonth()+1,max:new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate()};
 };
 function fields(){
   const codes=window.BOMBHR_SCHEDULING?.scheduleCodes?.()||[{code:'休',name:'休假'},{code:'年',name:'年假'}];
   return codes.filter(item=>item.code!=='1');
 }
 function values(max){
   return fields().map(item=>({item,...parseDays(document.querySelector(`[data-monthly-code="${CSS.escape(item.code)}"]`)?.value,max)}));
 }
 function preview(max){
   const box=document.getElementById('monthlyPersonPreview');if(!box)return;
   const list=values(max),used=new Map(),conflicts=[];
   list.forEach(group=>group.days.forEach(day=>{if(used.has(day))conflicts.push(`${day} 日同時填在「${used.get(day)}」與「${group.item.code}」`);else used.set(day,group.item.code)}));
   const invalid=list.flatMap(group=>group.invalid.map(value=>`${group.item.code}：${value}`));
   box.innerHTML=list.filter(group=>group.days.length).map(group=>`<span>${esc(group.item.name)}：${group.days.join('、')} 日</span>`).join('')+
     conflicts.map(text=>`<span class="danger">${esc(text)}</span>`).join('')+
     invalid.map(text=>`<span class="danger">無效日期 ${esc(text)}（本月 1～${max} 日）</span>`).join('');
 }
 function makeLeaveEvent(employee,rule,dates){
   const id=`MONTH-LEAVE-${employee.id}-${rule.id}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
   return {id,eventId:id,category:'approval',subtype:'leave',title:`${rule.name}申請`,leaveType:rule.name,employee:employee.name,employeeId:employee.id,department:employee.department,dates,period:`${dates[0]}–${dates[dates.length-1]}`,duration:`${dates.length} 天`,leaveDays:dates.length,status:'approved',statusText:'已核准',source:'monthly-person-schedule',reason:'由整月員工排班快速輸入',reviewer:currentProfile().name,reviewerId:currentProfile().id,reviewerRole:currentProfile().label||currentRole(),reviewerDepartment:currentProfile().department||'—',reviewedAt:new Date().toISOString(),submitted:new Date().toLocaleString('zh-TW',{hour12:false})};
 }
 function openChangeRest(button){
   const employee={id:button.dataset.employeeId,name:button.dataset.employeeName,department:button.dataset.employeeDepartment||'—'},{year,month,max}=currentMonth(),monthPrefix=`${year}-${String(month).padStart(2,'0')}`,all=read(SCHEDULE_KEY,[]),restRows=all.filter(row=>row.employeeId===employee.id&&String(row.date).startsWith(monthPrefix)&&(row.code||'1')==='休').sort((a,b)=>a.date.localeCompare(b.date));
   if(!restRows.length){toast(`${employee.name}本月目前沒有可更改的「休」`);openBatch(button);return}
   openModal('改假',`${employee.name}・${employee.id}・只調整原休假日與新休假日，其他班表不變`,`<div class="change-rest-flow"><div><small>原休假日</small><select id="changeRestFrom" class="form-control">${restRows.map(row=>`<option value="${row.date}">${Number(row.date.slice(-2))} 日</option>`).join('')}</select></div><i>→</i><div><small>新的休假日</small><input id="changeRestTo" class="form-control" type="number" min="1" max="${max}" placeholder="輸入 1～${max}"></div></div><div class="policy-note">確認後，原休假日會恢復這位員工的預設上班班別，新日期改為「休」。正式年假、病假等仍須從假單流程更改。</div><p id="changeRestError" class="form-error"></p>`,`<button class="secondary-btn" id="backMonthlySchedule">← 返回快速排班</button><button class="primary-btn" id="confirmChangeRest">確認改假</button>`);
   document.getElementById('backMonthlySchedule').onclick=()=>openBatch(button);
   document.getElementById('confirmChangeRest').onclick=()=>{const from=document.getElementById('changeRestFrom').value,toDay=Number(document.getElementById('changeRestTo').value),error=document.getElementById('changeRestError');error.textContent='';if(!Number.isInteger(toDay)||toDay<1||toDay>max){error.textContent=`請輸入 1～${max} 的日期`;return}const to=iso(year,month,toDay);if(from===to){error.textContent='新休假日不可與原休假日相同';return}const target=all.find(row=>row.employeeId===employee.id&&row.date===to);if(target&&(target.code||'1')!=='1'){error.textContent=`${toDay} 日已有「${target.code}」，請先確認後再選其他日期`;return}let participation={};try{participation=JSON.parse(localStorage.getItem('bombhr-schedule-participants-v195')||'{}')}catch(e){}const shift=participation[employee.id]?.shift||'',[start='',end='']=shift.split('-'),kept=all.filter(row=>!(row.employeeId===employee.id&&(row.date===from||row.date===to)));kept.push({date:from,employeeId:employee.id,employeeName:employee.name,department:employee.department,start,end,code:'1',site:'台中總公司',note:`改假恢復上班：${Number(from.slice(-2))} 日`},{date:to,employeeId:employee.id,employeeName:employee.name,department:employee.department,start:'',end:'',code:'休',site:'台中總公司',note:`改假：${Number(from.slice(-2))} 日→${toDay} 日`});localStorage.setItem(SCHEDULE_KEY,JSON.stringify(kept));if(typeof addAudit==='function')addAudit('改假',`${employee.name}・${employee.id}・${from} → ${to}・${currentProfile().name} ${currentProfile().id}`);toast(`${employee.name}已改假：${Number(from.slice(-2))} 日 → ${toDay} 日`);openBatch(button);refreshBehind()};
 }
 function openBatch(button){
   const employee={id:button.dataset.employeeId,name:button.dataset.employeeName,department:button.dataset.employeeDepartment||'—'};
   const {year,month,max}=currentMonth(),restQuota=window.BOMBHR_SCHEDULING?.monthlyRestQuota?.(year,month)??8,codeFields=fields(),monthPrefix=`${year}-${String(month).padStart(2,'0')}`,savedRows=read(SCHEDULE_KEY,[]).filter(row=>row.employeeId===employee.id&&String(row.date).startsWith(monthPrefix)),savedDays=code=>savedRows.filter(row=>(row.code||'1')===code).map(row=>Number(String(row.date).slice(-2))).sort((a,b)=>a-b);
   const body=`<div class="monthly-person-example"><div><b>${year} 年 ${month} 月整月快速輸入</b><br>已自動帶入目前班表紀錄；本次儲存只更新輸入的日期，不會清除其他排班或外部手動修改。</div><span class="monthly-rest-quota"><small>本月公休額度</small><strong>${restQuota} 天</strong></span></div><div class="monthly-person-grid">${codeFields.map(item=>`<label class="monthly-person-field"><span><i>${esc(item.code)}</i>${esc(item.name)}</span><input class="form-control" data-monthly-code="${esc(item.code)}" inputmode="numeric" value="${savedDays(item.code).join('.')}" placeholder="${item.code==='休'?'04.08.13.18.19.24.25.30':item.code==='年'?'23.29':'輸入日期'}"><small>可輸入 1～${max} 日${item.code==='休'?`・本月額度 ${restQuota} 天`:''}</small></label>`).join('')}</div><div class="monthly-person-preview" id="monthlyPersonPreview"></div><p class="form-error" id="monthlyPersonError"></p>`;
   openModal('員工整月排班快速輸入',`${employee.name}・${employee.id}・${employee.department}`,body,`<button class="secondary-btn" id="changeRestDay">改假</button><button class="secondary-btn" id="useRangeLeave">改用單日／日期區間</button><button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="applyMonthlyPerson">套用到 ${month} 月班表</button>`);
   document.querySelectorAll('[data-monthly-code]').forEach(input=>input.addEventListener('input',()=>preview(max)));
   document.getElementById('changeRestDay').onclick=()=>openChangeRest(button);
   document.getElementById('useRangeLeave').onclick=()=>{closeModal();setTimeout(()=>window.BOMBHR_SCHEDULING.quickLeaveModal(button),0)};
   document.getElementById('applyMonthlyPerson').onclick=()=>{
     const groups=values(max),error=document.getElementById('monthlyPersonError'),occupied=new Map();
     error.textContent='';
     if(groups.some(group=>group.invalid.length)){error.textContent=`日期只能輸入 1～${max}，請修正紅色提示`;return}
     for(const group of groups)for(const day of group.days){if(occupied.has(day)){error.textContent=`${day} 日重複填在「${occupied.get(day)}」與「${group.item.code}」，請保留其中一個`;return}occupied.set(day,group.item.code)}
     if(!occupied.size&&!savedRows.some(row=>isQuickRow(row)&&(row.code||'1')==='休')){error.textContent='目前沒有可套用或取消的快速排休日期';return}
     const savedCodeByDay=new Map(savedRows.map(row=>[Number(String(row.date).slice(-2)),row.code||'1'])),codeNames=new Map((window.BOMBHR_SCHEDULING?.scheduleCodes?.()||[]).map(item=>[item.code,item.name])),showError=message=>{const target=document.getElementById('monthlyPersonError')||document.getElementById('restLimitError');if(target)target.textContent=message;else toast(message)};
     const performCommit=(changeReason='')=>{
       const ledger=window.BOMBHR_HR_LEDGER,leavePlans=[],changedByCode=new Map();
       [...occupied].forEach(([day,code])=>{if(code!=='休'&&savedCodeByDay.get(day)!==code){if(!changedByCode.has(code))changedByCode.set(code,[]);changedByCode.get(code).push(day)}});
       for(const [code,days] of changedByCode){const rule=ruleByCode(ledger,code);if(!rule)continue;const dates=days.map(day=>iso(year,month,day)),event=makeLeaveEvent(employee,rule,dates),check=ledger.validate(employee.id,rule.name,dates.length,dates[0],'');if(!check.ok){showError(check.message);return}leavePlans.push({event,rule})}
       for(const plan of leavePlans){const result=ledger.approve(plan.event);if(!result.ok){showError(result.message);return}}
       const currentRows=read(SCHEDULE_KEY,[]),updateKeys=new Set([...occupied.keys()].map(day=>`${employee.id}|${iso(year,month,day)}`)),newPublicRestDates=new Set([...occupied].filter(([,code])=>code==='休').map(([day])=>iso(year,month,day))),existing=currentRows.filter(row=>!updateKeys.has(`${row.employeeId}|${row.date}`)&&!(row.employeeId===employee.id&&String(row.date).startsWith(monthPrefix)&&isQuickRow(row)&&(row.code||'1')==='休'&&!newPublicRestDates.has(row.date))),rows=[...occupied].map(([day,code])=>({date:iso(year,month,day),employeeId:employee.id,employeeName:employee.name,department:employee.department,start:'',end:'',code,source:'quick-monthly',site:'台中總公司',note:`快速排班增量更新：${codeNames.get(code)||code}${changeReason?`・異動原因：${changeReason}`:''}`}));
       localStorage.setItem(SCHEDULE_KEY,JSON.stringify([...existing,...rows]));const events=read(EVENT_KEY,[]);leavePlans.forEach(plan=>events.unshift(plan.event));localStorage.setItem(EVENT_KEY,JSON.stringify(events.slice(0,200)));
       if(typeof addAudit==='function')addAudit('員工整月排班快速輸入',`${employee.name}・${employee.id}・${year}/${month}・修改前 ${savedRows.map(row=>`${Number(row.date.slice(-2))}${row.code||'1'}`).join('、')||'無'}・修改後 ${[...occupied].map(([day,code])=>`${day}${code}`).join('、')||'無'}・原因 ${changeReason||'班表公布前正常調整'}・${currentProfile().name} ${currentProfile().id}・${currentProfile().label||currentRole()}・${currentProfile().department||'—'}`);
       toast(`${employee.name}的 ${month} 月快速排班已更新 ${occupied.size} 日；其他既有排班全部保留`);refreshBehind();setTimeout(()=>openBatch(button),0);
     };
     const confirmCommit=(extraReason='')=>{const oldRest=savedRows.filter(row=>isQuickRow(row)&&(row.code||'1')==='休').map(row=>Number(row.date.slice(-2))),newRest=[...occupied].filter(([,code])=>code==='休').map(([day])=>day),added=newRest.filter(day=>!oldRest.includes(day)),removed=oldRest.filter(day=>!newRest.includes(day)),changed=[...occupied].filter(([day,code])=>savedCodeByDay.has(day)&&savedCodeByDay.get(day)!==code).map(([day,code])=>`${day}日 ${savedCodeByDay.get(day)}→${code}`),otherAdded=[...occupied].filter(([day,code])=>code!=='休'&&savedCodeByDay.get(day)!==code).map(([day,code])=>`${day}日 ${codeNames.get(code)||code}`),currentMonthValue=new Date().toISOString().slice(0,7),reasonRequired=monthPrefix<=currentMonthValue;openModal('確認排班異動',`${employee.name}・${monthPrefix}・儲存後保留完整異動與操作紀錄`,`<div class="schedule-diff-grid"><div><small>新增排休</small><b>${added.map(day=>`${day}日`).join('、')||'無'}</b></div><div><small>取消排休</small><b>${removed.map(day=>`${day}日`).join('、')||'無'}</b></div><div><small>代號變更</small><b>${changed.join('、')||'無'}</b></div><div><small>其他新增假別</small><b>${otherAdded.join('、')||'無'}</b></div></div>${extraReason?`<div class="policy-note">系統處理：${esc(extraReason)}</div>`:''}<label class="form-field">異動原因${reasonRequired?'（必填）':'（選填）'}<textarea id="scheduleChangeReason" class="form-control" rows="3" placeholder="例如：員工重新繳交排休、營運需求調整或主管協調">${esc(extraReason)}</textarea></label><p id="scheduleChangeError" class="form-error"></p>`,`<button class="secondary-btn" id="backMonthlyDraft">← 返回快速排班</button><button class="primary-btn" id="confirmMonthlyChanges">確認儲存異動</button>`);document.getElementById('backMonthlyDraft').onclick=()=>openBatch(button);document.getElementById('confirmMonthlyChanges').onclick=()=>{const reason=document.getElementById('scheduleChangeReason').value.trim();if(reasonRequired&&!reason){document.getElementById('scheduleChangeError').textContent='當月或歷史班表修改必須填寫原因';return}performCommit(reason)}};
     const publicRestGroup=groups.find(group=>group.item.code==='休'),finalRestDays=[...(publicRestGroup?.days||[])].sort((a,b)=>a-b),restCount=new Set(finalRestDays).size;
     if(restCount<=restQuota){confirmCommit();return}
     const overflow=restCount-restQuota,newRestDays=[...occupied].filter(([day,code])=>code==='休'&&savedCodeByDay.get(day)!=='休').map(([day])=>day),annualCandidates=[...newRestDays,...finalRestDays.filter(day=>!newRestDays.includes(day))].slice(0,overflow);
     openModal('公休超過本月額度',`${employee.name}・${month} 月目前共 ${restCount} 天公休，本月額度 ${restQuota} 天，超過 ${overflow} 天`,`<div class="rest-limit-warning"><strong>${restCount} 天</strong><div><b>本月公休額度為 ${restQuota} 天</b><span>額度依本月週六、週日及官方放假／補假日自動計算；請選擇移假、將超出日期改成年假，或填寫其他原因。</span></div></div><div class="rest-limit-days">建議改成年假的日期：${annualCandidates.map(day=>`<i>${day}日</i>`).join('')}</div><label class="form-field">其他原因<textarea id="restLimitReason" class="form-control" rows="3" placeholder="例如：本月特殊營運安排、補休核准或主管專案調整"></textarea></label><p id="restLimitError" class="form-error"></p>`,`<button class="secondary-btn" id="restLimitMove">改假／移假</button><button class="secondary-btn" id="restLimitAnnual">超出日期改年假</button><button class="primary-btn" id="restLimitOther">填原因並繼續</button>`);
     document.getElementById('restLimitMove').onclick=()=>openChangeRest(button);
     document.getElementById('restLimitAnnual').onclick=()=>{annualCandidates.forEach(day=>occupied.set(day,'年'));confirmCommit(`超出 ${overflow} 天改用年假`)};
     document.getElementById('restLimitOther').onclick=()=>{const reason=document.getElementById('restLimitReason').value.trim();if(!reason){document.getElementById('restLimitError').textContent=`請填寫超過本月 ${restQuota} 天公休額度的原因`;return}confirmCommit(reason)};
   };
 }
 document.addEventListener('click',event=>{
   const button=event.target.closest?.('[data-schedule-person]');
   if(!button)return;
   event.preventDefault();event.stopImmediatePropagation();openBatch(button);
 },true);
 window.BOMBHR_MONTHLY_PERSON_SCHEDULE={parseDays,buildMonthRows,openBatch};
})();

/* ===== Consolidated from schedule-preference-admin-v188.js ===== */
(function(){
 'use strict';
 const KEY='bombhr-schedule-preferences-v188',POLICY='bombhr-schedule-preference-policy-v188',SCHEDULE='bombhr-schedules-v176';
 const defaults={mode:'window',startDay:15,endDay:20,optional:true};
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(e){return fallback}};
 const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const canManagePolicy=()=>['executive','hradmin','supervisor'].includes(currentRole());
 const visible=item=>currentRole()!=='supervisor'||item.supervisorId===currentProfile().id||(typeof window.bombhrCanAccessEmployee==='function'&&window.bombhrCanAccessEmployee(item.employeeId));
 const submissions=()=>read(KEY,[]).filter(item=>item.status!=='draft'&&visible(item));
 function inbox(){
   const rows=submissions();
   return `<section class="preference-admin-card"><div class="preference-admin-head"><div><b>員工下月排休意願</b><small>僅供主管排班協調，不屬於正式請假，也不扣除假別額度</small></div><span class="preference-admin-count">${rows.filter(item=>item.status==='submitted').length} 件待安排</span></div>${rows.length?`<div class="table-wrap"><table><thead><tr><th>員工</th><th>排班月份</th><th>希望休假日期</th><th>備註</th><th>狀態</th><th>操作</th></tr></thead><tbody>${rows.map(item=>`<tr><td><b>${esc(item.employeeName)}</b><small class="table-subline">${esc(item.employeeId)}・${esc(item.department)}</small></td><td>${esc(item.targetMonth)}</td><td><div class="preference-date-tags">${item.dates.map(day=>`<i>${esc(day)}</i>`).join('')}</div></td><td>${esc(item.memo||'—')}</td><td>${badge(item.statusText)}</td><td class="row-actions">${item.status==='submitted'?`<button data-apply-preference="${esc(item.id)}">套入班表</button>`:'<button data-view-preference="${esc(item.id)}">查看</button>'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="preference-admin-empty">目前沒有員工提交排休意願；未提交不列為異常。</div>'}</section>`;
 }
 const baseSchedulingView=schedulingView;
 schedulingView=function(){
   const section=window.BOMBHR_SCHEDULE_SECTION||'calendar';
   if(section==='preference')return head('下月排休意願設定','Schedule Preference','設定 APP 繳交期限並整理員工排休意願')+policyView()+inbox();
   if(section==='codes')return head('排班代號設定','Schedule Codes','管理月班表可使用的上班、休假與自訂狀態代號')+window.BOMBHR_SCHEDULING.scheduleCodeMasterView();
   if(section==='leave-rules'){
     const leaveAdmin=window.BOMBHR_LEAVE_RULE_ADMIN;
     if(leaveAdmin?.canManage?.())return head('假別與額度設定','Leave Rules','設定假別、額度、期限及薪資連動')+leaveAdmin.view();
     window.BOMBHR_SCHEDULE_SECTION='calendar';
   }
   return baseSchedulingView()
 };
 function applyPreference(id){
   const all=read(KEY,[]),item=all.find(row=>row.id===id);if(!item||!visible(item))return;
   openModal('套用員工排休意願',`${item.employeeName}・${item.targetMonth}`,`<div class="permission-locked"><b>希望休假：${item.dates.join('、')} 日</b><span>套用後會在月班表標記為「休」，不會扣除任何假別額度。若需使用年假等假別，員工仍須另外提出正式請假。</span></div>${item.memo?`<div class="form-hint">員工備註：${esc(item.memo)}</div>`:''}`,`<button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="confirmApplyPreference">確認套入班表</button>`);
   document.getElementById('confirmApplyPreference').onclick=()=>{
     const dates=item.dates.map(day=>`${item.targetMonth}-${day}`),schedules=read(SCHEDULE,[]).filter(row=>!(row.employeeId===item.employeeId&&dates.includes(row.date)));
     dates.forEach(date=>schedules.push({date,employeeId:item.employeeId,employeeName:item.employeeName,department:item.department,start:'',end:'',code:'休',site:'台中總公司',note:`員工排休意願・${item.id}`}));
     write(SCHEDULE,schedules);item.status='applied';item.statusText='主管已套入班表';item.appliedBy=`${currentProfile().name}・${currentProfile().id}`;item.appliedAt=new Date().toLocaleString('zh-TW',{hour12:false});write(KEY,all);
     if(typeof addAudit==='function')addAudit('套用員工排休意願',`${item.employeeName}・${item.employeeId}・${item.targetMonth}・${item.dates.join('、')}・${item.appliedBy}`);
     closeModal();toast(`${item.employeeName}的排休意願已套入 ${item.targetMonth} 班表`);window.dispatchEvent(new HashChangeEvent('hashchange'));
   };
 }
 function policyView(){
   if(!canManagePolicy())return '';
   const p=read(POLICY,defaults);
   return `<section class="panel preference-policy-card"><div><h3>下月排休意願設定</h3><p>控制 Employee App 的提交期間；此功能永遠維持自願填寫。</p></div><div class="form-grid"><label class="form-field">開放方式<select id="preferencePolicyMode" class="form-control"><option value="window" ${p.mode==='window'?'selected':''}>每月指定日期開放</option><option value="anytime" ${p.mode==='anytime'?'selected':''}>隨時開放</option></select></label><label class="form-field">開始日<input id="preferenceStartDay" class="form-control" type="number" min="1" max="31" value="${p.startDay}"></label><label class="form-field">結束日<input id="preferenceEndDay" class="form-control" type="number" min="1" max="31" value="${p.endDay}"></label></div><div class="preference-policy-note">未提交不會產生缺繳、異常或催繳通知。員工提交的是排休意願，不等於請假核准，最終仍由主管發布班表。</div><button class="primary-btn" id="savePreferencePolicy">儲存排休意願設定</button></section>`;
 }
 function bindPolicy(){
   const save=document.getElementById('savePreferencePolicy');
   if(!save)return;
   save.onclick=()=>{
     if(!canManagePolicy()){toast('目前身份沒有調整排休期限的權限');return}
     const mode=document.getElementById('preferencePolicyMode').value,startDay=Number(document.getElementById('preferenceStartDay').value),endDay=Number(document.getElementById('preferenceEndDay').value);
     if(mode==='window'&&(startDay<1||endDay>31||startDay>endDay)){toast('請輸入正確的開放日期範圍');return}
     write(POLICY,{mode,startDay,endDay,optional:true,updatedBy:`${currentProfile().name}・${currentProfile().id}`,updatedAt:new Date().toLocaleString('zh-TW',{hour12:false})});
     if(typeof addAudit==='function')addAudit('修改排休意願開放設定',`${mode==='anytime'?'隨時開放':`每月 ${startDay}～${endDay} 日`}・自願填寫`);
     toast('排休意願設定已儲存並同步 Employee App')
   }
 }
 const priorBind=bindView;
 bindView=function(route){
   priorBind(route);
   if(route==='scheduling')setTimeout(()=>{const section=window.BOMBHR_SCHEDULE_SECTION||'calendar';if(section==='preference'){document.querySelectorAll('[data-apply-preference]').forEach(button=>button.onclick=()=>applyPreference(button.dataset.applyPreference));bindPolicy()}else if(section==='codes')window.BOMBHR_SCHEDULING.bindCodeMaster();else if(section==='leave-rules')window.BOMBHR_LEAVE_RULE_ADMIN?.bind?.()},0);
 };
 window.addEventListener('storage',event=>{if(event.key===KEY&&location.hash==='#scheduling')window.dispatchEvent(new HashChangeEvent('hashchange'))});
 window.BOMBHR_SCHEDULE_PREFERENCE_ADMIN={submissions,visible,inbox,applyPreference,policyView};
})();

/* ===== Consolidated from schedule-table-tools-v190.js ===== */
(function(){
 'use strict';
 const defaults={cellWidth:52,rowHeight:54,fontSize:11};
 const key=()=>`bombhr-schedule-table-view-v190-${currentProfile().id||'unknown'}`;
 const read=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(key())||'{}')}}catch(e){return {...defaults}}};
 const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
 const percent=value=>Math.round(value/defaults.cellWidth*100);
 function toolbar(){
   const value=read();
   return `<div class="schedule-table-tools"><strong>表格顯示</strong><div class="schedule-table-tool-group"><button type="button" data-table-size="-1" title="縮小表格">−</button><input id="scheduleTableSize" type="number" min="69" max="154" step="1" value="${percent(value.cellWidth)}" aria-label="表格比例"><span>%</span><button type="button" data-table-size="1" title="放大表格">＋</button></div><strong>文字大小</strong><div class="schedule-table-tool-group"><button type="button" data-font-size="-1" title="縮小文字">A−</button><input id="scheduleFontSize" type="number" min="9" max="18" step="1" value="${value.fontSize}" aria-label="文字大小"><span>px</span><button type="button" data-font-size="1" title="放大文字">A＋</button></div><button type="button" class="schedule-table-reset" data-table-reset>恢復預設</button></div>`;
 }
 function apply(value=read(),save=false){
   const content=document.getElementById('content');if(!content)return;
   content.style.setProperty('--schedule-cell-width',`${value.cellWidth}px`);
   content.style.setProperty('--schedule-row-height',`${value.rowHeight}px`);
   content.style.setProperty('--schedule-font-size',`${value.fontSize}px`);
   content.style.setProperty('--schedule-person-width',`${Math.round(270*(value.cellWidth/defaults.cellWidth))}px`);
   const size=document.getElementById('scheduleTableSize'),font=document.getElementById('scheduleFontSize');
   if(size&&document.activeElement!==size)size.value=percent(value.cellWidth);if(font&&document.activeElement!==font)font.value=value.fontSize;
   if(save)localStorage.setItem(key(),JSON.stringify(value));
 }
 function bind(){
   apply();
   document.querySelectorAll('.schedule-matrix-cell').forEach(cell=>cell.dataset.code=cell.textContent.trim().replace('⚠',''));
   document.querySelectorAll('[data-table-size]').forEach(button=>button.onclick=()=>{const value=read(),delta=Number(button.dataset.tableSize);value.cellWidth=clamp(value.cellWidth+delta*4,36,80);value.rowHeight=clamp(value.rowHeight+delta*4,42,82);apply(value,true)});
   document.querySelectorAll('[data-font-size]').forEach(button=>button.onclick=()=>{const value=read();value.fontSize=clamp(value.fontSize+Number(button.dataset.fontSize),9,18);apply(value,true)});
   const sizeInput=document.getElementById('scheduleTableSize'),fontInput=document.getElementById('scheduleFontSize');
   const applySizeInput=()=>{const value=read(),requested=clamp(Number(sizeInput.value)||100,69,154),ratio=requested/100;value.cellWidth=clamp(Math.round(defaults.cellWidth*ratio),36,80);value.rowHeight=clamp(Math.round(defaults.rowHeight*ratio),42,82);sizeInput.value=percent(value.cellWidth);apply(value,true)};
   const applyFontInput=()=>{const value=read();value.fontSize=clamp(Number(fontInput.value)||defaults.fontSize,9,18);fontInput.value=value.fontSize;apply(value,true)};
   sizeInput?.addEventListener('change',applySizeInput);fontInput?.addEventListener('change',applyFontInput);
   sizeInput?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();applySizeInput();sizeInput.blur()}});
   fontInput?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();applyFontInput();fontInput.blur()}});
   document.querySelector('[data-table-reset]')?.addEventListener('click',()=>{localStorage.removeItem(key());apply(defaults);toast('班表大小與文字已恢復預設')});
 }
 const baseSchedulingView=schedulingView;
 schedulingView=function(){return baseSchedulingView().replace('<div class="calendar-scroll">',toolbar()+'<div class="calendar-scroll">')};
 const priorBind=bindView;
 bindView=function(route){priorBind(route);if(route==='scheduling')setTimeout(bind,0)};
 window.BOMBHR_SCHEDULE_TABLE_TOOLS={read,apply,bind,defaults};
})();

/* ===== Consolidated from schedule-code-drag-v193.js ===== */
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

/* ===== Supervisor calendar memos ===== */
(function(){
 'use strict';
 const KEY='bombhr-supervisor-schedule-memos-v206';
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return []}};
 const write=value=>localStorage.setItem(KEY,JSON.stringify(value));
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const currentMonth=()=>`${scheduleCursor.getFullYear()}-${String(scheduleCursor.getMonth()+1).padStart(2,'0')}`;
 const allowed=()=>['executive','hradmin','supervisor'].includes(currentRole());
 function visible(){
  const month=currentMonth(),profile=currentProfile();
  const normalize=value=>String(value||'').replace(/財務\/人事|財務人事行政|部門|部/g,'').trim();
  return read().filter(item=>{
   const itemMonth=item.month||String(item.date||'').slice(0,7);
   const sameScope=item.createdById===profile.id||normalize(item.department)===normalize(profile.department);
   return itemMonth===month&&(currentRole()!=='supervisor'||sameScope);
  });
 }
 function panel(){
  if((window.BOMBHR_SCHEDULE_SECTION||'calendar')!=='calendar')return '';
  const items=visible();
  return `<section class="supervisor-memo-panel"><div class="supervisor-memo-head"><div><span>SUPERVISOR MEMO</span><h3>主管備忘錄</h3><small>${esc(currentMonth())}・新增後立即顯示在班表日期與本清單</small></div>${allowed()?'<button class="primary-btn" data-add-supervisor-memo>＋ 新增備忘錄</button>':''}</div>${items.length?`<div class="supervisor-memo-list">${items.sort((a,b)=>a.date.localeCompare(b.date)).map(item=>`<article class="priority-${esc(item.priority)}"><time>${esc(item.date.slice(5).replace('-','/'))}</time><div><b>${esc(item.title)}</b><p>${esc(item.content||'沒有補充內容')}</p><small>${esc(item.createdBy)}・${esc(item.department||'全公司')}</small></div>${allowed()?`<button data-delete-supervisor-memo="${esc(item.id)}" aria-label="刪除備忘錄">×</button>`:''}</article>`).join('')}</div>`:'<div class="supervisor-memo-empty">本月尚無主管備忘錄。新增後會固定保留，重新整理也不會消失。</div>'}</section>`;
 }
 function openCreate(){
  const month=currentMonth(),today=new Date(),suggested=today.toISOString().slice(0,7)===month?today.toISOString().slice(0,10):`${month}-01`;
  openModal('新增主管備忘錄',`${month} 班表・儲存後立即顯示`, `<div class="form-grid"><label class="form-field">日期<input id="supervisorMemoDate" class="form-control" type="date" min="${month}-01" max="${month}-${String(new Date(scheduleCursor.getFullYear(),scheduleCursor.getMonth()+1,0).getDate()).padStart(2,'0')}" value="${suggested}"></label><label class="form-field">重要程度<select id="supervisorMemoPriority" class="form-control"><option value="normal">一般</option><option value="important">重要</option><option value="urgent">緊急</option></select></label><label class="form-field full">標題<input id="supervisorMemoTitle" class="form-control" maxlength="40" placeholder="例如：月會、盤點、活動準備"></label></div><p id="supervisorMemoError" class="form-error"></p>`, '<button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="saveSupervisorMemo">儲存並顯示</button>');
  document.getElementById('saveSupervisorMemo').onclick=()=>{
   const date=document.getElementById('supervisorMemoDate').value,title=document.getElementById('supervisorMemoTitle').value.trim(),priority=document.getElementById('supervisorMemoPriority').value,error=document.getElementById('supervisorMemoError');
   if(!date||date.slice(0,7)!==month||!title){error.textContent='請選擇本月日期並輸入標題';return}
   const profile=currentProfile(),all=read();all.unshift({id:`MEMO-${Date.now()}`,month,date,title,priority,department:profile.department||'全公司',createdById:profile.id,createdBy:`${profile.name}・${profile.id}`,createdAt:new Date().toISOString()});write(all);
   if(typeof addAudit==='function')addAudit('新增主管備忘錄',`${date}・${title}・${profile.name}`);
   closeModal();window.BOMBHR_SCHEDULE_SECTION='calendar';window.dispatchEvent(new HashChangeEvent('hashchange'));toast('主管備忘錄已儲存，已顯示於班表上方與指定日期');
  };
 }
 function openEdit(id){
  const all=read(),item=all.find(row=>row.id===id);if(!item)return;
  const month=currentMonth(),lastDay=String(new Date(scheduleCursor.getFullYear(),scheduleCursor.getMonth()+1,0).getDate()).padStart(2,'0');
  openModal('編輯主管備忘錄',`${month} 班表・修改後立即更新`, `<div class="form-grid"><label class="form-field">日期<input id="supervisorMemoDate" class="form-control" type="date" min="${month}-01" max="${month}-${lastDay}" value="${esc(item.date)}"></label><label class="form-field">重要程度<select id="supervisorMemoPriority" class="form-control"><option value="normal"${item.priority==='normal'?' selected':''}>一般</option><option value="important"${item.priority==='important'?' selected':''}>重要</option><option value="urgent"${item.priority==='urgent'?' selected':''}>緊急</option></select></label><label class="form-field full">標題<input id="supervisorMemoTitle" class="form-control" maxlength="40" value="${esc(item.title)}"></label></div><p id="supervisorMemoError" class="form-error"></p>`, '<button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="updateSupervisorMemo">儲存修改</button>');
  document.getElementById('updateSupervisorMemo').onclick=()=>{
   const date=document.getElementById('supervisorMemoDate').value,title=document.getElementById('supervisorMemoTitle').value.trim(),priority=document.getElementById('supervisorMemoPriority').value,error=document.getElementById('supervisorMemoError');
   if(!date||date.slice(0,7)!==month||!title){error.textContent='請選擇本月日期並輸入標題';return}
   const profile=currentProfile(),index=all.findIndex(row=>row.id===id);if(index<0)return;
   all[index]={...all[index],month,date,title,priority,content:'',updatedById:profile.id,updatedBy:`${profile.name}・${profile.id}`,updatedAt:new Date().toISOString()};write(all);
   if(typeof addAudit==='function')addAudit('編輯主管備忘錄',`${date}・${title}・${profile.name}`);
   closeModal();window.dispatchEvent(new HashChangeEvent('hashchange'));toast('主管備忘錄已更新');
  };
 }
 function openManager(filterDate=''){
  const items=visible().filter(item=>!filterDate||item.date===filterDate);
  const title=filterDate?`${filterDate.slice(5).replace('-','/')} 主管備忘錄`:'主管備忘錄';
  const list=items.length?`<div class="supervisor-memo-modal-list">${items.sort((a,b)=>a.date.localeCompare(b.date)).map(item=>`<article class="priority-${esc(item.priority)}"><time>${esc(item.date.slice(5).replace('-','/'))}</time><div><b>${esc(item.title)}</b><small>${item.updatedBy?`最後修改：${esc(item.updatedBy)}`:esc(item.createdBy)}・${esc(item.department||'全公司')}</small></div>${allowed()?`<div class="supervisor-memo-modal-actions"><button data-modal-edit-supervisor-memo="${esc(item.id)}">編輯</button><button class="danger" data-modal-delete-supervisor-memo="${esc(item.id)}">刪除</button></div>`:''}</article>`).join('')}</div>`:'<div class="supervisor-memo-modal-empty">目前沒有主管備忘錄。</div>';
  openModal(title,`${esc(currentMonth())}・${items.length} 則備忘錄`,list,`<button class="secondary-btn" data-modal-close>關閉</button>${allowed()?'<button class="primary-btn" id="modalAddSupervisorMemo">＋ 新增備忘錄</button>':''}`);
  document.getElementById('modalAddSupervisorMemo')?.addEventListener('click',openCreate);
  document.querySelectorAll('[data-modal-edit-supervisor-memo]').forEach(button=>button.onclick=()=>openEdit(button.dataset.modalEditSupervisorMemo));
  document.querySelectorAll('[data-modal-delete-supervisor-memo]').forEach(button=>button.onclick=()=>{
   const all=read(),item=all.find(row=>row.id===button.dataset.modalDeleteSupervisorMemo);if(!item)return;
   if(!confirm(`確定刪除「${item.title}」？`))return;
   write(all.filter(row=>row.id!==item.id));if(typeof addAudit==='function')addAudit('刪除主管備忘錄',`${item.date}・${item.title}`);
   toast('主管備忘錄已刪除');openManager(filterDate);
  });
 }
 function markCalendar(){
  const items=visible();
  document.querySelectorAll('.schedule-date-cell').forEach(cell=>{const day=Number(cell.querySelector('b')?.textContent||0),date=`${currentMonth()}-${String(day).padStart(2,'0')}`,matched=items.filter(item=>item.date===date),count=matched.length;if(count){const priority=matched.some(item=>item.priority==='urgent')?'urgent':matched.some(item=>item.priority==='important')?'important':'normal';cell.classList.add('has-supervisor-memo',`memo-${priority}`);cell.dataset.openSupervisorMemoDate=date;cell.title=`點擊查看 ${count} 則主管備忘錄`;cell.setAttribute('aria-label',`${day} 日，有 ${count} 則主管備忘錄`)}})
 }
 function bind(){
  document.querySelectorAll('[data-add-supervisor-memo]').forEach(button=>button.onclick=openCreate);
  document.querySelectorAll('[data-calendar-note]').forEach(button=>{button.textContent=`主管備忘錄${visible().length?`（${visible().length}）`:''}`;button.onclick=()=>openManager()});
  markCalendar();
  document.querySelectorAll('[data-open-supervisor-memo-date]').forEach(button=>button.onclick=event=>{event.stopPropagation();openManager(button.dataset.openSupervisorMemoDate)});
  document.querySelectorAll('[data-delete-supervisor-memo]').forEach(button=>button.onclick=()=>{const all=read(),item=all.find(row=>row.id===button.dataset.deleteSupervisorMemo);if(!item)return;if(!confirm(`確定刪除「${item.title}」？`))return;write(all.filter(row=>row.id!==item.id));if(typeof addAudit==='function')addAudit('刪除主管備忘錄',`${item.date}・${item.title}`);toast('主管備忘錄已刪除');window.dispatchEvent(new HashChangeEvent('hashchange'))});
 }
 const previousView=schedulingView;
 schedulingView=function(){
  let html=previousView().replace('2025/11～2027/12 快速檢視、農曆、主管備註與跨據點人力支援','');
  return html;
 };
 const previousBind=bindView;
 bindView=function(route){previousBind(route);if(route==='scheduling')setTimeout(bind,0)};
 document.addEventListener('click',event=>{const target=event.target.closest?.('[data-open-supervisor-memo-date]');if(!target||location.hash!=='#scheduling')return;event.preventDefault();event.stopPropagation();openManager(target.dataset.openSupervisorMemoDate)},true);
 window.addEventListener('storage',event=>{if(event.key===KEY&&location.hash==='#scheduling')window.dispatchEvent(new HashChangeEvent('hashchange'))});
 window.BOMBHR_SUPERVISOR_MEMOS={read,visible,panel,openManager};
})();

/* ===== Consolidated from schedule-page-layout-v194.js ===== */
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
     if(preference&&!bottom.contains(preference))bottom.append(preference);
     if(importNote&&!bottom.contains(importNote))bottom.append(importNote);
   }
 }
 const priorBind=bindView;
 bindView=function(route){priorBind(route);if(route==='scheduling')setTimeout(arrange,0)};
 setTimeout(arrange,0);
 window.BOMBHR_SCHEDULE_PAGE_LAYOUT={arrange};
})();

/* ===== Consolidated from schedule-participation-v195.js ===== */
(function(){
 'use strict';
 const KEY='bombhr-schedule-participants-v195';
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}};
 const write=value=>localStorage.setItem(KEY,JSON.stringify(value));
 const monthValue=()=>typeof scheduleCursor!=='undefined'?`${scheduleCursor.getFullYear()}-${String(scheduleCursor.getMonth()+1).padStart(2,'0')}`:new Date().toISOString().slice(0,7);
 const effective=(setting,month)=>{
   if(!setting||setting.mode==='participate')return false;
   if(setting.mode==='exclude')return month>=(setting.effectiveMonth||'0000-00');
   if(setting.mode==='pause'){const start=String(setting.startDate||'').slice(0,7),end=String(setting.endDate||'9999-12').slice(0,7);return (!start||month>=start)&&(!end||month<=end)}
   return false;
 };
 function isIncluded(person,month=monthValue()){const setting=read()[person.employeeId];return !effective(setting,month)}
 function settingFor(employeeId){return read()[employeeId]||{mode:'participate',effectiveMonth:monthValue(),startDate:'',endDate:'',reason:'',shift:''}}
 function people(){
   let custom=[];try{custom=typeof getCustomEmployees==='function'?getCustomEmployees():JSON.parse(localStorage.getItem('bombhr-custom-employees-v147')||localStorage.getItem('bombhr-custom-employees')||'[]')}catch(e){}
   const all=[...(window.BOMBHR_IMPORTED_PERSONNEL||[]),...custom].filter((person,index,list)=>person?.employeeId&&list.findIndex(item=>item.employeeId===person.employeeId)===index);
   return all.filter(person=>typeof window.bombhrCanAccessEmployee!=='function'||window.bombhrCanAccessEmployee(person.employeeId));
 }
 function statusLabel(setting){
   if(setting.mode==='exclude')return `自 ${setting.effectiveMonth||'現在'} 起不參與`;
   if(setting.mode==='pause')return `${setting.startDate||'未定'}～${setting.endDate||'未定'} 暫停`;
   if(setting.mode==='fixed')return `固定班 ${setting.shift||'未設定班別'}`;
   return '參與排班';
 }
 function renderRows(filter=''){
   const root=document.getElementById('scheduleParticipationList');if(!root)return;
   const keyword=filter.trim().toLowerCase(),records=read(),visible=people().filter(person=>!keyword||[person.name,person.employeeId,person.department,person.position].join(' ').toLowerCase().includes(keyword));
   root.innerHTML=visible.map(person=>{
     const setting=records[person.employeeId]||settingFor(person.employeeId),mode=setting.mode||'participate';
     return `<div class="schedule-participation-row" data-participation-row="${person.employeeId}" data-mode="${mode}"><div class="schedule-participation-person"><b>${person.name}</b><small>${person.employeeId}・${person.department||'—'}／${person.position||'—'}</small><small>${statusLabel(setting)}</small></div><label>排班狀態<select class="form-control" data-participation-mode><option value="participate" ${mode==='participate'?'selected':''}>參與排班</option><option value="exclude" ${mode==='exclude'?'selected':''}>不參與排班</option><option value="pause" ${mode==='pause'?'selected':''}>指定期間暫停</option><option value="fixed" ${mode==='fixed'?'selected':''}>固定班制</option></select></label><label data-effective-field>生效月份<input class="form-control" data-participation-effective type="month" value="${setting.effectiveMonth||monthValue()}"></label><label data-start-field>暫停開始<input class="form-control" data-participation-start type="date" value="${setting.startDate||''}"></label><label data-end-field>暫停結束<input class="form-control" data-participation-end type="date" value="${setting.endDate||''}"></label><label data-shift-field>固定班別<select class="form-control" data-participation-shift><option value="" >不預設班別時間</option><option value="09:00-18:00" ${setting.shift==='09:00-18:00'?'selected':''}>日班 09:00–18:00</option><option value="08:30-17:30" ${setting.shift==='08:30-17:30'?'selected':''}>早班 08:30–17:30</option><option value="13:00-22:00" ${setting.shift==='13:00-22:00'?'selected':''}>晚班 13:00–22:00</option></select></label><label>原因／備註<input class="form-control" data-participation-reason value="${setting.reason||''}" placeholder="選填"></label></div>`;
   }).join('')||'<div class="empty-state">沒有符合目前權限範圍的員工。</div>';
   root.querySelectorAll('[data-participation-mode]').forEach(select=>{select.onchange=()=>updateVisibility(select.closest('[data-participation-row]'))});
   root.querySelectorAll('[data-participation-row]').forEach(updateVisibility);
 }
 function updateVisibility(row){
   const mode=row.querySelector('[data-participation-mode]').value;row.dataset.mode=mode;
   row.querySelector('[data-effective-field]').hidden=mode!=='exclude';
   row.querySelector('[data-start-field]').hidden=mode!=='pause';
   row.querySelector('[data-end-field]').hidden=mode!=='pause';
   row.querySelector('[data-shift-field]').hidden=mode!=='fixed';
 }
 function openManager(){
   const all=people(),records=read(),excluded=all.filter(person=>effective(records[person.employeeId],monthValue())).length;
   openModal('排班對象管理',`${monthValue()}・目前權限範圍內共 ${all.length} 位員工`,`<div class="schedule-participation-summary"><span>參與排班 <b>${all.length-excluded}</b></span><span>本月不顯示 <b>${excluded}</b></span><span>歷史資料 <b>永久保留</b></span></div><label class="search-field">⌕<input id="scheduleParticipationSearch" placeholder="搜尋姓名、員編、部門或職位"></label><div class="schedule-participation-list" id="scheduleParticipationList"></div><div class="schedule-participation-note">不參與或暫停排班只會從生效月份的班表名單隱藏，不會刪除員工主檔、登入帳號、薪資、保險、假別額度或歷史班表。</div>`,`<button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="saveScheduleParticipation">儲存排班對象</button>`);
   renderRows();
   document.getElementById('scheduleParticipationSearch').oninput=event=>renderRows(event.target.value);
   document.getElementById('saveScheduleParticipation').onclick=saveManager;
 }
 function saveManager(){
   const records=read(),errors=[];
   document.querySelectorAll('[data-participation-row]').forEach(row=>{
     const id=row.dataset.participationRow,mode=row.querySelector('[data-participation-mode]').value,startDate=row.querySelector('[data-participation-start]').value,endDate=row.querySelector('[data-participation-end]').value;
     if(mode==='pause'&&(!startDate||!endDate||endDate<startDate)){errors.push(`${id} 的暫停日期不完整`);return}
     records[id]={mode,effectiveMonth:row.querySelector('[data-participation-effective]').value||monthValue(),startDate,endDate,shift:row.querySelector('[data-participation-shift]').value,reason:row.querySelector('[data-participation-reason]').value.trim(),updatedBy:`${currentProfile().name}・${currentProfile().id}`,updatedRole:currentProfile().label||currentRole(),updatedDepartment:currentProfile().department||'—',updatedAt:new Date().toLocaleString('zh-TW',{hour12:false})};
   });
   if(errors.length){toast(errors[0]);return}
   write(records);
   if(typeof addAudit==='function')addAudit('修改排班對象',`${currentProfile().name}・${currentProfile().id}・${currentProfile().label||currentRole()}・責任部門 ${currentProfile().department||'—'}・${new Date().toLocaleString('zh-TW',{hour12:false})}`);
   closeModal();toast('排班對象設定已儲存；員工主檔與歷史班表不受影響');window.dispatchEvent(new HashChangeEvent('hashchange'));
 }
 function injectButton(){
   if(typeof currentRole==='function'&&currentRole()==='supervisor')return;
   const download=document.querySelector('a[href*="BOMB-HR-每月班表範例"]');if(!download||document.querySelector('[data-schedule-participation]'))return;
   const button=document.createElement('button');button.type='button';button.className='secondary-btn schedule-participation-trigger';button.dataset.scheduleParticipation='';button.textContent='排班對象';button.onclick=openManager;download.parentNode.insertBefore(button,download);
 }
 const priorBind=bindView;
 bindView=function(route){priorBind(route);if(route==='scheduling')setTimeout(injectButton,0)};
 setTimeout(injectButton,0);
 setTimeout(()=>{if(location.hash==='#scheduling')window.dispatchEvent(new HashChangeEvent('hashchange'))},0);
 window.BOMBHR_SCHEDULE_PARTICIPATION={read,isIncluded,settingFor,effective,people,renderRows,openManager,saveManager,injectButton};
})();

/* Employee-based scheduling policy groups with manual overrides. */
(function(){
 'use strict';
 const KEY='bombhr-schedule-participants-v195';
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}};
 const write=value=>localStorage.setItem(KEY,JSON.stringify(value));
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const modes={roster:'排班制',weekend:'固定週休',weekendHoliday:'週休＋國定假日休'};
 const migrated=read();let migratedChanged=false;Object.values(migrated).forEach(setting=>{if(setting?.policyMode==='holiday'){setting.policyMode='weekendHoliday';migratedChanged=true}});if(migratedChanged)write(migrated);
 function people(){return window.BOMBHR_SCHEDULE_PARTICIPATION?.people?.()||[]}
 function shiftParts(setting={}){const [start='',end='']=String(setting.shift||'').split('-');return {start,end}}
 function defaultCode(person,date,holidayName=''){
  const setting=read()[person.employeeId]||{},mode=setting.policyMode||(setting.mode==='fixed'?'weekend':'roster'),day=new Date(`${date}T00:00:00`).getDay(),weekend=day===0||day===6;
  if(mode==='roster')return '1';
  if(mode==='weekend')return weekend?'休':'1';
  if(mode==='weekendHoliday')return weekend||holidayName?'休':'1';
  return '1';
 }
 function policyLabel(setting={}){
  const mode=setting.policyMode||(setting.mode==='fixed'?'weekend':'roster');
  return `${modes[mode]||modes.roster}・${setting.shift||'尚未自訂時間'}`;
 }
 function renderPolicyRows(filter=''){
  const root=document.getElementById('schedulePolicyRows');if(!root)return;
  const keyword=filter.trim().toLowerCase(),records=read(),list=people().filter(person=>!keyword||[person.name,person.employeeId,person.department,person.position].join(' ').toLowerCase().includes(keyword));
  root.innerHTML=list.map(person=>{const setting=records[person.employeeId]||{},mode=setting.policyMode||(setting.mode==='fixed'?'weekend':'roster'),shift=shiftParts(setting);return `<div class="schedule-policy-row" data-schedule-policy-row="${esc(person.employeeId)}"><div><b>${esc(person.name)}</b><small>${esc(person.employeeId)}・${esc(person.department||'—')}／${esc(person.position||'—')}</small><em>${esc(policyLabel(setting))}</em></div><label>排班制度<select class="form-control" data-policy-mode>${Object.entries(modes).map(([value,label])=>`<option value="${value}" ${mode===value?'selected':''}>${label}</option>`).join('')}</select></label><label data-policy-shift>自訂班別時間<span class="schedule-policy-time"><input class="form-control" data-policy-start type="time" value="${esc(shift.start)}"><i>～</i><input class="form-control" data-policy-end type="time" value="${esc(shift.end)}"></span></label></div>`}).join('')||'<div class="empty-state">找不到符合的員工。</div>';
 }
 function openPolicyManager(){
  const all=people(),records=read(),counts=Object.keys(modes).map(mode=>[mode,all.filter(person=>(records[person.employeeId]?.policyMode||(records[person.employeeId]?.mode==='fixed'?'weekend':'roster'))===mode).length]);
  openModal('員工排班制度','制度會從預設上班 1 中，自動替換應休日期；手動調班與調休永遠優先',`<div class="schedule-policy-summary">${counts.map(([mode,count])=>`<span>${modes[mode]} <b>${count}</b></span>`).join('')}</div><label class="search-field">⌕<input id="schedulePolicySearch" placeholder="搜尋姓名、員編、部門或職位"></label><div class="schedule-policy-rows" id="schedulePolicyRows"></div><div class="schedule-participation-note"><b>套用原則：</b>所有日期原本預設為 1；固定週休只把六、日改成休；週休＋國定假日休會把六、日及官方假日改成休。未符合休假條件的日期仍保留 1，班別起訖時間可依員工自行輸入。</div>`,`<button class="secondary-btn" data-modal-close>取消</button><button class="primary-btn" id="saveSchedulePolicies">儲存排班制度</button>`);
  renderPolicyRows();document.getElementById('schedulePolicySearch').oninput=event=>renderPolicyRows(event.target.value);
  document.getElementById('saveSchedulePolicies').onclick=()=>{const next=read();document.querySelectorAll('[data-schedule-policy-row]').forEach(row=>{const id=row.dataset.schedulePolicyRow,current=next[id]||{},policyMode=row.querySelector('[data-policy-mode]').value,start=row.querySelector('[data-policy-start]').value,end=row.querySelector('[data-policy-end]').value,shift=start&&end?`${start}-${end}`:'';next[id]={...current,mode:'participate',policyMode,shift,updatedBy:`${currentProfile().name}・${currentProfile().id}`,updatedAt:new Date().toLocaleString('zh-TW',{hour12:false})}});write(next);if(typeof addAudit==='function')addAudit('修改員工排班制度',`${currentProfile().name}・${document.querySelectorAll('[data-schedule-policy-row]').length} 位員工`);toast('員工排班制度已儲存；符合休假制度的日期已由 1 改為休');openPolicyManager();window.dispatchEvent(new HashChangeEvent('hashchange'))};
 }
 function inject(){
  const participation=document.querySelector('[data-schedule-participation]'),existing=document.querySelector('[data-schedule-policy-groups]');if(existing)return;
  const anchor=participation||document.querySelector('a[href*="BOMB-HR-每月班表範例"]');if(!anchor)return;
  const button=document.createElement('button');button.type='button';button.className='secondary-btn';button.dataset.schedulePolicyGroups='';button.textContent='員工排班制度';button.onclick=openPolicyManager;anchor.parentNode.insertBefore(button,anchor.nextSibling);
 }
 const priorBind=bindView;bindView=function(route){priorBind(route);if(route==='scheduling')setTimeout(inject,0)};
 const api=window.BOMBHR_SCHEDULE_PARTICIPATION||{};Object.assign(api,{defaultCode,openPolicyManager,renderPolicyRows,policyLabel,modes});window.BOMBHR_SCHEDULE_PARTICIPATION=api;
 setTimeout(inject,0);
})();

/* ===== Consolidated from schedule-visual-v196.js ===== */
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

/* ===== Scheduling boot guard: repaint when a hard refresh starts on #scheduling ===== */
(function(){
 const BUILD='V2.06.15';
 function showBuild(){
  if(location.hash!=='#scheduling'||document.querySelector('[data-scheduling-build]'))return;
  const toolbar=document.querySelector('.schedule-toolbar');
  if(!toolbar)return;
  const badge=document.createElement('small');
  badge.dataset.schedulingBuild='';
  badge.className='scheduling-build-badge';
  badge.textContent=`排班核心 ${BUILD}`;
  toolbar.insertAdjacentElement('beforebegin',badge);
 }
 if(location.hash==='#scheduling'){
  requestAnimationFrame(()=>{
   window.dispatchEvent(new HashChangeEvent('hashchange'));
   requestAnimationFrame(showBuild);
  });
 }
 window.addEventListener('hashchange',()=>requestAnimationFrame(showBuild));
})();

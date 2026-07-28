(function(){
  'use strict';
  const EMPLOYEE_ID=(window.BOMBHR_APP_EMPLOYEE||{employeeId:'AB00008'}).employeeId;
  const EMPLOYEE_NAME=(window.BOMBHR_APP_EMPLOYEE||{name:'佑'}).name;
  const KEYS={
    schedules:'bombhr-schedules-v176',
    events:'bombhr-demo-events',
    applications:'bombhr-leave-applications',
    payroll:'bombhr-payroll-adjustments-v123',
    ledger:'bombhr-employee-leave-ledger-v175',
    rules:'bombhr-leave-rules-v175'
  };
  const leaveCodes={'年假／特休':'年','特休':'年','年假':'年','旅遊假':'旅','喪假':'喪','婚假':'婚','病假':'病','事假':'事','產假':'產','陪產假':'陪','公假':'公','教召':'召','事外':'事','病外':'病'};
  const read=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value===null?fallback:value}catch(e){return fallback}};
  const dateKey=value=>{
    if(!value)return '';
    if(/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return String(value);
    const date=new Date(value);
    return Number.isNaN(date.getTime())?'':date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
  };
  const periodParts=event=>{
    const parts=String(event.period||'').split(/[–~至]/).map(v=>v.trim());
    return [dateKey(parts[0]||event.startDate),dateKey(parts[1]||parts[0]||event.endDate)];
  };
  const eventType=event=>event.leaveType||String(event.title||'').replace(/申請$/,'')||'休假';
  const eventId=event=>String(event.id||event.eventId||'');
  const isMine=event=>String(event.employeeId||'')===EMPLOYEE_ID||(!event.employeeId&&event.employee===EMPLOYEE_NAME);
  const approvedLeaves=()=>read(KEYS.events,[]).filter(event=>isMine(event)&&event.subtype==='leave'&&event.status==='approved');
  const schedules=()=>read(KEYS.schedules,[]).filter(row=>String(row.employeeId||'')===EMPLOYEE_ID);
  const covers=(event,date)=>{
    if(Array.isArray(event.dates)&&event.dates.length)return event.dates.map(dateKey).includes(date);
    const [start,end]=periodParts(event);
    return start&&date>=start&&date<=(end||start);
  };
  const leaveForDate=date=>approvedLeaves().find(event=>covers(event,date));
  const scheduleForDate=date=>schedules().find(row=>dateKey(row.date)===date);
  const typeCode=type=>leaveCodes[type]||String(type||'假').slice(0,1);
  const scheduleCode=row=>String(row?.code||row?.shiftCode||'1').trim();
  const isLeaveCode=code=>code&&code!=='1'&&code!=='班'&&code!=='休';
  const typeFromCode=code=>Object.keys(leaveCodes).find(type=>leaveCodes[type]===code)||({休:'休假'}[code]||code||'休假');

  function importSharedApplications(){
    const shared=read(KEYS.events,[]).filter(event=>isMine(event)&&event.subtype==='leave');
    let apps=Array.isArray(leaveApplications)?leaveApplications:read(KEYS.applications,[]);
    let changed=false;
    shared.forEach(event=>{
      const id=eventId(event);
      if(!id)return;
      const [start,end]=periodParts(event);
      const normalized={
        id,
        type:eventType(event),
        start:start||'',
        end:end||start||'',
        duration:event.duration||((event.leaveDays||0)+' 天'),
        agent:event.agent||'由主管／人事代建',
        reason:event.reason||'由後台排班建立',
        status:event.status||'review',
        statusText:event.statusText||(event.status==='approved'?'已核准':event.status==='rejected'?'已退回':'主管審核中'),
        submitted:event.submitted||event.createdAt||new Date().toLocaleString('zh-TW',{hour12:false}),
        rejectReason:event.rejectReason||'',
        createdByAdmin:event.source==='admin-schedule',
        reviewer:event.reviewer||''
      };
      const index=apps.findIndex(item=>String(item.id)===id);
      if(index<0){apps.push(normalized);changed=true;return}
      const old=apps[index];
      ['status','statusText','rejectReason','duration','start','end','type','reviewer'].forEach(key=>{
        if(normalized[key]!==undefined&&old[key]!==normalized[key]){old[key]=normalized[key];changed=true}
      });
    });
    apps.sort((a,b)=>String(b.submitted||'').localeCompare(String(a.submitted||'')));
    leaveApplications=apps;
    if(changed)localStorage.setItem(KEYS.applications,JSON.stringify(apps));
    if(typeof window.renderLeaveApplications==='function')window.renderLeaveApplications();
    return changed;
  }

  function ensureBalancePanel(){
    if(document.getElementById('appLeaveBalance'))return;
    const card=document.querySelector('#leaveFormPane .card');
    if(!card)return;
    const heading=document.createElement('div');
    heading.className='app-sync-title';
    heading.innerHTML='<b>我的假別額度</b><small>已連動人事資料</small>';
    const panel=document.createElement('div');
    panel.id='appLeaveBalance';
    panel.className='app-leave-balance';
    card.prepend(panel);
    card.prepend(heading);
  }

  function renderBalances(){
    ensureBalancePanel();
    const panel=document.getElementById('appLeaveBalance');
    if(!panel||!window.BOMBHR_HR_LEDGER)return;
    const policy=window.BOMBHR_HR_LEDGER.annualPolicy?.()||{};
    const heading=panel.previousElementSibling;
    if(policy.employeeCanViewBalance===false){panel.hidden=true;if(heading)heading.hidden=true;return}
    panel.hidden=false;if(heading)heading.hidden=false;
    panel.innerHTML=window.BOMBHR_HR_LEDGER.summary(EMPLOYEE_ID).map(item=>
      '<div class="app-balance-item"><span>'+item.rule.name+'</span><b>'+item.remaining+' '+(item.rule.unit||'天')+'</b><small>已使用 '+item.used+' '+(item.rule.unit||'天')+'</small></div>'
    ).join('');
    if(policy.employeeCanViewSettlement){
      const records=window.BOMBHR_HR_LEDGER.annualSettlements?.().filter(x=>x.employeeId===EMPLOYEE_ID)||[];
      records.slice(0,1).forEach(x=>panel.insertAdjacentHTML('beforeend','<div class="app-balance-item app-annual-settlement"><span>'+x.year+' 年年假結算</span><b>未休 '+x.unused+' 天</b><small>折算工資 NT$ '+Number(x.amount||0).toLocaleString('zh-TW')+'</small></div>'));
    }
  }

  function renderLinkedPayroll(){
    const label=document.getElementById('salaryMonthLabel');
    const card=label?.closest('.card');
    if(!card)return;
    let linked=document.getElementById('salaryLinkedAdjustments');
    if(!linked){linked=document.createElement('div');linked.id='salaryLinkedAdjustments';card.appendChild(linked)}
    const policy=window.BOMBHR_HR_LEDGER?.annualPolicy?.()||{};
    const items=(read(KEYS.payroll,{})[EMPLOYEE_ID]||[]).filter(item=>policy.employeeCanViewSettlement||!String(item.eventId||'').startsWith('ANNUAL-'));
    const total=items.reduce((sum,item)=>sum+(item.type==='加給'?Number(item.amount||0):-Number(item.amount||0)),0);
    linked.innerHTML=items.length
      ?items.map(item=>'<div class="info-row"><span>'+item.name+'<small class="app-linked-note">・假勤自動連動</small></span><b>'+(item.type==='加給'?'+':'-')+Number(item.amount||0).toLocaleString('zh-TW')+'</b></div>').join('')
      :'<div class="readonly-note">目前沒有由請假或遲到連動的薪資扣款。</div>';
    const net=57000+total;
    const netNode=label.parentElement?.querySelector('b');
    if(netNode)netNode.textContent='TWD '+net.toLocaleString('zh-TW');
  }

  function renderSharedCalendar(){
    const grid=document.getElementById('dynamicCalendar');
    const title=document.getElementById('calendarMonthTitle');
    if(!grid||!calendarCursor)return;
    const year=calendarCursor.getFullYear(),month=calendarCursor.getMonth();
    if(title)title.textContent=year+' 年 '+(month+1)+' 月';
    const firstDay=new Date(year,month,1).getDay();
    const daysInMonth=new Date(year,month+1,0).getDate();
    const prevDays=new Date(year,month,0).getDate();
    const today=new Date();
    const monthPrefix=year+'-'+String(month+1).padStart(2,'0');
    const hasSharedData=schedules().some(row=>dateKey(row.date).startsWith(monthPrefix))||approvedLeaves().some(event=>periodParts(event).some(date=>date.startsWith(monthPrefix)));
    let html='<b>日</b><b>一</b><b>二</b><b>三</b><b>四</b><b>五</b><b>六</b>';
    for(let i=firstDay-1;i>=0;i--)html+='<span class="day muted-day">'+(prevDays-i)+'</span>';
    for(let day=1;day<=daysInMonth;day++){
      const date=new Date(year,month,day),key=monthPrefix+'-'+String(day).padStart(2,'0');
      const leave=leaveForDate(key),row=scheduleForDate(key),code=leave?typeCode(eventType(leave)):scheduleCode(row);
      const isToday=date.toDateString()===today.toDateString();
      const isSelected=date.toDateString()===selectedCalendarDate.toDateString();
      const fallbackWork=!hasSharedData&&date.getDay()!==0&&date.getDay()!==6;
      const work=(row&&(code==='1'||code==='班'))||fallbackWork;
      const leaveDay=Boolean(leave)||isLeaveCode(code);
      const classes=['day'];
      if(work)classes.push('shift');
      if(leaveDay)classes.push('leave-day');
      if(isToday)classes.push('today');
      if(isSelected)classes.push('selected-day');
      const marker=leaveDay?'<i class="app-schedule-code">'+(leave?typeCode(eventType(leave)):code)+'</i>':(row&&work?'<i class="app-schedule-code">班</i>':'');
      html+='<button class="'+classes.join(' ')+'" onclick="selectCalendarDate(\''+key+'\',this)">'+day+marker+'</button>';
    }
    const trailing=(7-((firstDay+daysInMonth)%7))%7;
    for(let day=1;day<=trailing;day++)html+='<span class="day muted-day">'+day+'</span>';
    grid.innerHTML=html;
  }

  function selectSharedDate(dateString,button){
    selectedCalendarDate=new Date(dateString+'T12:00:00');
    document.querySelectorAll('#dynamicCalendar button.day').forEach(el=>el.classList.remove('selected-day'));
    if(button)button.classList.add('selected-day');
    const badge=document.getElementById('selectedShiftBadge'),title=document.getElementById('selectedShiftTitle');
    const meta=document.getElementById('selectedShiftMeta'),selected=document.getElementById('selectedDateText');
    if(selected&&typeof window.formatZhDate==='function')selected.textContent=formatZhDate(selectedCalendarDate,true);
    const leave=leaveForDate(dateString),row=scheduleForDate(dateString),code=scheduleCode(row);
    if(leave||isLeaveCode(code)){
      const type=leave?eventType(leave):typeFromCode(code);
      if(badge)badge.textContent='已核准・'+type;
      if(title)title.textContent=type;
      if(meta)meta.textContent=(leave?.reason||row?.note||'已同步至人事假勤與班表')+'・人事資料已連動';
    }else if(row&&(code==='1'||code==='班')){
      if(badge)badge.textContent='已排班';
      if(title)title.textContent=(row.shiftName||'日班')+' '+(row.start||row.startTime||'09:00')+'–'+(row.end||row.endTime||'18:00');
      if(meta)meta.textContent=(row.site||row.location||'台中總公司')+'・由公司班表同步';
    }else{
      if(badge)badge.textContent='休假日';
      if(title)title.textContent='今日無排定班別';
      if(meta)meta.textContent='如有臨時排班，將由主管另行通知';
    }
  }

  let lastSignature='';
  function signature(){return [localStorage.getItem(KEYS.schedules)||'',localStorage.getItem(KEYS.events)||'',localStorage.getItem(KEYS.ledger)||'',localStorage.getItem(KEYS.payroll)||''].join('|')}
  function refresh(showNotice){
    const before=lastSignature;
    const changed=importSharedApplications();
    renderBalances();
    renderLinkedPayroll();
    renderSharedCalendar();
    if(selectedCalendarDate)selectSharedDate(dateKey(selectedCalendarDate),document.querySelector('#dynamicCalendar .selected-day'));
    lastSignature=signature();
    if(showNotice&&(changed||before&&before!==lastSignature)&&typeof window.toast==='function')toast('Employee App 班表與人事資料已更新');
  }

  window.renderCalendar=renderSharedCalendar;
  window.selectCalendarDate=selectSharedDate;
  window.syncApprovalResults=function(){refresh(false)};
  const originalSwitch=window.switchLeavePane;
  if(originalSwitch)window.switchLeavePane=function(id,button){originalSwitch(id,button);if(id==='leaveFormPane'||id==='leaveRecordPane')refresh(false)};
  window.addEventListener('storage',event=>{if(Object.values(KEYS).includes(event.key))refresh(true)});
  window.addEventListener('bombhr-demo-update',()=>refresh(true));
  window.addEventListener('focus',()=>refresh(false));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh(false)});
  try{const channel=new BroadcastChannel('bombhr-demo');channel.addEventListener('message',()=>refresh(true))}catch(e){}
  window.setInterval(()=>{if(signature()!==lastSignature)refresh(true)},1500);
  refresh(false);
})();

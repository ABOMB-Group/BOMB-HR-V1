(function(){
 const defaults={
  '前端工程師':{required:['健康檢查／體檢證明'],recommended:['資訊技術／資訊安全證照']},
  '全端工程師':{required:['健康檢查／體檢證明'],recommended:['資訊技術／資訊安全證照']},
  '專員':{required:['健康檢查／體檢證明'],recommended:['專案管理證照']},
  '企劃-經理辦公室':{required:['健康檢查／體檢證明'],recommended:['專案管理證照']},
  '技術企劃':{required:['健康檢查／體檢證明'],recommended:['專案管理證照','資訊技術／資訊安全證照']},
  'CS主管':{required:['健康檢查／體檢證明'],recommended:['專案管理證照']},
  'CS組長':{required:['健康檢查／體檢證明'],recommended:[]},
  '技術長':{required:['健康檢查／體檢證明'],recommended:['資訊技術／資訊安全證照']},
  '美編設計師':{required:['健康檢查／體檢證明'],recommended:['設計軟體／視覺設計證照']},
  '設計師':{required:['健康檢查／體檢證明'],recommended:['設計軟體／視覺設計證照']},
  '主管':{required:['健康檢查／體檢證明'],recommended:['專案管理證照']}
 };
 const types=['健康檢查／體檢證明','CPR＋AED急救訓練證明','工作場所急救人員結業證書','資訊技術／資訊安全證照','設計軟體／視覺設計證照','專案管理證照','其他專業證照'];
 const key='bombhr-certificate-requirements-v151';
 const read=()=>{try{const saved=JSON.parse(localStorage.getItem(key)||'{}'),merged={...defaults,...saved},map=type=>['資訊技術專業證照','雲端／系統管理證照','資訊安全證照'].includes(type)?'資訊技術／資訊安全證照':type;Object.values(merged).forEach(rule=>{rule.required=[...new Set((rule.required||[]).map(map).filter(type=>types.includes(type)))];rule.recommended=[...new Set((rule.recommended||[]).map(map).filter(type=>types.includes(type)&&type!=='CPR＋AED急救訓練證明'&&!rule.required.includes(type)))]});return merged}catch(e){return JSON.parse(JSON.stringify(defaults))}};
 const save=value=>localStorage.setItem(key,JSON.stringify(value));
 const normalize=position=>defaults[position]?position:position.includes('前端')?'前端工程師':position.includes('全端')?'全端工程師':position.includes('設計')?'設計師':position.includes('專員')?'專員':position;
 window.BOMBHR_CERTIFICATE_TYPES=types;
 window.BOMBHR_CERTIFICATE_REQUIREMENTS={key,defaults,read,save,forPosition(position){const all=read();return all[normalize(position)]||{required:['健康檢查／體檢證明'],recommended:[]}}};
})();

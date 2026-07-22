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

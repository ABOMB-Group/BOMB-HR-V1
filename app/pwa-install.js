(()=>{
  let promptEvent=null;
  const installRequested=new URLSearchParams(location.search).get('install')==='1';
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
  const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  function notify(message){
    let el=document.getElementById('pwaInstallNotice');
    if(!el){el=document.createElement('div');el.id='pwaInstallNotice';el.innerHTML='<div><b>BOMB HR Employee App</b><p></p></div><button type="button">關閉</button>';Object.assign(el.style,{position:'fixed',left:'50%',bottom:'88px',transform:'translateX(-50%)',zIndex:'99999',width:'min(420px,calc(100% - 28px))',padding:'14px 16px',borderRadius:'16px',background:'#111c30',color:'#fff',boxShadow:'0 18px 50px rgba(0,0,0,.35)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'});el.querySelector('p').style.cssText='margin:3px 0 0;font-size:12px;color:#b9c6d9;line-height:1.5';el.querySelector('button').style.cssText='border:0;border-radius:9px;padding:8px 11px;background:#2f6df6;color:#fff';el.querySelector('button').onclick=()=>el.remove();document.body.append(el)}
    el.querySelector('p').textContent=message;
  }
  async function install(){
    if(isStandalone){notify('這個裝置已經安裝 BOMB HR Employee App。');return}
    if(promptEvent){promptEvent.prompt();await promptEvent.userChoice;promptEvent=null;return}
    const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
    notify(isiOS?'請點 Safari 的「分享」按鈕，再選擇「加入主畫面」。':'請開啟瀏覽器選單，選擇「安裝應用程式」或「加到主畫面」。');
  }
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;if(installRequested)setTimeout(install,500)});
  window.addEventListener('appinstalled',()=>notify('安裝完成！現在可從主畫面開啟 BOMB HR。'));
  if(installRequested&&!isStandalone)setTimeout(()=>{if(!promptEvent)install()},1400);
})();

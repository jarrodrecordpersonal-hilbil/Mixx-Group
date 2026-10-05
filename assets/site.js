const b=document.querySelector('.menu-button');
const n=document.querySelector('.nav');
if(b&&n){
  const close=()=>{n.classList.remove('open');b.setAttribute('aria-expanded','false')};
  b.addEventListener('click',()=>{const open=n.classList.toggle('open');b.setAttribute('aria-expanded',open?'true':'false')});
  n.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&n.classList.contains('open')){close();b.focus()}});
  window.addEventListener('resize',()=>{if(window.innerWidth>1000)close()});
}
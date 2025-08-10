// v9 — без TTS, улучшена читаемость и стабильность
import { DATA } from './data.js?v=9';

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

let currentTab = localStorage.getItem('tab') || 'phrases';
let order = [];
let idx = 0;

function shuffle(a){
  for (let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function preparePool(tab){
  order = shuffle([...DATA[tab]]);
  idx = 0;
}

function render(item){
  $('#tt').textContent = item.tt || '';
  $('#tr').textContent = item.tr ? `[${item.tr}]` : '';
  $('#ru').textContent = item.ru || '';
  $('#bar').style.width = `${((idx+1)/order.length)*100}%`;
}

function next(){
  idx = (idx + 1) % order.length;
  render(order[idx]);
}

function setTab(tab){
  currentTab = tab;
  localStorage.setItem('tab', tab);
  $$('.tab').forEach(b=>{
    const active = b.dataset.tab === tab;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-selected', String(active));
  });
  preparePool(tab);
  render(order[idx]);
}

$('#nextBtn').addEventListener('click', next);

$('#copyBtn').addEventListener('click', async ()=>{
  const t = `${$('#tt').textContent}\n${$('#tr').textContent}\n${$('#ru').textContent}`.trim();
  try{
    await navigator.clipboard.writeText(t);
    toast('Скопировано');
  }catch{ toast('Не удалось скопировать'); }
});

$('#shareBtn').addEventListener('click', async ()=>{
  const text = `${$('#tt').textContent} — ${$('#ru').textContent}`;
  if (navigator.share) {
    try { await navigator.share({ text, title: 'TATARÇA' }); } catch {}
  } else {
    try { await navigator.clipboard.writeText(text); toast('Текст скопирован'); } catch {}
  }
});

$$('.tab').forEach(b => b.addEventListener('click', ()=> setTab(b.dataset.tab)));

function toast(msg){
  const el = document.createElement('div');
  el.textContent = msg;
  Object.assign(el.style,{
    position:'fixed', left:'50%', bottom:'20px', transform:'translateX(-50%)',
    background:'#2b2752', color:'#fff', padding:'10px 14px',
    borderRadius:'14px', zIndex:9999, fontWeight:800, boxShadow:'0 10px 24px rgba(0,0,0,.2)'
  });
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 1400);
}

// старт
setTab(currentTab);

// PWA SW
const V='9';
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> {
    navigator.serviceWorker.register(`service-worker.js?v=${V}`).catch(()=>{});
  });
}
